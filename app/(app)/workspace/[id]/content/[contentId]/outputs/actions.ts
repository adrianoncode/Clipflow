'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { checkLimit } from '@/lib/billing/check-limit'
import { getContentItem } from '@/lib/content/get-content-item'
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
import { transitionOutputState } from '@/lib/outputs/transition-output-state'
import { updateOutput } from '@/lib/outputs/update-output'
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
  // them to Promise.allSettled callbacks.
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

  // Idempotent regenerate: wipe existing outputs (CASCADE takes output_states)
  // then re-insert from the current generation run.
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
  // LinkedIn has no hook/script — default to empty string.
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

  // Delete the existing output for this platform (if any).
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
