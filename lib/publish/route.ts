import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import { publishVideo, type PublishPlatform as UploadPostPlatform } from '@/lib/publish/upload-post'
import { publishToX } from '@/lib/publish/x-publish'
import {
  publishViaComposio,
  type ComposioPublishPlatform,
  type PublishContent,
} from '@/lib/publish/composio-publish'

/**
 * Publish router — decides per-platform which backend handles the post.
 *
 * Decision order per platform:
 *   1. X → BYO X API credentials (OAuth 1.0a, user's own Developer app)
 *   2. Else if workspace has a Composio channel connection → Composio
 *   3. Else if workspace has an Upload-Post key AND the platform is
 *      in Upload-Post's supported list → Upload-Post fallback
 *   4. Else → mark as not_connected
 */

export type PublishablePlatform =
  | ComposioPublishPlatform   // linkedin, youtube, instagram, facebook
  | 'tiktok'                  // Upload-Post only
  | 'x'                       // BYO X API (OAuth 1.0a)

const UPLOAD_POST_PLATFORMS = new Set<PublishablePlatform>([
  'tiktok', 'instagram', 'youtube', 'linkedin',
])

export interface RouteResult {
  platform: PublishablePlatform
  ok: boolean
  via?: 'composio' | 'upload-post' | 'x-api'
  postId?: string
  error?: string
}

export async function publishToSocial(
  workspaceId: string,
  platforms: PublishablePlatform[],
  content: PublishContent,
): Promise<RouteResult[]> {
  // Load all the connection info we need in one pass.
  const [composioIds, hasUploadPostKey, hasXApi] = await Promise.all([
    getComposioChannelIds(workspaceId),
    hasUploadPost(workspaceId),
    hasXApiKey(workspaceId),
  ])

  // Group platforms by provider so Upload-Post can still batch.
  const composioPlatforms: ComposioPublishPlatform[] = []
  const uploadPostPlatforms: UploadPostPlatform[] = []
  const xPlatforms: Array<'x'> = []
  const unrouted: PublishablePlatform[] = []

  for (const p of platforms) {
    if (p === 'x') {
      if (hasXApi) xPlatforms.push('x')
      else unrouted.push(p)
    } else if (p !== 'tiktok' && composioIds.has(p)) {
      composioPlatforms.push(p)
    } else if (hasUploadPostKey && UPLOAD_POST_PLATFORMS.has(p)) {
      uploadPostPlatforms.push(p as UploadPostPlatform)
    } else {
      unrouted.push(p)
    }
  }

  const results: RouteResult[] = []

  // X — one call per platform (only 'x' for now)
  for (const _p of xPlatforms) {
    const r = await publishToX(workspaceId, { text: content.caption, videoUrl: content.videoUrl })
    results.push(
      r.ok
        ? { platform: 'x', ok: true, via: 'x-api', postId: r.tweetId }
        : { platform: 'x', ok: false, via: 'x-api', error: r.error },
    )
  }

  // Composio — one call per platform (each is its own OAuth connection)
  for (const p of composioPlatforms) {
    const r = await publishViaComposio(workspaceId, p, content)
    results.push(
      r.ok
        ? { platform: p, ok: true, via: 'composio', postId: r.postId }
        : { platform: p, ok: false, via: 'composio', error: r.error },
    )
  }

  // Upload-Post — one bulk call covers all remaining
  if (uploadPostPlatforms.length > 0) {
    if (!content.videoUrl) {
      for (const p of uploadPostPlatforms) {
        results.push({
          platform: p,
          ok: false,
          via: 'upload-post',
          error: 'Upload-Post needs a rendered video URL.',
        })
      }
    } else {
      const upResult = await publishVideo(workspaceId, {
        videoUrl: content.videoUrl,
        caption: content.caption,
        title: content.title,
        tags: content.tags,
        platforms: uploadPostPlatforms,
      })
      if (upResult.ok) {
        for (const p of uploadPostPlatforms) {
          const id = upResult.postIds[p]
          results.push(
            id
              ? { platform: p, ok: true, via: 'upload-post', postId: id }
              : { platform: p, ok: false, via: 'upload-post', error: 'No post ID returned.' },
          )
        }
      } else {
        for (const p of uploadPostPlatforms) {
          results.push({ platform: p, ok: false, via: 'upload-post', error: upResult.error })
        }
      }
    }
  }

  // Platforms with no usable provider
  for (const p of unrouted) {
    results.push({
      platform: p,
      ok: false,
      error:
        p === 'tiktok'
          ? 'TikTok needs an Upload-Post key. Connect it in Settings → Channels.'
          : p === 'x'
            ? 'X needs your own Developer API credentials. Connect them in Settings → Channels.'
            : `${p} is not connected. Connect it in Settings → Channels.`,
    })
  }

  return results
}

// ---------------------------------------------------------------------------
// Helpers — tiny wrappers around existing stores so the router stays
// free of Supabase/ai_keys boilerplate.
// ---------------------------------------------------------------------------

async function getComposioChannelIds(workspaceId: string): Promise<Set<string>> {
  try {
    const supabase = createAdminClient()
    const { data: ws } = await supabase
      .from('workspaces')
      .select('branding')
      .eq('id', workspaceId)
      .single()
    const branding = (ws?.branding ?? {}) as Record<string, unknown>
    const channels = (branding.channels ?? {}) as Record<string, unknown>
    return new Set(Object.keys(channels))
  } catch {
    return new Set()
  }
}

async function hasUploadPost(workspaceId: string): Promise<boolean> {
  const result = await getDecryptedAiKey(workspaceId, 'upload-post')
  return result.ok
}

async function hasXApiKey(workspaceId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { data: ws } = await supabase
      .from('workspaces')
      .select('branding')
      .eq('id', workspaceId)
      .single()
    const branding = (ws?.branding ?? {}) as Record<string, unknown>
    const channels = (branding.channels ?? {}) as Record<string, unknown>
    const xSlot = (channels.x ?? null) as { credentials?: unknown } | null
    return !!xSlot?.credentials
  } catch {
    return false
  }
}
