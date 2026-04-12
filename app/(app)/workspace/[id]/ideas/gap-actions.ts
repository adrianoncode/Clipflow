'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { buildGapAnalysisPrompt } from '@/lib/ai/prompts/gap-analysis'
import { generate } from '@/lib/ai/generate/generate'
import { getUser } from '@/lib/auth/get-user'
import { getContentItems } from '@/lib/content/get-content-items'

const schema = z.object({
  workspace_id: z.string().uuid(),
  niche: z.string().trim().max(200).optional(),
})

export interface ContentGap {
  topic: string
  reason: string
  urgency: 'high' | 'medium' | 'low'
}

export type GapAnalysisState =
  | { ok?: undefined }
  | { ok: true; gaps: ContentGap[]; analyzedCount: number }
  | { ok: false; code: 'no_content' | 'no_key' | 'unknown'; error: string }

export async function analyzeGapsAction(
  _prev: GapAnalysisState,
  formData: FormData,
): Promise<GapAnalysisState> {
  const parsed = schema.safeParse({
    workspace_id: formData.get('workspace_id'),
    niche: formData.get('niche') ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const items = await getContentItems(parsed.data.workspace_id, { limit: 50 })
  const titles = items.map((i) => i.title ?? 'Untitled').filter(Boolean)

  if (titles.length < 3) {
    return {
      ok: false,
      code: 'no_content',
      error: 'Add at least 3 content items before running a gap analysis.',
    }
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'unknown',
      error: pick.message,
    }
  }

  const prompt = buildGapAnalysisPrompt({ contentTitles: titles, niche: parsed.data.niche })

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!gen.ok) {
    return { ok: false, code: 'unknown', error: gen.message }
  }

  const raw = gen.json as unknown as { gaps?: unknown[] }
  const gaps = Array.isArray(raw?.gaps) ? raw.gaps : []

  const validated: ContentGap[] = gaps
    .filter((g): g is Record<string, unknown> => typeof g === 'object' && g !== null)
    .map((g) => ({
      topic: typeof g.topic === 'string' ? g.topic : '',
      reason: typeof g.reason === 'string' ? g.reason : '',
      urgency: (g.urgency === 'high' ? 'high' : g.urgency === 'medium' ? 'medium' : 'low') as ContentGap['urgency'],
    }))
    .filter((g) => g.topic.length > 0)

  if (validated.length === 0) {
    return { ok: false, code: 'unknown', error: 'No gaps found. Try again.' }
  }

  return { ok: true, gaps: validated, analyzedCount: titles.length }
}
