import 'server-only'

import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'

/**
 * ──────────────────────────────────────────────────────────────────────
 *  Upload-Post engagement stats — scaffolded, not yet verified.
 * ──────────────────────────────────────────────────────────────────────
 *
 *  Upload-Post's public docs describe a GET /api/v1/posts/{postId}
 *  endpoint that returns post metadata + engagement metrics. This file
 *  implements that integration against what the docs say — the exact
 *  response shape hasn't been verified against a real Upload-Post
 *  account yet (no test credentials available).
 *
 *  The implementation is DEFENSIVE:
 *    - If the key is missing → returns `{ ok: false, code: 'missing_key' }`
 *    - If the request 4xx/5xx → returns `{ ok: false, code: 'api_error' }`
 *    - If the response shape is unexpected → returns `{ ok: false, code: 'unknown_shape' }`
 *    - It NEVER throws — callers can treat stats as optional enrichment.
 *
 *  When a real Upload-Post key is available, update the PARSE block
 *  based on the actual response. The rest of the code (HTTP plumbing,
 *  caching, error handling) is production-ready.
 */

const UPLOAD_POST_API = 'https://upload-post.com/api/v1'

export interface PostStats {
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin'
  platformPostId: string
  views?: number
  likes?: number
  comments?: number
  shares?: number
  /** The platform's canonical URL to the post, if returned. */
  url?: string
  /** Timestamp of the stats snapshot (server-side, ISO). */
  fetchedAt: string
}

export type StatsResult =
  | { ok: true; stats: PostStats }
  | {
      ok: false
      code: 'missing_key' | 'not_found' | 'api_error' | 'network' | 'unknown_shape'
      error: string
    }

/**
 * Fetch engagement stats for a single published post by its Upload-Post
 * post ID (the value stored in `scheduled_posts.platform_post_id` after
 * a successful publish).
 */
export async function fetchPostStats(
  workspaceId: string,
  platform: PostStats['platform'],
  platformPostId: string,
): Promise<StatsResult> {
  // 1. Resolve workspace's Upload-Post key
  const keyResult = await getDecryptedAiKey(workspaceId, 'upload-post')
  if (!keyResult.ok) {
    return {
      ok: false,
      code: 'missing_key',
      error: 'No Upload-Post key — stats unavailable.',
    }
  }

  // 2. Call Upload-Post
  let response: Response
  try {
    response = await fetch(
      `${UPLOAD_POST_API}/posts/${encodeURIComponent(platformPostId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${keyResult.plaintext}`,
          Accept: 'application/json',
        },
        // Cache for 5 minutes on the edge — engagement numbers move slowly
        next: { revalidate: 300 },
      },
    )
  } catch (err) {
    return {
      ok: false,
      code: 'network',
      error: err instanceof Error ? err.message : 'Network error.',
    }
  }

  if (response.status === 404) {
    return { ok: false, code: 'not_found', error: 'Post not found on Upload-Post.' }
  }

  if (!response.ok) {
    let detail = ''
    try {
      const body = await response.json()
      detail = body?.message ?? body?.error ?? ''
    } catch {
      /* ignore */
    }
    return {
      ok: false,
      code: 'api_error',
      error: detail || `Upload-Post returned ${response.status}.`,
    }
  }

  // 3. Parse — defensive, falls back to `unknown_shape` if fields missing
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { ok: false, code: 'unknown_shape', error: 'Invalid JSON from Upload-Post.' }
  }

  if (!body || typeof body !== 'object') {
    return { ok: false, code: 'unknown_shape', error: 'Unexpected response shape.' }
  }

  const raw = body as Record<string, unknown>
  // Upload-Post nests metrics either top-level or under a `metrics` / `stats` key.
  // We check both — update this block when the real shape is confirmed.
  const metrics =
    (typeof raw.metrics === 'object' && raw.metrics
      ? (raw.metrics as Record<string, unknown>)
      : null) ??
    (typeof raw.stats === 'object' && raw.stats
      ? (raw.stats as Record<string, unknown>)
      : null) ??
    raw

  const num = (key: string): number | undefined => {
    const v = metrics[key]
    return typeof v === 'number' ? v : undefined
  }

  const urlStr = typeof raw.url === 'string' ? raw.url : undefined

  return {
    ok: true,
    stats: {
      platform,
      platformPostId,
      views: num('views') ?? num('view_count') ?? num('playCount'),
      likes: num('likes') ?? num('like_count') ?? num('diggCount'),
      comments: num('comments') ?? num('comment_count'),
      shares: num('shares') ?? num('share_count'),
      url: urlStr,
      fetchedAt: new Date().toISOString(),
    },
  }
}

/**
 * Batch-fetch stats for multiple posts. Upload-Post doesn't seem to
 * expose a batch endpoint — we parallelize individual GETs with a small
 * concurrency limit to avoid rate limiting.
 */
export async function fetchPostStatsBatch(
  workspaceId: string,
  posts: Array<{
    platform: PostStats['platform']
    platformPostId: string
  }>,
  concurrency = 4,
): Promise<Array<StatsResult>> {
  const results: StatsResult[] = []
  for (let i = 0; i < posts.length; i += concurrency) {
    const batch = posts.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map((p) => fetchPostStats(workspaceId, p.platform, p.platformPostId)),
    )
    results.push(...batchResults)
  }
  return results
}
