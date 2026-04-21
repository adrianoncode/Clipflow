'use server'

import { revalidatePath } from 'next/cache'

import { decrypt } from '@/lib/crypto/encryption'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'

// Rate-limit per workspace so users can't hammer Upload-Post. The cron
// runs every 3 hours; manual refresh gives them a safety valve at most
// once every 5 minutes per workspace.
const MANUAL_COOLDOWN_MS = 5 * 60 * 1000
const UPLOAD_POST_API = 'https://upload-post.com/api/v1'

export interface RefreshStatsResult {
  ok: boolean
  fetched?: number
  failed?: number
  cooldownMs?: number
  /** ISO timestamp of the most recent stats fetch — used by the UI to
   *  tell the user when the current numbers were last pulled. */
  lastFetchedAt?: string | null
  error?: string
}

/**
 * Server action — pulls the latest engagement metrics for published posts
 * in this workspace, same as the nightly cron but without the 6-hour
 * dedupe window. Owner/editor only. Returns counts + any remaining
 * cooldown so the caller can disable the button until fresh data is
 * likely to exist.
 */
export async function refreshWorkspaceStatsAction(
  workspaceId: string,
): Promise<RefreshStatsResult> {
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only owners or editors can refresh stats.' }
  }

  const supabase = createAdminClient()

  // Rate-limit — check the most recent stats_fetched_at across the
  // workspace. If a fetch happened within cooldown, bail without
  // burning Upload-Post quota.
  const { data: lastFetch } = await supabase
    .from('scheduled_posts')
    .select('stats_fetched_at')
    .eq('workspace_id', workspaceId)
    .not('stats_fetched_at', 'is', null)
    .order('stats_fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastFetch?.stats_fetched_at) {
    const elapsed = Date.now() - new Date(lastFetch.stats_fetched_at).getTime()
    if (elapsed < MANUAL_COOLDOWN_MS) {
      // Pinpoint who/what triggered the last pull so the user doesn't
      // assume they clicked themselves. Could be: this user manually,
      // a teammate manually, or the 3-hour cron.
      const whenSec = Math.round(elapsed / 1000)
      const whenLabel = whenSec < 60 ? `${whenSec}s ago` : `${Math.round(whenSec / 60)} min ago`
      return {
        ok: false,
        error: `Stats were pulled ${whenLabel} (either by a teammate or the 3-hour cron). Next manual refresh in ${Math.ceil(
          (MANUAL_COOLDOWN_MS - elapsed) / 1000,
        )}s.`,
        cooldownMs: MANUAL_COOLDOWN_MS - elapsed,
        lastFetchedAt: lastFetch.stats_fetched_at,
      }
    }
  }

  // Get the workspace's Upload-Post key once.
  const { data: keyRow } = await supabase
    .from('ai_keys')
    .select('ciphertext, iv, auth_tag')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'upload-post')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!keyRow) {
    return { ok: false, error: 'Connect an Upload-Post key first to pull stats.' }
  }

  let apiKey: string
  try {
    apiKey = decrypt({
      ciphertext: keyRow.ciphertext,
      iv: keyRow.iv,
      authTag: keyRow.auth_tag,
    })
  } catch {
    return { ok: false, error: 'Stored key failed to decrypt — re-add it in Channels.' }
  }

  // Only posts from the last 30 days with a platform post id — beyond
  // that Upload-Post rarely carries meaningful deltas.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('id, platform, platform_post_id')
    .eq('workspace_id', workspaceId)
    .eq('status', 'published')
    .not('platform_post_id', 'is', null)
    .gte('published_at', thirtyDaysAgo)
    .order('published_at', { ascending: false })
    .limit(30)

  if (!posts?.length) {
    return { ok: true, fetched: 0, failed: 0 }
  }

  let fetched = 0
  let failed = 0

  // Process 4 at a time to stay under Upload-Post rate limits.
  for (let i = 0; i < posts.length; i += 4) {
    const batch = posts.slice(i, i + 4)
    const results = await Promise.all(
      batch.map(async (post) => {
        if (!post.platform_post_id) return false
        try {
          const res = await fetch(
            `${UPLOAD_POST_API}/posts/${encodeURIComponent(post.platform_post_id)}`,
            { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } },
          )
          if (!res.ok) return false
          const body = (await res.json()) as Record<string, unknown>
          const metrics =
            (typeof body.metrics === 'object' && body.metrics
              ? (body.metrics as Record<string, unknown>)
              : null) ??
            (typeof body.stats === 'object' && body.stats
              ? (body.stats as Record<string, unknown>)
              : null) ??
            body
          const num = (k: string) =>
            typeof metrics[k] === 'number' ? (metrics[k] as number) : undefined
          const views = num('views') ?? num('view_count') ?? num('playCount')
          const likes = num('likes') ?? num('like_count') ?? num('diggCount')
          const comments = num('comments') ?? num('comment_count')
          const shares = num('shares') ?? num('share_count')
          const url = typeof body.url === 'string' ? body.url : undefined
          const engagementRate =
            views && views > 0
              ? (((likes ?? 0) + (comments ?? 0) + (shares ?? 0)) / views) * 100
              : null
          const { error } = await supabase
            .from('scheduled_posts')
            .update({
              metadata: {
                views: views ?? null,
                likes: likes ?? null,
                comments: comments ?? null,
                shares: shares ?? null,
                engagement_rate:
                  engagementRate !== null ? Math.round(engagementRate * 100) / 100 : null,
                url: url ?? null,
                fetched_at: new Date().toISOString(),
              },
              stats_fetched_at: new Date().toISOString(),
            })
            .eq('id', post.id)
          return !error
        } catch {
          return false
        }
      }),
    )
    for (const ok of results) {
      if (ok) fetched++
      else failed++
    }
  }

  log.info('manual stats refresh', { workspaceId, fetched, failed })
  revalidatePath('/analytics')

  return { ok: true, fetched, failed, lastFetchedAt: new Date().toISOString() }
}
