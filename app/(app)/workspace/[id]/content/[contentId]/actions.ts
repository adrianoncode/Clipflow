'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { buildFollowUpTopicsPrompt } from '@/lib/ai/prompts/follow-up-topics'
import { getUser } from '@/lib/auth/get-user'
import { generate } from '@/lib/ai/generate/generate'
import { getContentItem } from '@/lib/content/get-content-item'
import { deleteContentItem } from '@/lib/content/delete-content-item'

// ── Follow-up topics ──────────────────────────────────────────────────────────

const followUpSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export interface FollowUpTopic {
  title: string
  angle: string
  why: string
}

export type SuggestFollowUpState =
  | { ok?: undefined; error?: string }
  | { ok: true; topics: FollowUpTopic[] }
  | { ok: false; code: 'no_key' | 'unknown'; error: string }

export async function suggestFollowUpTopicsAction(
  _prev: SuggestFollowUpState,
  formData: FormData,
): Promise<SuggestFollowUpState> {
  const parsed = followUpSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item || item.status !== 'ready' || !item.transcript) {
    return { ok: false, code: 'unknown', error: 'Content is not ready.' }
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'unknown',
      error: pick.message,
    }
  }

  const prompt = buildFollowUpTopicsPrompt({ transcript: item.transcript })

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

  const raw = gen.json as unknown as { topics?: unknown[] }
  const topics = Array.isArray(raw?.topics) ? raw.topics : []

  const validated: FollowUpTopic[] = topics
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title : '',
      angle: typeof item.angle === 'string' ? item.angle : '',
      why: typeof item.why === 'string' ? item.why : '',
    }))
    .filter((t) => t.title.length > 0)

  if (validated.length === 0) {
    return { ok: false, code: 'unknown', error: 'No topics were generated. Try again.' }
  }

  return { ok: true, topics: validated }
}

// ── Delete content item ───────────────────────────────────────────────────────

export type DeleteContentState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function deleteContentAction(
  _prev: DeleteContentState,
  formData: FormData,
): Promise<DeleteContentState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const contentId = formData.get('content_id')?.toString() ?? ''

  if (!workspaceId || !contentId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const result = await deleteContentItem(contentId, workspaceId)
  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath(`/workspace/${workspaceId}`)
  redirect(`/workspace/${workspaceId}`)
}
