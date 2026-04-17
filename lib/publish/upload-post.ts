import 'server-only'

import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'

export type PublishPlatform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin'

export interface PublishInput {
  /** Public URL to the rendered MP4. Must be accessible by Upload-Post servers. */
  videoUrl: string
  /** Caption / description shown on each platform. */
  caption: string
  /** Optional title — used for YouTube. Falls back to first 100 chars of caption. */
  title?: string
  /** Hashtags without the # prefix. */
  tags?: string[]
  /** Which platforms to post to. Defaults to all connected platforms. */
  platforms?: PublishPlatform[]
}

export type PublishResult =
  | { ok: true; postIds: Partial<Record<PublishPlatform, string>> }
  | { ok: false; error: string; code: 'missing_key' | 'api_error' | 'network' }

const UPLOAD_POST_API = 'https://upload-post.com/api/v1'

/**
 * Publish a rendered video to one or more social platforms via the
 * user's own Upload-Post BYOK key.
 *
 * Flow:
 *   1. Resolve the workspace's Upload-Post API key from ai_keys
 *   2. POST to /post with videoUrl + caption + platforms
 *   3. Return the platform-specific post IDs on success
 *
 * Upload-Post handles the per-platform OAuth — they store the user's
 * TikTok/Instagram/YouTube/LinkedIn tokens. We only hold their UP key.
 */
export async function publishVideo(
  workspaceId: string,
  input: PublishInput,
): Promise<PublishResult> {
  // 1. Resolve key
  const keyResult = await getDecryptedAiKey(workspaceId, 'upload-post')
  if (!keyResult.ok) {
    return {
      ok: false,
      error:
        'Upload-Post not connected. Go to Settings → AI Connections → Publishing to connect it.',
      code: 'missing_key',
    }
  }

  const platforms = input.platforms ?? ['tiktok', 'instagram', 'youtube', 'linkedin']
  const title = input.title ?? input.caption.slice(0, 100)

  // 2. Call Upload-Post API
  let response: Response
  try {
    response = await fetch(`${UPLOAD_POST_API}/post`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keyResult.plaintext}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platforms,
        video: input.videoUrl,
        title,
        description: input.caption,
        tags: input.tags ?? [],
      }),
    })
  } catch {
    return {
      ok: false,
      error: 'Could not reach Upload-Post — check your internet connection.',
      code: 'network',
    }
  }

  if (!response.ok) {
    let detail = ''
    try {
      const body = await response.json()
      detail = body?.message ?? body?.error ?? ''
    } catch { /* ignore */ }
    return {
      ok: false,
      error: detail || `Upload-Post returned ${response.status}. Check your key and connected social accounts.`,
      code: 'api_error',
    }
  }

  const data = await response.json()

  // Upload-Post returns { posts: { tiktok: { id }, instagram: { id }, ... } }
  const posts = (data?.posts ?? {}) as Record<string, { id?: string }>
  const postIds: Partial<Record<PublishPlatform, string>> = {}
  for (const [platform, post] of Object.entries(posts)) {
    if (post?.id) postIds[platform as PublishPlatform] = post.id
  }

  return { ok: true, postIds }
}
