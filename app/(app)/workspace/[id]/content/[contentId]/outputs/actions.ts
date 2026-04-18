'use server'

/**
 * Core CRUD server actions for the outputs page — generation, regenerate,
 * update, state transitions, starring, performance tracking.
 *
 * AI-assisted analysis actions (SEO suggestions, AI coach feedback, hook
 * variants, A/B hook testing, engagement prediction, virality score) were
 * extracted to `./ai-actions.ts` and are re-exported at the bottom of this
 * file — existing consumer imports from `./actions` keep working without
 * any migration.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z as zod } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
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
import { log } from '@/lib/log'
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

  if (item.transcript.length > 30_000) {
    log.warn('generateOutputsAction long transcript', {
      contentId: parsed.data.content_id,
      chars: item.transcript.length,
    })
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'decrypt_failed',
      error: pick.message,
    }
  }

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

  if (generated.length > 0) {
    triggerWebhooks(workspaceId, 'output.generated', {
      content_id: contentId,
      title,
      platforms: generated,
      failed: failed.map((f) => f.platform),
    })

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

  if (new_state === 'approved') {
    triggerWebhooks(workspace_id, 'output.approved', {
      output_id,
      new_state,
    })

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
// Performance tracking
// ---------------------------------------------------------------------------

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
// AI-assisted analysis actions moved to ./ai-actions
// ---------------------------------------------------------------------------
// The 6 AI-assisted actions (SEO suggestions, AI coach, hook variants,
// A/B hook testing, engagement prediction, virality score) used to live
// in this file. They're now in ./ai-actions.ts — import directly:
//
//   import { getSeoSuggestionsAction } from '.../outputs/ai-actions'
//
// Next 14 'use server' modules cannot re-export from other modules, so
// there's no facade. The trade-off buys us a 1126 → 564 LOC split.
