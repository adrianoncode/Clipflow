import 'server-only'

import { executeComposioAction } from '@/lib/integrations/composio'
import { log } from '@/lib/log'

/**
 * Composio-backed social publishing. One function per platform plus a
 * dispatcher. Lives next to upload-post.ts so the publish router can
 * pick the right path per-platform.
 *
 * IMPORTANT: Composio action names evolve. The constants below are the
 * names that ship in their catalog today — verify against the live
 * catalog if a call starts returning "unknown action". A one-liner to
 * dump the real action list for a given app:
 *
 *   pnpm dlx tsx scripts/composio-actions.ts <APP_SLUG>
 */

export type ComposioPublishPlatform =
  | 'linkedin'
  | 'youtube'
  | 'instagram'
  | 'facebook'

export interface PublishContent {
  /** Public video URL (required for IG/YT/Reels, optional elsewhere) */
  videoUrl?: string
  /** Main caption / body text — used on every platform */
  caption: string
  /** YouTube title — falls back to first 100 chars of caption */
  title?: string
  /** Hashtags without the # prefix */
  tags?: string[]
}

export type PublishOneResult =
  | { ok: true; postId: string }
  | { ok: false; error: string; code: 'not_connected' | 'api_error' }

const ACTIONS = {
  linkedin: 'LINKEDIN_CREATE_LINKEDIN_POST',
  youtube: 'YOUTUBE_UPLOAD_VIDEO',
  instagram: 'INSTAGRAM_MEDIA_PUBLISH',
  facebook: 'FACEBOOK_CREATE_PAGE_FEED_POST',
} as const satisfies Record<ComposioPublishPlatform, string>

export async function publishViaComposio(
  workspaceId: string,
  platform: ComposioPublishPlatform,
  content: PublishContent,
): Promise<PublishOneResult> {
  const actionName = ACTIONS[platform]
  const params = buildParams(platform, content)

  const result = await executeComposioAction(workspaceId, actionName, params)
  if (!result.ok) {
    log.error('composio-publish: action failed', new Error(result.error), {
      platform,
      workspaceId,
      action: actionName,
    })
    return { ok: false, error: result.error, code: 'api_error' }
  }

  // Each platform returns its post ID in a different field. Best-effort
  // extract — if we can't find one, the publish succeeded but we don't
  // get a stable reference for analytics.
  const postId = extractPostId(platform, result.data) ?? 'unknown'
  return { ok: true, postId }
}

function buildParams(
  platform: ComposioPublishPlatform,
  content: PublishContent,
): Record<string, unknown> {
  const caption = content.caption.trim()
  const title = content.title ?? caption.slice(0, 100)

  switch (platform) {
    case 'linkedin':
      return {
        commentary: caption,
        visibility: 'PUBLIC',
      }
    case 'youtube':
      if (!content.videoUrl) throw new Error('YouTube publish needs videoUrl')
      return {
        title: title.slice(0, 100),
        description: caption,
        tags: content.tags ?? [],
        video_url: content.videoUrl,
        privacy_status: 'public',
      }
    case 'instagram':
      if (!content.videoUrl) throw new Error('Instagram publish needs videoUrl')
      return {
        video_url: content.videoUrl,
        caption,
        media_type: 'REELS',
      }
    case 'facebook':
      return {
        message: caption,
        ...(content.videoUrl ? { link: content.videoUrl } : {}),
      }
  }
}

function extractPostId(
  platform: ComposioPublishPlatform,
  data: unknown,
): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  // Common shapes: { id }, { post_id }, { data: { id } }, platform-specific.
  const candidates = [
    d.id,
    d.post_id,
    d.postId,
    (d.data as Record<string, unknown> | undefined)?.id,
    platform === 'youtube' ? (d.video_id ?? null) : null,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c
  }
  return null
}
