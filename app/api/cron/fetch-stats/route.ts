import { NextRequest, NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/crypto/encryption'
import { verifyCronSecret } from '@/lib/security/verify-cron-secret'
import { pingHealthcheck } from '@/lib/monitoring/ping-healthcheck'
import { log } from '@/lib/log'

export const dynamic = 'force-dynamic'

const UPLOAD_POST_API = 'https://upload-post.com/api/v1'

/**
 * GET /api/cron/fetch-stats
 *
 * Vercel Cron (or manual trigger) — fetches engagement stats from Upload-Post
 * for recently published posts. Runs every 2 hours.
 *
 * Rules:
 * - Only published posts from the last 7 days
 * - Skip posts already checked within the last 6 hours
 * - Max 20 posts per run (rate-limit friendly)
 * - Updates scheduled_posts.metadata with latest stats
 */
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get('x-cron-secret') ??
    req.nextUrl.searchParams.get('secret')
  if (!verifyCronSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hcUrl = process.env.HEALTHCHECK_FETCH_STATS_URL
  await pingHealthcheck(hcUrl, 'start')

  const supabase = createAdminClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

  const { data: posts, error: queryError } = await supabase
    .from('scheduled_posts')
    .select('id, workspace_id, platform, platform_post_id, stats_fetched_at')
    .eq('status', 'published')
    .not('platform_post_id', 'is', null)
    .gte('published_at', sevenDaysAgo)
    .or(`stats_fetched_at.is.null,stats_fetched_at.lt.${sixHoursAgo}`)
    .order('published_at', { ascending: false })
    .limit(20)

  if (queryError) {
    log.error('fetch-stats query failed', queryError)
    await pingHealthcheck(hcUrl, 'fail', { error: queryError.message })
    return NextResponse.json(
      { error: 'Query failed', detail: queryError.message },
      { status: 500 },
    )
  }

  if (!posts?.length) {
    await pingHealthcheck(hcUrl, 'success', { fetched: 0 })
    return NextResponse.json({ ok: true, fetched: 0, message: 'No posts need stats refresh.' })
  }

  // Group by workspace — one key decryption per workspace
  const byWorkspace = new Map<string, typeof posts>()
  for (const post of posts) {
    const existing = byWorkspace.get(post.workspace_id) ?? []
    byWorkspace.set(post.workspace_id, [...existing, post])
  }

  // Cache decrypted API keys per workspace
  const keyCache = new Map<string, string | null>()

  async function getApiKey(workspaceId: string): Promise<string | null> {
    if (keyCache.has(workspaceId)) return keyCache.get(workspaceId)!

    const { data } = await supabase
      .from('ai_keys')
      .select('ciphertext, iv, auth_tag')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'upload-post')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) {
      keyCache.set(workspaceId, null)
      return null
    }

    try {
      const plaintext = decrypt({
        ciphertext: data.ciphertext,
        iv: data.iv,
        authTag: data.auth_tag,
      })
      keyCache.set(workspaceId, plaintext)
      return plaintext
    } catch {
      keyCache.set(workspaceId, null)
      return null
    }
  }

  const results: Array<{ id: string; ok: boolean; error?: string }> = []

  for (const [workspaceId, workspacePosts] of byWorkspace) {
    const apiKey = await getApiKey(workspaceId)
    if (!apiKey) {
      for (const post of workspacePosts) {
        results.push({ id: post.id, ok: false, error: 'No Upload-Post key for workspace' })
      }
      continue
    }

    // Process up to 4 at a time per workspace
    for (let i = 0; i < workspacePosts.length; i += 4) {
      const batch = workspacePosts.slice(i, i + 4)
      const batchResults = await Promise.all(
        batch.map(async (post) => {
          if (!post.platform_post_id) {
            return { id: post.id, ok: false, error: 'Missing platform post ID' }
          }

          let response: Response
          try {
            response = await fetch(
              `${UPLOAD_POST_API}/posts/${encodeURIComponent(post.platform_post_id)}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  Accept: 'application/json',
                },
              },
            )
          } catch (err) {
            return {
              id: post.id,
              ok: false,
              error: err instanceof Error ? err.message : 'Network error',
            }
          }

          if (!response.ok) {
            return { id: post.id, ok: false, error: `Upload-Post returned ${response.status}` }
          }

          let body: Record<string, unknown>
          try {
            body = (await response.json()) as Record<string, unknown>
          } catch {
            return { id: post.id, ok: false, error: 'Invalid JSON from Upload-Post' }
          }

          // Metrics can be at top level, under .metrics, or under .stats
          const metrics =
            (typeof body.metrics === 'object' && body.metrics
              ? (body.metrics as Record<string, unknown>)
              : null) ??
            (typeof body.stats === 'object' && body.stats
              ? (body.stats as Record<string, unknown>)
              : null) ??
            body

          const num = (key: string): number | undefined => {
            const v = metrics[key]
            return typeof v === 'number' ? v : undefined
          }

          const views = num('views') ?? num('view_count') ?? num('playCount')
          const likes = num('likes') ?? num('like_count') ?? num('diggCount')
          const comments = num('comments') ?? num('comment_count')
          const shares = num('shares') ?? num('share_count')
          const url = typeof body.url === 'string' ? body.url : undefined

          const engagementRate =
            views && views > 0
              ? (((likes ?? 0) + (comments ?? 0) + (shares ?? 0)) / views) * 100
              : null

          const metadata = {
            views: views ?? null,
            likes: likes ?? null,
            comments: comments ?? null,
            shares: shares ?? null,
            engagement_rate:
              engagementRate !== null ? Math.round(engagementRate * 100) / 100 : null,
            url: url ?? null,
            fetched_at: new Date().toISOString(),
          }

          const { error: updateError } = await supabase
            .from('scheduled_posts')
            .update({
              metadata,
              stats_fetched_at: new Date().toISOString(),
            })
            .eq('id', post.id)

          if (updateError) {
            return { id: post.id, ok: false, error: updateError.message }
          }

          return { id: post.id, ok: true }
        }),
      )
      results.push(...batchResults)
    }
  }

  const fetchedCount = results.filter((r) => r.ok).length
  const failedCount = results.filter((r) => !r.ok).length

  // Log warning + fail-ping if majority of fetches failed — likely an
  // Upload-Post outage or expired key across workspaces.
  if (failedCount > 0 && failedCount >= fetchedCount) {
    log.warn('fetch-stats high failure rate', {
      failed: failedCount,
      total: results.length,
      sampleErrors: results
        .filter((r) => !r.ok)
        .slice(0, 3)
        .map((r) => ({ id: r.id, error: r.error })),
    })
    await pingHealthcheck(hcUrl, 'fail', { failed: failedCount, total: results.length })
  } else {
    log.info('fetch-stats done', { fetched: fetchedCount, failed: failedCount })
    await pingHealthcheck(hcUrl, 'success', { fetched: fetchedCount, failed: failedCount })
  }

  return NextResponse.json({
    ok: true,
    fetched: fetchedCount,
    failed: failedCount,
    total: results.length,
    results,
  })
}
