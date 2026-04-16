'use server'

import { getUser } from '@/lib/auth/get-user'
import { notifyPostPublished } from '@/lib/notifications/triggers'
import { publishVideo, type PublishPlatform } from '@/lib/publish/upload-post'
import { triggerWebhooks } from '@/lib/webhooks/trigger-webhook'
import { dispatchIntegrations } from '@/lib/integrations/dispatch-integrations'

export type PublishOutputState =
  | { ok?: undefined }
  | { ok: true; postedTo: PublishPlatform[] }
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
  if (!videoUrl?.startsWith('http')) {
    return { ok: false, error: 'Paste a valid video URL (must start with https://).' }
  }
  if (!caption?.trim()) {
    return { ok: false, error: 'Caption cannot be empty.' }
  }

  let platforms: PublishPlatform[]
  try {
    platforms = JSON.parse(platformsRaw)
    if (!Array.isArray(platforms) || platforms.length === 0) throw new Error()
  } catch {
    return { ok: false, error: 'Select at least one platform.' }
  }

  const result = await publishVideo(workspaceId, {
    videoUrl,
    caption: caption.trim(),
    platforms,
  })

  if (!result.ok) return { ok: false, error: result.error }

  // Fire-and-forget webhook for post.published
  triggerWebhooks(workspaceId, 'post.published', {
    platforms,
    caption: caption.trim(),
  })

  // Fire-and-forget notification per platform
  try {
    for (const p of platforms) {
      notifyPostPublished({
        userId: user.id,
        workspaceId,
        platform: p,
        contentTitle: caption.trim().slice(0, 60),
      })
    }
  } catch {}

  // Fire-and-forget integration dispatch
  dispatchIntegrations(workspaceId, 'post.published', {
    title: caption.trim().slice(0, 120),
    platform: platforms.join(', '),
    workspaceUrl: `/workspace/${workspaceId}`,
  })

  return { ok: true, postedTo: platforms }
}
