'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generate } from '@/lib/ai/generate/generate'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { buildContentRecyclerPrompt } from '@/lib/ai/prompts/content-recycler'
import { getUser } from '@/lib/auth/get-user'
import { checkLimit } from '@/lib/billing/check-limit'
import { getContentItem } from '@/lib/content/get-content-item'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const recycleSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecycleRemix {
  angle: string
  newHook: string
  script: string
  whyBetter: string
  bestPlatform: string
}

interface RecycleResponse {
  analysis?: {
    coreMessage?: string
    stillRelevant?: boolean
    improvementAreas?: string[]
  }
  remixes?: RecycleRemix[]
  bestTimeToRepost?: string
}

export type RecycleContentState =
  | { ok?: undefined; error?: string }
  | { ok: true; newContentId: string; redirectUrl: string }
  | { ok: false; code: 'no_key' | 'content_not_ready' | 'decrypt_failed' | 'unknown'; error: string }

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function recycleContentAction(
  _prev: RecycleContentState,
  formData: FormData,
): Promise<RecycleContentState> {
  const parsed = recycleSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
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

  const { workspace_id: workspaceId, content_id: contentId } = parsed.data

  // Billing gate
  const contentLimit = await checkLimit(workspaceId, 'content_items')
  if (!contentLimit.ok) {
    return {
      ok: false,
      code: 'unknown',
      error: contentLimit.message ?? 'Monthly content limit reached. Upgrade your plan.',
    }
  }

  // Load original content
  const item = await getContentItem(contentId, workspaceId)
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

  // Resolve AI provider
  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'decrypt_failed',
      error: pick.message,
    }
  }

  // Build recycler prompt
  const prompt = buildContentRecyclerPrompt({
    originalContent: {
      title: item.title ?? 'Untitled',
      transcript: item.transcript,
      createdAt: item.created_at,
    },
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

  // Parse recycler response
  let recycleResult: RecycleResponse | null = null
  try {
    const raw = gen.json as unknown
    if (typeof raw === 'object' && raw !== null && 'remixes' in raw) {
      recycleResult = raw as RecycleResponse
    } else if (typeof raw === 'string') {
      recycleResult = JSON.parse(raw) as RecycleResponse
    } else {
      const obj = raw as Record<string, unknown>
      const candidate = Object.values(obj)[0]
      if (typeof candidate === 'object' && candidate !== null) {
        recycleResult = candidate as RecycleResponse
      } else if (typeof candidate === 'string') {
        recycleResult = JSON.parse(candidate) as RecycleResponse
      }
    }
  } catch {
    return { ok: false, code: 'unknown', error: 'Could not parse recycler response.' }
  }

  const remixes = Array.isArray(recycleResult?.remixes) ? recycleResult.remixes : []
  if (remixes.length === 0) {
    return { ok: false, code: 'unknown', error: 'No remixes were generated. Try again.' }
  }

  // Build a combined transcript from all remixes
  const remixedTranscript = remixes
    .map((r, i) => {
      const remix = r as unknown as Record<string, unknown>
      const angle = typeof remix.angle === 'string' ? remix.angle : `Remix ${i + 1}`
      const script = typeof remix.script === 'string' ? remix.script : ''
      const hook = typeof remix.newHook === 'string' ? remix.newHook : ''
      return `## ${angle}\n\n**Hook:** ${hook}\n\n${script}`
    })
    .join('\n\n---\n\n')

  // Insert new content item
  const supabase = createClient()
  const originalTitle = item.title ?? 'Untitled'
  const newTitle = `${originalTitle} (Recycled)`

  const { data: newItem, error: insertError } = await supabase
    .from('content_items')
    .insert({
      workspace_id: workspaceId,
      kind: 'text' as const,
      status: 'ready' as const,
      title: newTitle,
      transcript: remixedTranscript,
      created_by: user.id,
      metadata: {
        recycled_from: contentId,
        recycler_analysis: recycleResult?.analysis ?? null,
        best_time_to_repost: recycleResult?.bestTimeToRepost ?? null,
      },
    })
    .select('id')
    .single()

  if (insertError || !newItem) {
    return {
      ok: false,
      code: 'unknown',
      error: insertError?.message ?? 'Failed to create recycled content item.',
    }
  }

  const redirectUrl = `/workspace/${workspaceId}/content/${newItem.id}`

  revalidatePath(`/workspace/${workspaceId}`)
  revalidatePath(redirectUrl)

  return { ok: true, newContentId: newItem.id, redirectUrl }
}
