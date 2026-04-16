'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generate } from '@/lib/ai/generate/generate'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { checkLimit } from '@/lib/billing/check-limit'
import { getContentItem } from '@/lib/content/get-content-item'
import { createClient } from '@/lib/supabase/server'
import { deleteOutputsForContent } from '@/lib/outputs/delete-outputs-for-content'
import { deleteSingleOutput } from '@/lib/outputs/delete-single-output'
import {
  generateOutputsSchema,
  regenerateOutputSchema,
  transitionStateSchema,
  updateOutputSchema,
} from '@/lib/outputs/schemas'
import { renderOutputMarkdown } from '@/lib/outputs/render-markdown'
import { runOnePlatform } from '@/lib/outputs/run-one-platform'
import { toggleOutputStar } from '@/lib/outputs/star-output'
import { transitionOutputState } from '@/lib/outputs/transition-output-state'
import { updateOutput } from '@/lib/outputs/update-output'
import type { OutputPlatform } from '@/lib/supabase/types'
import { notifyOutputsGenerated, notifyOutputApproved } from '@/lib/notifications/triggers'
import { triggerWebhooks } from '@/lib/webhooks/trigger-webhook'
import { dispatchIntegrations } from '@/lib/integrations/dispatch-integrations'

// NOTE: `export const maxDuration = 300` lives on the route segment
// (outputs/page.tsx). Next 14 'use server' modules may only export
// async functions — the const must be on the page. Server Actions
// inherit the segment's maxDuration.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GenerateOutputsState =
  | { ok?: undefined; error?: string }
  | {
      ok: true
      generated: OutputPlatform[]
      failed: Array<{ platform: OutputPlatform; error: string }>
    }
  | {
      ok: false
      code: 'no_key' | 'content_not_ready' | 'decrypt_failed' | 'unknown'
      error: string
    }

const PLATFORMS: readonly OutputPlatform[] = [
  'tiktok',
  'instagram_reels',
  'youtube_shorts',
  'linkedin',
]

// ---------------------------------------------------------------------------
// Generate outputs action
// ---------------------------------------------------------------------------

export async function generateOutputsAction(
  _prev: GenerateOutputsState,
  formData: FormData,
): Promise<GenerateOutputsState> {
  const parsed = generateOutputsSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    target_language: formData.get('target_language') ?? 'en',
  })
  if (!parsed.success) {
    return {
      ok: false,
      code: 'unknown',
      error: parsed.error.issues[0]?.message ?? 'Invalid input.',
    }
  }

  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const outputLimit = await checkLimit(parsed.data.workspace_id, 'outputs')
  if (!outputLimit.ok) {
    return { ok: false, code: 'unknown', error: outputLimit.message ?? 'Monthly output limit reached. Upgrade your plan.' }
  }

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item) {
    return { ok: false, code: 'unknown', error: 'Content item not found.' }
  }
  if (item.status !== 'ready' || !item.transcript || item.transcript.length === 0) {
    return {
      ok: false,
      code: 'content_not_ready',
      error: 'Content has no transcript yet. Wait for it to finish, or retry.',
    }
  }

  // Cost signal for overly long transcripts. All three providers accept 100k+
  // context in April 2026, so this isn't a hard block — just a log.
  if (item.transcript.length > 30_000) {
    // eslint-disable-next-line no-console
    console.warn(
      '[generateOutputsAction] long transcript',
      `content_id=${parsed.data.content_id}`,
      `chars=${item.transcript.length}`,
    )
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'decrypt_failed',
      error: pick.message,
    }
  }

  // Extract narrowed values into locals — TypeScript loses the discriminated-
  // union narrowing for `pick` and the defaulted `parsed.data` when we hand
  // them to Promise.allSettled callbacks.
  const workspaceId = parsed.data.workspace_id
  const contentId = parsed.data.content_id
  const targetLanguage = parsed.data.target_language ?? 'en'
  const userId = user.id
  const provider = pick.provider
  const apiKey = pick.apiKey
  const model = DEFAULT_MODELS[provider]
  const transcript = item.transcript
  const sourceKind = item.kind
  const title = item.title ?? 'Untitled'

  // Idempotent regenerate: wipe existing outputs (CASCADE takes output_states)
  // then re-insert from the current generation run.
  const cleared = await deleteOutputsForContent(contentId, workspaceId)
  if (!cleared.ok) {
    return { ok: false, code: 'unknown', error: cleared.error }
  }

  const settled = await Promise.allSettled(
    PLATFORMS.map((platform) =>
      runOnePlatform({
        platform,
        transcript,
        sourceKind,
        sourceTitle: title,
        provider,
        apiKey,
        model,
        workspaceId,
        contentId,
        userId,
        targetLanguage,
      }),
    ),
  )

  const generated: OutputPlatform[] = []
  const failed: Array<{ platform: OutputPlatform; error: string }> = []

  settled.forEach((result, idx) => {
    const platform = PLATFORMS[idx]!
    if (result.status === 'fulfilled') {
      if (result.value.ok) {
        generated.push(platform)
      } else {
        failed.push({ platform, error: result.value.error ?? 'Unknown error.' })
      }
    } else {
      failed.push({
        platform,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error.',
      })
    }
  })

  revalidatePath(`/workspace/${workspaceId}/content/${contentId}/outputs`)
  revalidatePath(`/workspace/${workspaceId}/content/${contentId}`)

  // Fire-and-forget webhook for output.generated
  if (generated.length > 0) {
    triggerWebhooks(workspaceId, 'output.generated', {
      content_id: contentId,
      title,
      platforms: generated,
      failed: failed.map((f) => f.platform),
    })

    // Fire-and-forget notification
    try {
      notifyOutputsGenerated({
        userId,
        workspaceId,
        contentTitle: title,
        contentId,
        platformCount: generated.length,
      })
    } catch {}
  }

  return { ok: true, generated, failed }
}

