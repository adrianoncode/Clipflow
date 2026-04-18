'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generateRaw } from '@/lib/ai/generate/generate-raw'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { buildYoutubeChaptersPrompt } from '@/lib/ai/prompts/youtube-chapters'

/**
 * YouTube Chapter Generator — creates timestamped chapters from a
 * transcript. Unlike the fake-AI "performance predictor" that used
 * to live here (deleted: it produced made-up view counts/scores
 * the user couldn't verify), chapters are concrete, deterministic
 * output — either the AI picks real moments in the video or it
 * doesn't. No "viral probability: 73%" handwaving.
 */

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
