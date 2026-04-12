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

// ── Edit transcript ───────────────────────────────────────────────────────────

const editTranscriptSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  transcript: z.string().trim().min(1, 'Transcript cannot be empty.').max(100_000),
})

export type EditTranscriptState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function editTranscriptAction(
  _prev: EditTranscriptState,
  formData: FormData,
): Promise<EditTranscriptState> {
  const parsed = editTranscriptSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    transcript: formData.get('transcript'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()
  const { error } = await supabase
    .from('content_items')
    .update({ transcript: parsed.data.transcript })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${parsed.data.content_id}`)
  return { ok: true }
}

// ── Rename content item ───────────────────────────────────────────────────────

const renameSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  title: z.string().trim().min(1, 'Title cannot be empty.').max(200),
})

export type RenameContentState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function renameContentAction(
  _prev: RenameContentState,
  formData: FormData,
): Promise<RenameContentState> {
  const parsed = renameSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    title: formData.get('title'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()
  const { error } = await supabase
    .from('content_items')
    .update({ title: parsed.data.title })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${parsed.data.content_id}`)
  revalidatePath(`/workspace/${parsed.data.workspace_id}`)
  return { ok: true }
}

// ── Auto-tag content item ─────────────────────────────────────────────────────

const autoTagSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export type AutoTagState =
  | { ok?: undefined }
  | { ok: true; tags: string[] }
  | { ok: false; code: 'no_key' | 'unknown'; error: string }

export async function autoTagContentAction(
  _prev: AutoTagState,
  formData: FormData,
): Promise<AutoTagState> {
  const parsed = autoTagSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item || !item.transcript) {
    return { ok: false, code: 'unknown', error: 'Content has no transcript to tag.' }
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'unknown',
      error: pick.message,
    }
  }

  const transcriptSnippet = item.transcript.slice(0, 3000)
  const systemPrompt =
    'You are a content tagging assistant. Return ONLY a valid JSON array of strings. No explanation, no markdown, just the JSON array.'
  const userPrompt = `Extract 3-7 topic tags from this transcript. Return a JSON array of short lowercase tags (1-3 words each). Example: ["productivity", "morning routine", "mindset"]. Transcript: ${transcriptSnippet}`

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) {
    return { ok: false, code: 'unknown', error: gen.message }
  }

  // The generate function returns structured JSON via PromptOutput, but here
  // we need a raw array. Parse from the hook field as a fallback.
  let tags: string[] = []
  try {
    // Try to extract JSON array from the response
    const raw = gen.json as unknown
    if (Array.isArray(raw)) {
      tags = (raw as unknown[]).filter((t): t is string => typeof t === 'string')
    } else if (typeof raw === 'object' && raw !== null) {
      // The model may have nested it — try common keys
      const obj = raw as Record<string, unknown>
      const candidate =
        obj['tags'] ?? obj['result'] ?? obj['hook'] ?? Object.values(obj)[0]
      if (Array.isArray(candidate)) {
        tags = (candidate as unknown[]).filter((t): t is string => typeof t === 'string')
      } else if (typeof candidate === 'string') {
        // Try to parse JSON embedded in a string field
        const match = candidate.match(/\[[\s\S]*\]/)
        if (match) {
          const parsed2 = JSON.parse(match[0])
          if (Array.isArray(parsed2)) {
            tags = (parsed2 as unknown[]).filter((t): t is string => typeof t === 'string')
          }
        }
      }
    }
  } catch {
    // ignore parse errors
  }

  if (tags.length === 0) {
    return { ok: false, code: 'unknown', error: 'No tags could be extracted. Try again.' }
  }

  // Normalize tags
  tags = tags.map((t) => t.toLowerCase().trim()).filter(Boolean).slice(0, 7)

  // Update metadata.tags in DB
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()

  const existingMetadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  const { error } = await supabase
    .from('content_items')
    .update({ metadata: { ...existingMetadata, tags } })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) {
    return { ok: false, code: 'unknown', error: error.message }
  }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${parsed.data.content_id}`)
  return { ok: true, tags }
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
