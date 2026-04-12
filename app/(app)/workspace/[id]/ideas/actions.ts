'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { buildIdeasPrompt } from '@/lib/ai/prompts/ideas'
import { getUser } from '@/lib/auth/get-user'
import { generate } from '@/lib/ai/generate/generate'

const ideasSchema = z.object({
  workspace_id: z.string().uuid(),
  niche: z.string().trim().min(2, 'Enter your niche.').max(200),
  audience: z.string().trim().min(2, 'Describe your audience.').max(200),
  platform: z.string().trim().min(1, 'Select a platform.').max(50),
})

export interface ContentIdea {
  title: string
  hook: string
  why: string
}

export type GenerateIdeasState =
  | { ok?: undefined; error?: string }
  | { ok: true; ideas: ContentIdea[] }
  | { ok: false; code: 'no_key' | 'unknown'; error: string }

export async function generateIdeasAction(
  _prev: GenerateIdeasState,
  formData: FormData,
): Promise<GenerateIdeasState> {
  const parsed = ideasSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    niche: formData.get('niche'),
    audience: formData.get('audience'),
    platform: formData.get('platform'),
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'unknown',
      error: pick.message,
    }
  }

  const prompt = buildIdeasPrompt({
    niche: parsed.data.niche,
    audience: parsed.data.audience,
    platform: parsed.data.platform,
  })

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

  // The LLM returns { ideas: [...] } but generate() expects PromptOutput shape.
  // We cast and extract the ideas array from the raw JSON response.
  const raw = gen.json as unknown as { ideas?: unknown[] }
  const ideas = Array.isArray(raw?.ideas) ? raw.ideas : []

  const validated: ContentIdea[] = ideas
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title : '',
      hook: typeof item.hook === 'string' ? item.hook : '',
      why: typeof item.why === 'string' ? item.why : '',
    }))
    .filter((idea) => idea.title.length > 0)

  if (validated.length === 0) {
    return { ok: false, code: 'unknown', error: 'No ideas were generated. Try again.' }
  }

  return { ok: true, ideas: validated }
}
