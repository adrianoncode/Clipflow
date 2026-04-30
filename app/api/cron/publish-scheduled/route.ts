import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { notifyPostPublished } from '@/lib/notifications/triggers'
import { createAdminClient } from '@/lib/supabase/admin'
import { publishToSocial, type PublishablePlatform } from '@/lib/publish/route'
import { triggerWebhooks } from '@/lib/webhooks/trigger-webhook'
import { verifyCronSecret } from '@/lib/security/verify-cron-secret'
import { pingHealthcheck } from '@/lib/monitoring/ping-healthcheck'
import { log } from '@/lib/log'

export const dynamic = 'force-dynamic'

const VALID_PLATFORMS = new Set<PublishablePlatform>([
  'tiktok', 'instagram', 'youtube', 'linkedin', 'facebook', 'x',
])

/**
 * POST /api/cron/publish-scheduled
 *
 * Publishes due posts through the publish router so each platform
 * picks the right backend:
 *   - Composio direct OAuth (linkedin/youtube/instagram/facebook)
 *   - Upload-Post bundle (tiktok + fallback for IG/YT/LinkedIn)
 *   - BYO X API credentials (x)
 *
 * Each post is processed with optimistic locking: status is set to
 * 'publishing' first, then published. If publish succeeds but the
 * status update fails, we retry once to prevent duplicate publishes.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!verifyCronSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hcUrl = process.env.HEALTHCHECK_PUBLISH_SCHEDULED_URL
  await pingHealthcheck(hcUrl, 'start')

  const supabase = createAdminClient()

  // Find posts due for publishing. A post is due when:
  //   - status = 'scheduled'
  //   - scheduled_for <= now            (its real time has come, or)
  //   - next_retry_at <= now            (backoff window elapsed)
  // Slice 13 retry rows are status=scheduled with retry_count>0 and a
  // future next_retry_at, so the same cron picks them up automatically
  // once the backoff is up.
  const now = new Date().toISOString()
  const { data: duePosts } = await supabase
    .from('scheduled_posts')
    .select('id, platform, output_id, workspace_id, retry_count')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .limit(10)

  if (!duePosts?.length) {
    await pingHealthcheck(hcUrl, 'success', { published: 0, due: 0 })
    return NextResponse.json({ ok: true, published: 0 })
  }

  // Fetch output bodies + content titles for due posts. The rendered
  // MP4 URL for this output (if any) lives in metadata.videoUrl —
  // matters for TikTok/IG Reels/Shorts which can't post text-only.
  const outputIds = [...new Set(duePosts.map((p) => p.output_id))]
  const { data: outputs } = await supabase
    .from('outputs')
    .select('id, body, metadata, content_id, content_items(title)')
    .in('id', outputIds)

  const outputMap = new Map<string, { body: string; title: string; videoUrl: string | null }>()
  for (const o of outputs ?? []) {
    const ci = o.content_items as unknown as { title: string | null } | null
    const meta = (o.metadata ?? {}) as Record<string, unknown>
    const videoUrl =
      typeof meta.videoUrl === 'string'
        ? meta.videoUrl
        : typeof meta.video_url === 'string'
          ? meta.video_url
          : null
    outputMap.set(o.id, {
      body: o.body ?? '',
      title: ci?.title ?? 'Scheduled post',
      videoUrl,
    })
  }

  const results: Array<{ id: string; platform: string; ok: boolean; error?: string }> = []

  for (const post of duePosts) {
    // Mark as publishing (optimistic lock — prevents duplicate processing).
    // CRITICAL: read the affected row count. Without `.select('id')` the
    // `lockError` is null when the predicate `eq('status','scheduled')`
    // matches zero rows (e.g. another cron worker already grabbed it),
    // and we'd happily double-publish. We require exactly one row to
    // have flipped — anything else means we lost the race and must skip.
    const { data: locked, error: lockError } = await supabase
      .from('scheduled_posts')
      .update({ status: 'publishing' })
      .eq('id', post.id)
      .eq('status', 'scheduled') // only if still scheduled
      .select('id')

    if (lockError) {
      results.push({ id: post.id, platform: post.platform, ok: false, error: 'Lock failed' })
      continue
    }
    if (!Array.isArray(locked) || locked.length === 0) {
      // Another worker already grabbed it. Skip silently — they'll
      // publish, and our second pass on this post would double-post.
      log.warn('publish-cron: lost optimistic lock, skipping', {
        postId: post.id,
        platform: post.platform,
      })
      continue
    }

    const outputData = outputMap.get(post.output_id) ?? {
      body: '',
      title: 'Scheduled post',
      videoUrl: null,
    }

    // Route via the single publisher so Composio / Upload-Post / X
    // credentials are resolved per-platform. The router handles the
    // "not connected" case with a clear error message.
    let publishOk = false
    let platformPostId: string | undefined
    let publishError: string | undefined

    if (!VALID_PLATFORMS.has(post.platform as PublishablePlatform)) {
      publishError = `Unknown platform: ${post.platform}`
    } else {
      try {
        const routeResults = await publishToSocial(
          post.workspace_id,
          [post.platform as PublishablePlatform],
          {
            caption: outputData.body,
            title: outputData.title,
            videoUrl: outputData.videoUrl ?? undefined,
          },
        )
        const r = routeResults[0]
        if (r?.ok) {
          publishOk = true
          platformPostId = r.postId
        } else {
          publishError = r?.error ?? 'Unknown publish error'
        }
      } catch (err) {
        publishError = err instanceof Error ? err.message : 'Network error'
      }
    }

    if (publishOk) {
      // Update to published — retry once on failure to prevent duplicate publishes
      const updateData = {
        status: 'published' as const,
        published_at: new Date().toISOString(),
        platform_post_id: platformPostId ?? null,
      }
      const { error: updateError } = await supabase
        .from('scheduled_posts')
        .update(updateData)
        .eq('id', post.id)

      if (updateError) {
        // Retry once
        const { error: retryError } = await supabase
          .from('scheduled_posts')
          .update(updateData)
          .eq('id', post.id)
        if (retryError) {
          log.error('publish-cron db update failed after publish', retryError, {
            postId: post.id,
            platform: post.platform,
          })
        }
      }

      // Fire-and-forget webhook
      triggerWebhooks(post.workspace_id, 'post.published', {
        scheduled_post_id: post.id,
        output_id: post.output_id,
        platform: post.platform,
        platform_post_id: platformPostId,
      })

      // Fire-and-forget notification. Failures here must NOT bubble
      // into the publish-cron result — but we still log so a broken
      // notifier doesn't go unnoticed.
      void (async () => {
        try {
          const { data: ws } = await supabase
            .from('workspaces')
            .select('owner_id')
            .eq('id', post.workspace_id)
            .maybeSingle()
          if (!ws?.owner_id) return
          notifyPostPublished({
            userId: ws.owner_id,
            workspaceId: post.workspace_id,
            platform: post.platform,
            contentTitle: outputData.title,
          })
        } catch (notifyErr) {
          log.error('publish-cron: notification delivery failed', notifyErr, {
            postId: post.id,
            platform: post.platform,
          })
        }
      })()

      results.push({ id: post.id, platform: post.platform, ok: true })
    } else {
      // Slice 13 — exponential backoff. Below MAX_RETRIES we stay in
      // status='scheduled' but stamp next_retry_at so this same cron
      // picks the row up again after the window. At/above the cap, the
      // post terminally fails and the user sees the error in the queue.
      const nextCount = (post.retry_count ?? 0) + 1
      const MAX_RETRIES = 3
      if (nextCount > MAX_RETRIES) {
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            error_message: publishError ?? 'Unknown error',
            retry_count: nextCount,
            next_retry_at: null,
          })
          .eq('id', post.id)
      } else {
        // 2^n minutes: 2 / 4 / 8. Capped at the schema's smallint.
        const minutes = Math.pow(2, nextCount)
        const nextAt = new Date(Date.now() + minutes * 60 * 1000).toISOString()
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'scheduled',
            error_message: publishError ?? 'Unknown error',
            retry_count: nextCount,
            next_retry_at: nextAt,
          })
          .eq('id', post.id)
      }

      results.push({ id: post.id, platform: post.platform, ok: false, error: publishError })
    }
  }

  // Revalidate schedule pages for all affected workspaces
  const affectedWorkspaces = new Set(duePosts.map((p) => p.workspace_id))
  for (const wsId of affectedWorkspaces) {
    revalidatePath(`/workspace/${wsId}/schedule`)
  }

  const publishedCount = results.filter((r) => r.ok).length
  const failedCount = results.filter((r) => !r.ok).length

  // Ping healthcheck — mark as failed only if every post failed. Partial
  // failures still count as a healthy run (the cron itself worked).
  if (duePosts.length > 0 && publishedCount === 0 && failedCount > 0) {
    await pingHealthcheck(hcUrl, 'fail', { failed: failedCount })
  } else {
    await pingHealthcheck(hcUrl, 'success', { published: publishedCount, failed: failedCount })
  }

  log.info('publish-scheduled done', { published: publishedCount, failed: failedCount })

  return NextResponse.json({
    ok: true,
    published: publishedCount,
    failed: failedCount,
    results,
  })
}
