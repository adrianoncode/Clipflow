'use server'

import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { notifyPostPublished } from '@/lib/notifications/triggers'
import { publishToSocial, type PublishablePlatform } from '@/lib/publish/route'
import { triggerWebhooks } from '@/lib/webhooks/trigger-webhook'

// Re-exported for UI components that still import this name from here.
export type PublishPlatform = PublishablePlatform

export type PublishOutputState =
  | { ok?: undefined }
  | { ok: true; postedTo: PublishablePlatform[]; failed?: Array<{ platform: PublishablePlatform; error: string }> }
  | { ok: false; error: string }

/**
 * Server action: publish a finished output to social platforms via the
 * workspace's Upload-Post BYOK key.
 *
 * Expects FormData with:
 *   workspace_id   string
 *   video_url      string  — public MP4 URL (from Shotstack render or manual)
 *   caption        string  — post caption
 *   platforms      string  — JSON array of PublishPlatform[]
 */
export async function publishOutputAction(
  _prev: PublishOutputState,
  formData: FormData,
): Promise<PublishOutputState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const workspaceId = formData.get('workspace_id') as string
  const videoUrl = formData.get('video_url') as string
  const caption = formData.get('caption') as string
  const platformsRaw = formData.get('platforms') as string

  if (!workspaceId) return { ok: false, error: 'Missing workspace.' }

  // Verify the caller actually belongs to this workspace + has write
  // access before firing webhooks or notifications — both accept the
  // raw workspaceId and would otherwise fan out to another tenant's
  // systems.
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only owners or editors can publish.' }
  }

  if (!videoUrl?.startsWith('http')) {
    return { ok: false, error: 'Paste a valid video URL (must start with https://).' }
  }
  if (!caption?.trim()) {
    return { ok: false, error: 'Caption cannot be empty.' }
  }

  let platforms: PublishablePlatform[]
  try {
    platforms = JSON.parse(platformsRaw)
    if (!Array.isArray(platforms) || platforms.length === 0) throw new Error()
  } catch {
    return { ok: false, error: 'Select at least one platform.' }
  }

  const results = await publishToSocial(workspaceId, platforms, {
    videoUrl,
    caption: caption.trim(),
  })

  const postedTo = results.filter((r) => r.ok).map((r) => r.platform)
  const failed = results
    .filter((r) => !r.ok)
    .map((r) => ({ platform: r.platform, error: r.error ?? 'Unknown error' }))

  // If every platform failed, surface the first error as the top-level
  // failure so the form shows it. Partial success → ok:true + failed list.
  if (postedTo.length === 0) {
    return {
      ok: false,
      error: failed[0]?.error ?? 'Publish failed on all selected platforms.',
    }
  }

  // Fire-and-forget webhook for post.published
  triggerWebhooks(workspaceId, 'post.published', {
    platforms: postedTo,
    caption: caption.trim(),
  })

  // Fire-and-forget notification per successful platform
  try {
    for (const p of postedTo) {
      notifyPostPublished({
        userId: user.id,
        workspaceId,
        platform: p,
        contentTitle: caption.trim().slice(0, 60),
      })
    }
  } catch {}

  return { ok: true, postedTo, ...(failed.length > 0 ? { failed } : {}) }
}
