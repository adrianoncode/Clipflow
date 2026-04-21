'use server'

/**
 * AI-assisted analysis actions for the outputs page.
 *
 * Split out of `actions.ts` (which was 1126 LOC) to group all the
 * "ask the LLM to grade / enhance / predict this draft" server actions
 * in one file. The core CRUD actions (generate, regenerate, update,
 * transition, star, savePerformance) stay in `actions.ts`.
 *
 * Consumers continue to import from `./actions` thanks to the re-export
 * facade at the bottom of that file — no import-path churn.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generate } from '@/lib/ai/generate/generate'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// SEO suggestions
// ---------------------------------------------------------------------------

export interface SeoResult {
  primary_keyword: string
  secondary_keywords: string[]
  seo_title: string
  meta_description: string
  hashtag_strategy: string
  /** Ready-to-paste hashtag sets, organized per platform. Added in the
   *  hashtag-UI pass — older outputs may not carry this field, callers
   *  should treat it as optional. */
  hashtags?: {
    tiktok: string[]
    instagram: string[]
    youtube: string[]
    linkedin: string[]
  }
  /** Platform-tuned emoji suggestions to sprinkle into captions. Low
   *  count per platform (2-4) so they stay tasteful. */
  emojis?: {
    tiktok: string[]
    instagram: string[]
    youtube: string[]
    linkedin: string[]
  }
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

  const systemPrompt = `You are an SEO expert for social media content. Analyze the provided content and return a JSON object with these exact keys:

{
  "primary_keyword": string,
  "secondary_keywords": string[] (3-5 items),
  "seo_title": string (max 60 chars, SEO-optimized),
  "meta_description": string (max 155 chars),
  "hashtag_strategy": string (one or two sentences — broad advice),
  "hashtags": {
    "tiktok": string[] (3-5 items, NO # prefix, mix of broad + niche),
    "instagram": string[] (15-25 items, NO # prefix, tiered),
    "youtube": string[] (3-5 items, NO # prefix),
    "linkedin": string[] (3-5 items, NO # prefix, professional)
  },
  "emojis": {
    "tiktok": string[] (2-4 emoji characters, no text, fitting the vibe),
    "instagram": string[] (2-4 emoji characters),
    "youtube": string[] (2-3 emoji characters, subdued),
    "linkedin": string[] (1-2 emoji characters, professional)
  }
}

Rules:
- Never include the # character in hashtags — the UI adds it.
- Avoid banned or shadowbanned hashtags.
- Emojis should be single unicode characters only (e.g. "🎬", not "🎬 film").
- LinkedIn emojis: one, maybe two. Professional only.
- Return only valid JSON, no markdown fences.`
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
    if (typeof raw === 'object' && raw !== null && 'primary_keyword' in raw) {
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
