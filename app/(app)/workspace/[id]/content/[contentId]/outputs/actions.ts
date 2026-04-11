'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { generate } from '@/lib/ai/generate/generate'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getPromptBuilder } from '@/lib/ai/prompts/get-prompt'
import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { deleteOutputsForContent } from '@/lib/outputs/delete-outputs-for-content'
import { insertOutputWithDraftState } from '@/lib/outputs/insert-output'
import { renderOutputMarkdown } from '@/lib/outputs/render-markdown'
import { generateOutputsSchema } from '@/lib/outputs/schemas'
import type { OutputPlatform } from '@/lib/supabase/types'

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

interface PlatformResult {
  platform: OutputPlatform
  ok: boolean
  error?: string
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
  // them to the nested runOnePlatform closure.
  const workspaceId = parsed.data.workspace_id
  const contentId = parsed.data.content_id
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

  async function runOnePlatform(platform: OutputPlatform): Promise<PlatformResult> {
    const build = getPromptBuilder(platform)
    const prompt = build({
      transcript,
      sourceKind,
      sourceTitle: title,
    })

    const gen = await generate({
      provider,
      apiKey,
      model,
      system: prompt.system,
      user: prompt.user,
    })
    if (!gen.ok) {
      return { platform, ok: false, error: gen.message }
    }

    const markdown = renderOutputMarkdown(platform, gen.json)
    const insert = await insertOutputWithDraftState({
      workspaceId,
      contentId,
      platform,
      body: markdown,
      structured: gen.json,
      provider,
      model,
      userId,
    })

    if (!insert.ok) {
      return { platform, ok: false, error: insert.error }
    }
    return { platform, ok: true }
  }

  const settled = await Promise.allSettled(PLATFORMS.map(runOnePlatform))

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

  return { ok: true, generated, failed }
}