// ---------------------------------------------------------------------------
// Update output action (inline edit)
// ---------------------------------------------------------------------------

export type UpdateOutputState =
  | { ok?: undefined; error?: string }
  | { ok: true }
  | { ok: false; error: string }

export async function updateOutputAction(
  _prev: UpdateOutputState,
  formData: FormData,
): Promise<UpdateOutputState> {
  const parsed = updateOutputSchema.safeParse({
    output_id: formData.get('output_id'),
    workspace_id: formData.get('workspace_id'),
    platform: formData.get('platform'),
    hook: formData.get('hook') ?? '',
    script: formData.get('script') ?? '',
    caption: formData.get('caption'),
    hashtags: formData.get('hashtags'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const { output_id, workspace_id, platform, caption, hashtags } = parsed.data
  // LinkedIn has no hook/script — default to empty string.
  const hook = platform === 'linkedin' ? '' : (parsed.data.hook ?? '')
  const script = platform === 'linkedin' ? '' : (parsed.data.script ?? '')

  const structured = { hook, script, caption, hashtags }
  const body = renderOutputMarkdown(platform, structured)

  const result = await updateOutput({ outputId: output_id, workspaceId: workspace_id, body, structured })
  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath(`/workspace/${workspace_id}/content`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Transition output state action
// ---------------------------------------------------------------------------

export type TransitionOutputStateState =
  | { ok?: undefined; error?: string }
  | { ok: true }
  | { ok: false; error: string }

export async function transitionOutputStateAction(
  _prev: TransitionOutputStateState,
  formData: FormData,
): Promise<TransitionOutputStateState> {
  const parsed = transitionStateSchema.safeParse({
    output_id: formData.get('output_id'),
    workspace_id: formData.get('workspace_id'),
    new_state: formData.get('new_state'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const { output_id, workspace_id, new_state } = parsed.data
  const result = await transitionOutputState({
    outputId: output_id,
    workspaceId: workspace_id,
    newState: new_state,
    changedBy: user.id,
  })
  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath(`/workspace/${workspace_id}/content`)

  // Fire-and-forget webhook when output is approved
  if (new_state === 'approved') {
    triggerWebhooks(workspace_id, 'output.approved', {
      output_id,
      new_state,
    })

    // Fire-and-forget notification — resolve output details in background
    try {
      void (async () => {
        try {
          const sb = createClient()
          const { data: out } = await sb
            .from('outputs')
            .select('platform, content_id')
            .eq('id', output_id)
            .eq('workspace_id', workspace_id)
            .maybeSingle()
          if (!out) return
          const { data: ci } = await sb
            .from('content_items')
            .select('title')
            .eq('id', out.content_id)
            .eq('workspace_id', workspace_id)
            .maybeSingle()
          notifyOutputApproved({
            userId: user.id,
            workspaceId: workspace_id,
            platform: out.platform ?? '',
            contentTitle: ci?.title ?? 'Untitled',
            contentId: out.content_id,
          })
        } catch {}
      })()
    } catch {}
  }

  // Fire-and-forget integration dispatch for approved / exported
  if (new_state === 'approved' || new_state === 'exported') {
    try {
      void (async () => {
        try {
          const sb = createClient()
          const { data: out } = await sb
            .from('outputs')
            .select('platform, body, content_id')
            .eq('id', output_id)
            .eq('workspace_id', workspace_id)
            .maybeSingle()
          if (!out) return
          const { data: ci } = await sb
            .from('content_items')
            .select('title')
            .eq('id', out.content_id)
            .eq('workspace_id', workspace_id)
            .maybeSingle()
          const event = new_state === 'approved' ? 'output.approved' as const : 'output.exported' as const
          dispatchIntegrations(workspace_id, event, {
            title: ci?.title ?? 'Untitled',
            body: (out.body as string | null) ?? undefined,
            platform: out.platform ?? undefined,
            workspaceUrl: `/workspace/${workspace_id}/content/${out.content_id}/outputs`,
          })
        } catch {}
      })()
    } catch {}
  }

  return { ok: true }
}

// ---------------------------------------------------------------------------
// Regenerate single platform action
// ---------------------------------------------------------------------------

export type RegenerateOutputState =
  | { ok?: undefined; error?: string }
  | { ok: true }
  | { ok: false; code: 'no_key' | 'content_not_ready' | 'decrypt_failed' | 'unknown'; error: string }

export async function regenerateOutputAction(
  _prev: RegenerateOutputState,
  formData: FormData,
): Promise<RegenerateOutputState> {
  const parsed = regenerateOutputSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    output_id: formData.get('output_id'),
    platform: formData.get('platform'),
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const { workspace_id, content_id, output_id, platform } = parsed.data

  const item = await getContentItem(content_id, workspace_id)
  if (!item) {
    return { ok: false, code: 'unknown', error: 'Content item not found.' }
  }
  if (item.status !== 'ready' || !item.transcript || item.transcript.length === 0) {
    return { ok: false, code: 'content_not_ready', error: 'Content has no transcript yet.' }
  }

  const pick = await pickGenerationProvider(workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'decrypt_failed',
      error: pick.message,
    }
  }

  const provider = pick.provider
  const apiKey = pick.apiKey
  const model = DEFAULT_MODELS[provider]

  // Delete the existing output for this platform (if any).
  const deleted = await deleteSingleOutput(output_id, workspace_id)
  if (!deleted.ok) {
    return { ok: false, code: 'unknown', error: deleted.error }
  }

  const result = await runOnePlatform({
    platform,
    transcript: item.transcript,
    sourceKind: item.kind,
    sourceTitle: item.title ?? 'Untitled',
    provider,
    apiKey,
    model,
    workspaceId: workspace_id,
    contentId: content_id,
    userId: user.id,
  })

  if (!result.ok) {
    return { ok: false, code: 'unknown', error: result.error }
  }

  revalidatePath(`/workspace/${workspace_id}/content/${content_id}/outputs`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// SEO suggestions
// ---------------------------------------------------------------------------

export interface SeoResult {
  primary_keyword: string
  secondary_keywords: string[]
  seo_title: string
  meta_description: string
  hashtag_strategy: string
}

export type GetSeoSuggestionsState =
  | { ok?: undefined }
  | { ok: true; seo: SeoResult }
  | { ok: false; error: string }

export async function getSeoSuggestionsAction(
  _prev: GetSeoSuggestionsState,
  formData: FormData,
): Promise<GetSeoSuggestionsState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const contentId = formData.get('content_id')?.toString() ?? ''

  if (!workspaceId || !contentId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(contentId, workspaceId)
  if (!item?.transcript) return { ok: false, error: 'Content has no transcript.' }

  const supabase = createClient()
  const { data: outputs } = await supabase
    .from('outputs')
    .select('id, metadata, body')
    .eq('content_id', contentId)
    .eq('workspace_id', workspaceId)

  const outputsSummary = (outputs ?? [])
    .map((o) => (o.body as string | null)?.slice(0, 200) ?? '')
    .filter(Boolean)
    .join('\n---\n')

  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) return { ok: false, error: pick.message }

  const systemPrompt =
    'You are an SEO expert for social media content. Analyze the provided content and return a JSON object with: { "primary_keyword": string, "secondary_keywords": string[] (3-5 items), "seo_title": string (max 60 chars, SEO-optimized), "meta_description": string (max 155 chars), "hashtag_strategy": string (brief advice on hashtag usage) }. Return only valid JSON.'
  const userPrompt =
    item.transcript.slice(0, 3000) +
    '\n\nGenerated outputs summary: ' +
    outputsSummary

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) return { ok: false, error: gen.message }

  let seoResult: SeoResult | null = null
  try {
    const raw = gen.json as unknown
    if (
      typeof raw === 'object' &&
      raw !== null &&
      'primary_keyword' in raw
    ) {
      seoResult = raw as SeoResult
    } else if (typeof raw === 'string') {
      seoResult = JSON.parse(raw) as SeoResult
    } else {
      const obj = raw as Record<string, unknown>
      const candidate = Object.values(obj)[0]
      if (typeof candidate === 'object' && candidate !== null) {
        seoResult = candidate as SeoResult
      } else if (typeof candidate === 'string') {
        seoResult = JSON.parse(candidate) as SeoResult
      }
    }
  } catch {
    return { ok: false, error: 'Could not parse SEO response.' }
  }

  if (!seoResult?.primary_keyword) {
    return { ok: false, error: 'SEO response is missing expected fields.' }
  }

  // Update all outputs for this content with the SEO result
  const { data: allOutputs } = await supabase
    .from('outputs')
    .select('id, metadata')
    .eq('content_id', contentId)
    .eq('workspace_id', workspaceId)

  await Promise.all(
    (allOutputs ?? []).map((o) =>
      supabase
        .from('outputs')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ metadata: { ...((o.metadata as object) ?? {}), seo: seoResult } as any })
        .eq('id', o.id),
    ),
  )

  revalidatePath(`/workspace/${workspaceId}/content/${contentId}/outputs`)
  return { ok: true, seo: seoResult }
}

// ---------------------------------------------------------------------------
// Performance tracking
// ---------------------------------------------------------------------------

import { z as zod } from 'zod'

const performanceSchema = zod.object({
  workspace_id: zod.string().uuid(),
  output_id: zod.string().uuid(),
  rating: zod.coerce.number().int().min(1).max(5),
  note: zod.string().max(200).optional().default(''),
})

export interface PerformanceData {
  rating: number
  note: string
  recorded_at: string
}

export type SaveOutputPerformanceState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function saveOutputPerformanceAction(
  _prev: SaveOutputPerformanceState,
  formData: FormData,
): Promise<SaveOutputPerformanceState> {
  const parsed = performanceSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    output_id: formData.get('output_id'),
    rating: formData.get('rating'),
    note: formData.get('note') ?? '',
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { data: output, error: fetchError } = await supabase
    .from('outputs')
    .select('id, metadata')
    .eq('id', parsed.data.output_id)
    .eq('workspace_id', parsed.data.workspace_id)
    .maybeSingle()

  if (fetchError || !output) {
    return { ok: false, error: 'Output not found.' }
  }

  const existingMetadata =
    output.metadata && typeof output.metadata === 'object' && !Array.isArray(output.metadata)
      ? (output.metadata as Record<string, unknown>)
      : {}

  const performance: PerformanceData = {
    rating: parsed.data.rating,
    note: parsed.data.note,
    recorded_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('outputs')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: { ...existingMetadata, performance } as any })
    .eq('id', parsed.data.output_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Star / unstar output
// ---------------------------------------------------------------------------

export type StarOutputState = { ok?: boolean; error?: string }

export async function starOutputAction(
  _prev: StarOutputState,
  formData: FormData,
): Promise<StarOutputState> {
  const outputId = formData.get('output_id')?.toString() ?? ''
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const starred = formData.get('starred') === 'true'

  if (!outputId || !workspaceId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const result = await toggleOutputStar(outputId, workspaceId, starred)
  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath(`/workspace/${workspaceId}/content`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// AI Coach feedback
// ---------------------------------------------------------------------------

export type AiCoachFeedbackState =
  | { ok?: undefined }
  | { ok: true; feedback: string }
  | { ok: false; error: string }

export async function getAiCoachFeedbackAction(
  _prev: AiCoachFeedbackState,
  formData: FormData,
): Promise<AiCoachFeedbackState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const outputBodies = formData.get('output_bodies')?.toString() ?? ''

  if (!workspaceId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) return { ok: false, error: pick.message }

  const systemPrompt =
    'You are a social media content coach. Give concise, direct, actionable feedback. Format your response as a numbered list of 3 specific improvements. No preamble, no fluff.'
  const userPrompt = `Review these platform drafts and give 3 specific, actionable improvements:\n\n${outputBodies.slice(0, 4000)}`

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) return { ok: false, error: gen.message }

  // The generate function returns structured JSON — the model's coaching text
  // will land in the hook or caption field depending on provider. Extract the
  // most content-rich field as plain text feedback.
  const raw = gen.json as unknown as Record<string, unknown>
  const feedback =
    [raw.hook, raw.script, raw.caption]
      .filter((v): v is string => typeof v === 'string' && v.length > 0)
      .sort((a, b) => b.length - a.length)[0] ?? ''

  if (!feedback) return { ok: false, error: 'No feedback generated. Try again.' }

  return { ok: true, feedback }
}

// ---------------------------------------------------------------------------
// Hook variants — 4 styles for any output's hook
// ---------------------------------------------------------------------------

export interface HookVariant {
  style: string
  hook: string
}

export type HookVariantsState =
  | { ok?: undefined }
  | { ok: true; variants: HookVariant[] }
  | { ok: false; error: string }

export async function generateHookVariantsAction(
  _prev: HookVariantsState,
  formData: FormData,
): Promise<HookVariantsState> {
  const outputId = formData.get('output_id')?.toString() ?? ''
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const contentId = formData.get('content_id')?.toString() ?? ''
  const platform = formData.get('platform')?.toString() ?? ''

  if (!outputId || !workspaceId || !contentId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(contentId, workspaceId)
  if (!item?.transcript) return { ok: false, error: 'No transcript found.' }

  // Get current hook from the output's metadata
  const supabase = (await import('@/lib/supabase/server')).createClient()
  const { data: output } = await supabase
    .from('outputs')
    .select('metadata')
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  const currentHook =
    (output?.metadata as Record<string, unknown> | null)?.hook as string | undefined ??
    'Make this hook go viral.'

  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) return { ok: false, error: pick.message }

  const { buildHookVariantsPrompt } = await import('@/lib/ai/prompts/hook-variants')
  const prompt = buildHookVariantsPrompt({ platform, currentHook, transcript: item.transcript })

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!gen.ok) return { ok: false, error: gen.message }

  const raw = gen.json as unknown as { variants?: unknown[] }
  const variants = Array.isArray(raw?.variants) ? raw.variants : []

  const validated: HookVariant[] = variants
    .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
    .map((v) => ({
      style: typeof v.style === 'string' ? v.style : 'variant',
      hook: typeof v.hook === 'string' ? v.hook : '',
    }))
    .filter((v) => v.hook.length > 0)

  if (validated.length === 0) return { ok: false, error: 'No variants generated. Try again.' }

  return { ok: true, variants: validated }
}

// ---------------------------------------------------------------------------
// A/B Hook Testing — 3 variants with psychological triggers
// ---------------------------------------------------------------------------

export interface AbHookVariant {
  hook: string
  trigger: string
  explanation: string
  winner: boolean
}

export type GenerateAbHookVariantsState =
  | { ok?: undefined }
  | { ok: true; variants: AbHookVariant[] }
  | { ok: false; error: string }

export async function generateAbHookVariantsAction(
  _prev: GenerateAbHookVariantsState,
  formData: FormData,
): Promise<GenerateAbHookVariantsState> {
  const outputId = formData.get('output_id')?.toString() ?? ''
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''

  if (!outputId || !workspaceId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { data: output, error: fetchError } = await supabase
    .from('outputs')
    .select('id, body, platform, metadata')
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError || !output) return { ok: false, error: 'Output not found.' }

  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) return { ok: false, error: pick.message }

  const body = (output.body as string | null) ?? ''
  const platform = (output.platform as string) ?? ''

  const systemPrompt =
    'You are a viral content expert. Generate 3 alternative hooks for this social media post. Each hook should use a different psychological trigger: 1) Curiosity gap, 2) Bold claim/controversy, 3) Personal story/vulnerability. Return JSON: { "variants": [{"hook": string, "trigger": string, "explanation": string}] }'
  const userPrompt = `Platform: ${platform}\n\nOriginal post:\n${body.slice(0, 1500)}`

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) return { ok: false, error: gen.message }

  let variants: AbHookVariant[] = []
  try {
    const raw = gen.json as unknown
    const obj = raw as Record<string, unknown>
    const arr = Array.isArray(obj?.variants) ? obj.variants : []
    variants = arr
      .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
      .map((v) => ({
        hook: typeof v.hook === 'string' ? v.hook : '',
        trigger: typeof v.trigger === 'string' ? v.trigger : '',
        explanation: typeof v.explanation === 'string' ? v.explanation : '',
        winner: false,
      }))
      .filter((v) => v.hook.length > 0)
  } catch {
    return { ok: false, error: 'Could not parse hook variants.' }
  }

  if (variants.length === 0) return { ok: false, error: 'No variants generated. Try again.' }

  const existingMetadata =
    output.metadata && typeof output.metadata === 'object' && !Array.isArray(output.metadata)
      ? (output.metadata as Record<string, unknown>)
      : {}

  await supabase
    .from('outputs')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: { ...existingMetadata, hook_variants: variants } as any })
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)

  revalidatePath(`/workspace/${workspaceId}/content`)
  return { ok: true, variants }
}

export type SetHookWinnerState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function setHookWinnerAction(
  _prev: SetHookWinnerState,
  formData: FormData,
): Promise<SetHookWinnerState> {
  const outputId = formData.get('output_id')?.toString() ?? ''
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const winnerIndex = parseInt(formData.get('winner_index')?.toString() ?? '', 10)

  if (!outputId || !workspaceId || isNaN(winnerIndex)) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { data: output, error: fetchError } = await supabase
    .from('outputs')
    .select('id, metadata')
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError || !output) return { ok: false, error: 'Output not found.' }

  const existingMetadata =
    output.metadata && typeof output.metadata === 'object' && !Array.isArray(output.metadata)
      ? (output.metadata as Record<string, unknown>)
      : {}

  const existingVariants = Array.isArray(existingMetadata.hook_variants)
    ? (existingMetadata.hook_variants as AbHookVariant[])
    : []

  const updated = existingVariants.map((v, i) => ({ ...v, winner: i === winnerIndex }))

  const { error } = await supabase
    .from('outputs')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: { ...existingMetadata, hook_variants: updated } as any })
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/content`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Engagement Predictor
// ---------------------------------------------------------------------------

export interface EngagementPrediction {
  estimated_views: string
  estimated_likes_pct: number
  estimated_comments_pct: number
  estimated_shares_pct: number
  viral_probability: number
  best_posting_time: string
  audience_fit: string
  algorithm_notes: string
}

export type PredictEngagementState =
  | { ok?: undefined }
  | { ok: true; prediction: EngagementPrediction }
  | { ok: false; error: string }

export async function predictEngagementAction(
  _prev: PredictEngagementState,
  formData: FormData,
): Promise<PredictEngagementState> {
  const outputId = formData.get('output_id')?.toString() ?? ''
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''

  if (!outputId || !workspaceId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { data: output, error: fetchError } = await supabase
    .from('outputs')
    .select('id, body, platform, metadata')
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (fetchError || !output) return { ok: false, error: 'Output not found.' }

  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) return { ok: false, error: pick.message }

  const body = (output.body as string | null) ?? ''
  const platform = (output.platform as string) ?? ''

  const systemPrompt =
    'You are a social media data analyst with access to platform algorithm patterns. Predict the engagement potential for this post. Return JSON: { "estimated_views": string (e.g. \'2K-8K\'), "estimated_likes_pct": number (like rate 0-10), "estimated_comments_pct": number (comment rate 0-5), "estimated_shares_pct": number (share rate 0-3), "viral_probability": number (0-100), "best_posting_time": string (e.g. \'Tuesday 7-9pm\'), "audience_fit": string (who will resonate most), "algorithm_notes": string (2 sentences on why algorithm will or won\'t push this) }'
  const userPrompt = `Platform: ${platform}\n\nContent:\n${body.slice(0, 1500)}`

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) return { ok: false, error: gen.message }

  let prediction: EngagementPrediction | null = null
  try {
    const raw = gen.json as unknown
    if (typeof raw === 'object' && raw !== null && 'estimated_views' in raw) {
      prediction = raw as EngagementPrediction
    } else if (typeof raw === 'string') {
      prediction = JSON.parse(raw) as EngagementPrediction
    } else {
      const obj = raw as Record<string, unknown>
      const candidate = Object.values(obj)[0]
      if (typeof candidate === 'object' && candidate !== null) {
        prediction = candidate as EngagementPrediction
      }
    }
  } catch {
    return { ok: false, error: 'Could not parse engagement prediction.' }
  }

  if (!prediction?.estimated_views) {
    return { ok: false, error: 'Engagement prediction missing expected fields.' }
  }

  const existingMetadata =
    output.metadata && typeof output.metadata === 'object' && !Array.isArray(output.metadata)
      ? (output.metadata as Record<string, unknown>)
      : {}

  await supabase
    .from('outputs')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: { ...existingMetadata, engagement_prediction: prediction } as any })
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)

  revalidatePath(`/workspace/${workspaceId}/content`)
  return { ok: true, prediction }
}

// ---------------------------------------------------------------------------
// Virality Score
// ---------------------------------------------------------------------------

export interface ViralityResult {
  overall: number
  hook_strength: number
  scroll_stop_power: number
  shareability: number
  engagement_bait: number
  verdict: string
  tips: string[]
}

export type GetViralityScoreState =
  | { ok?: undefined }
  | { ok: true; virality: ViralityResult }
  | { ok: false; error: string }

export async function getViralityScoreAction(
  _prev: GetViralityScoreState,
  formData: FormData,
): Promise<GetViralityScoreState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const outputId = formData.get('output_id')?.toString() ?? ''

  if (!workspaceId || !outputId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { data: output, error: fetchError } = await supabase
    .from('outputs')
    .select('id, body, platform, metadata')
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)
    .single()

  if (fetchError || !output) {
    return { ok: false, error: 'Output not found.' }
  }

  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) return { ok: false, error: pick.message }

  const systemPrompt =
    'You are a viral content expert with deep knowledge of social media algorithms. Score this social media post on its viral potential. Return a JSON object with: { "overall": number 0-100, "hook_strength": number 0-100, "scroll_stop_power": number 0-100, "shareability": number 0-100, "engagement_bait": number 0-100, "verdict": string (one of: "🔥 High viral potential", "⚡ Good potential", "📈 Decent", "💤 Needs work"), "tips": string[] (2-3 specific actionable improvements to boost virality) }'

  const userPrompt = `Platform: ${output.platform}\n\nContent:\n${(output.body as string | null ?? '').slice(0, 2000)}`

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) return { ok: false, error: gen.message }

  let parsedResult: ViralityResult | null = null
  try {
    const raw = gen.json as unknown
    if (typeof raw === 'object' && raw !== null && 'overall' in raw) {
      parsedResult = raw as ViralityResult
    } else if (typeof raw === 'string') {
      parsedResult = JSON.parse(raw) as ViralityResult
    } else {
      const obj = raw as Record<string, unknown>
      const candidate = Object.values(obj)[0]
      if (typeof candidate === 'object' && candidate !== null) {
        parsedResult = candidate as ViralityResult
      } else if (typeof candidate === 'string') {
        parsedResult = JSON.parse(candidate) as ViralityResult
      }
    }
  } catch {
    return { ok: false, error: 'Could not parse virality response.' }
  }

  if (!parsedResult || typeof parsedResult.overall !== 'number') {
    return { ok: false, error: 'Virality response is missing expected fields.' }
  }

  const existingMetadata =
    output.metadata && typeof output.metadata === 'object' && !Array.isArray(output.metadata)
      ? (output.metadata as Record<string, unknown>)
      : {}

  const { error: updateError } = await supabase
    .from('outputs')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: { ...existingMetadata, virality: parsedResult } as any })
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)

  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath(`/workspace/${workspaceId}/content`)
  return { ok: true, virality: parsedResult }
}
