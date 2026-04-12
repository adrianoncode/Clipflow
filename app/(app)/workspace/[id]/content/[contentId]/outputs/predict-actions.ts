'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generateRaw } from '@/lib/ai/generate/generate-raw'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { buildPerformancePredictorPrompt } from '@/lib/ai/prompts/performance-predictor'
import { buildYoutubeChaptersPrompt } from '@/lib/ai/prompts/youtube-chapters'
import { createClient } from '@/lib/supabase/server'

/* ─── Performance Predictor ─────────────────────────────────── */

const predictSchema = z.object({
  workspace_id: z.string().uuid(),
  output_id: z.string().uuid(),
})

export type PredictState =
  | { ok?: undefined }
  | { ok: true; prediction: Record<string, unknown> }
  | { ok: false; error: string }

export async function predictPerformanceAction(
  _prev: PredictState,
  formData: FormData,
): Promise<PredictState> {
  const parsed = predictSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    output_id: formData.get('output_id'),
  })
  if (!parsed.success) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: output } = await supabase
    .from('outputs')
    .select('id, platform, body, metadata, content_id')
    .eq('id', parsed.data.output_id)
    .eq('workspace_id', parsed.data.workspace_id)
    .single()

  if (!output) return { ok: false, error: 'Output not found.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const structured = (output.metadata as any)?.structured as
    | { hook?: string; script?: string; caption?: string; hashtags?: string[] }
    | undefined

  if (!structured) return { ok: false, error: 'Output has no structured data to analyze.' }

  const provider = await pickGenerationProvider(parsed.data.workspace_id)
  if (!provider.ok) return { ok: false, error: provider.message }

  const prompt = buildPerformancePredictorPrompt({
    platform: output.platform,
    hook: structured.hook ?? '',
    script: structured.script ?? '',
    caption: structured.caption ?? '',
    hashtags: structured.hashtags ?? [],
  })

  const gen = await generateRaw({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: DEFAULT_MODELS[provider.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!gen.ok) return { ok: false, error: gen.message }

  const prediction = gen.json as Record<string, unknown>

  // Store prediction in output metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingMeta = (output.metadata ?? {}) as Record<string, any>
  await supabase
    .from('outputs')
    .update({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: { ...existingMeta, prediction } as any,
    })
    .eq('id', output.id)
    .eq('workspace_id', parsed.data.workspace_id)

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${output.content_id}/outputs`)
  return { ok: true, prediction }
}

/* ─── YouTube Chapter Generator ──────────────────────────────── */

const chapterSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export type ChapterState =
  | { ok?: undefined }
  | { ok: true; chapters: Array<{ timestamp: string; title: string }> }
  | { ok: false; error: string }

export async function generateYoutubeChaptersAction(
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  const parsed = chapterSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item?.transcript) return { ok: false, error: 'No transcript available.' }

  const provider = await pickGenerationProvider(parsed.data.workspace_id)
  if (!provider.ok) return { ok: false, error: provider.message }

  const prompt = buildYoutubeChaptersPrompt({ transcript: item.transcript })

  const gen = await generateRaw({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: DEFAULT_MODELS[provider.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!gen.ok) return { ok: false, error: gen.message }

  const result = gen.json as { chapters?: Array<{ timestamp: string; title: string }> }
  const chapters = result?.chapters ?? []

  if (chapters.length === 0) return { ok: false, error: 'Could not generate chapters from this transcript.' }

  return { ok: true, chapters }
}
