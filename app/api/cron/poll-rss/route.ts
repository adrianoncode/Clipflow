import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/security/verify-cron-secret'
import { pingHealthcheck } from '@/lib/monitoring/ping-healthcheck'
import { fetchRssFeedAll } from '@/lib/content/fetch-rss-feed'
import { log } from '@/lib/log'

/**
 * Cron endpoint — iterates every rss_subscriptions row, fetches the
 * feed, and imports new episodes as content_items. Runs once per day
 * (Vercel Hobby plan limit).
 *
 * Protected by a shared CRON_SECRET environment variable.
 *
 * Idempotency: we track the newest-imported episode's `guid` per
 * subscription. If the feed has no new episodes we update
 * last_polled_at and move on. Feeds that fail to fetch get their
 * error recorded in `last_error` without breaking the run for others.
 *
 * Vercel time budget: 300s. With an average 5s per fetch, that caps
 * the comfortable subscription count around ~50. We'll revisit when
 * we hit scale.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Hard cap on how many brand-new episodes we'll import from a single
 *  feed in one poll. Prevents a first-run subscription on a 10-year
 *  podcast from creating 500 content items in one go. */
const MAX_NEW_EPISODES_PER_FEED = 5

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!verifyCronSecret(provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hcUrl = process.env.HEALTHCHECK_POLL_RSS_URL
  await pingHealthcheck(hcUrl, 'start')

  const admin = createAdminClient()

  const { data: subscriptions, error: subErr } = await admin
    .from('rss_subscriptions')
    .select('id, workspace_id, feed_url, last_seen_guid, channel_title, created_by')

  if (subErr) {
    log.error('poll-rss: failed to load subscriptions', subErr)
    await pingHealthcheck(hcUrl, 'fail')
    return NextResponse.json({ error: subErr.message }, { status: 500 })
  }

  const rows = subscriptions ?? []
  let totalImported = 0
  let totalFailed = 0
  const now = new Date().toISOString()

  for (const sub of rows) {
    try {
      const result = await fetchRssFeedAll(sub.feed_url)
      if (!result.ok) {
        await admin
          .from('rss_subscriptions')
          .update({ last_polled_at: now, last_error: result.error })
          .eq('id', sub.id)
        totalFailed++
        continue
      }

      // Feed is returned newest-first. Walk until we hit the already-
      // imported guid, importing only genuinely new ones along the way.
      const newEpisodes: typeof result.episodes = []
      for (const ep of result.episodes) {
        if (sub.last_seen_guid && ep.guid === sub.last_seen_guid) break
        newEpisodes.push(ep)
        if (newEpisodes.length >= MAX_NEW_EPISODES_PER_FEED) break
      }

      if (newEpisodes.length > 0) {
        // Insert episodes oldest-first so the "most recent" guid at
        // the end of our loop is the one we store as last_seen.
        // content_items.created_by is non-nullable; if the subscription
        // lost its original author (workspace owner left, etc.) we'd
        // need to skip the row rather than NULL it. In practice
        // created_by is always set when the subscription is created.
        if (!sub.created_by) {
          await admin
            .from('rss_subscriptions')
            .update({
              last_polled_at: now,
              last_error: 'Original subscriber is no longer in the workspace.',
            })
            .eq('id', sub.id)
          totalFailed++
          continue
        }
        const ownerId = sub.created_by
        const toInsert = [...newEpisodes].reverse().map((ep) => ({
          workspace_id: sub.workspace_id,
          kind: 'rss' as const,
          title: `${result.channelTitle} — ${ep.title}`,
          status: 'ready' as const,
          transcript: ep.text,
          source_url: sub.feed_url,
          created_by: ownerId,
        }))

        const { error: insertErr } = await admin.from('content_items').insert(toInsert)
        if (insertErr) {
          log.error('poll-rss: insert failed', insertErr, {
            subscriptionId: sub.id,
            count: toInsert.length,
          })
          await admin
            .from('rss_subscriptions')
            .update({ last_polled_at: now, last_error: insertErr.message })
            .eq('id', sub.id)
          totalFailed++
          continue
        }

        totalImported += toInsert.length
      }

      await admin
        .from('rss_subscriptions')
        .update({
          last_polled_at: now,
          last_error: null,
          // Newest guid at position 0 in the feed is the new high-water.
          last_seen_guid: result.episodes[0]?.guid ?? sub.last_seen_guid,
          channel_title: result.channelTitle,
        })
        .eq('id', sub.id)
    } catch (err) {
      log.error('poll-rss: unexpected', err, { subscriptionId: sub.id })
      const message = err instanceof Error ? err.message : 'Unknown error'
      await admin
        .from('rss_subscriptions')
        .update({ last_polled_at: now, last_error: message })
        .eq('id', sub.id)
      totalFailed++
    }
  }

  await pingHealthcheck(hcUrl, 'success')
  return NextResponse.json({
    ok: true,
    subscriptions: rows.length,
    imported: totalImported,
    failed: totalFailed,
  })
}
