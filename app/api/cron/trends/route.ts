import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/security/verify-cron-secret'
import { pingHealthcheck } from '@/lib/monitoring/ping-healthcheck'
import { fetchAllTrendingKeywords } from '@/lib/trends/fetch-trending-keywords'
import { log } from '@/lib/log'

/**
 * Daily cron — refreshes `public.trending_keywords` per niche. The
 * find-viral-moments action reads this table and uses the keywords to
 * award a +5/+3 bonus per match in clip hooks/transcripts.
 *
 * Auth: shared `CRON_SECRET` (Authorization: Bearer <secret>).
 * Recommended schedule (Vercel cron): once per day, 04:00 UTC.
 *
 * Quota: ~900 YouTube Data API units per run, well under the 10 000
 * free daily limit. See lib/trends/fetch-trending-keywords for the
 * full math.
 *
 * Idempotency: writes a fresh snapshot keyed by (niche, keyword,
 * fetched_at) and prunes rows older than 14 days at the end of the
 * run. The post-processing matcher reads the latest snapshot per
 * niche, so older rows are kept only as a debug history.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const RETENTION_DAYS = 14

export async function GET(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!verifyCronSecret(provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    log.error('cron/trends: GOOGLE_API_KEY missing')
    return NextResponse.json(
      { error: 'GOOGLE_API_KEY not configured' },
      { status: 500 },
    )
  }

  const hcUrl = process.env.HEALTHCHECK_TRENDS_URL
  await pingHealthcheck(hcUrl, 'start')

  const admin = createAdminClient()

  let result: Awaited<ReturnType<typeof fetchAllTrendingKeywords>>
  try {
    result = await fetchAllTrendingKeywords({ apiKey })
  } catch (err) {
    log.error('cron/trends fetch failed', err)
    await pingHealthcheck(hcUrl, 'fail')
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Fetch failed' },
      { status: 500 },
    )
  }

  if (result.rows.length === 0) {
    // Don't write anything if every niche came up empty — almost
    // certainly a quota or auth blip. Keeps the previous snapshot
    // alive instead of stomping it with zeros.
    log.warn('cron/trends: no rows returned, skipping insert', result.perNiche)
    await pingHealthcheck(hcUrl, 'fail')
    return NextResponse.json(
      { warning: 'No rows fetched, retained previous snapshot.' },
      { status: 200 },
    )
  }

  // Insert fresh snapshot. Same `fetched_at` for the whole batch so
  // the matcher can grab the most recent set with one
  // `order by fetched_at desc limit 1` lookup per niche.
  const fetchedAt = new Date().toISOString()
  const { error: insertErr } = await admin
    .from('trending_keywords')
    .insert(
      result.rows.map((r) => ({
        niche_id: r.niche_id,
        keyword: r.keyword,
        frequency: r.frequency,
        score: r.score,
        source: r.source,
        fetched_at: fetchedAt,
      })),
    )

  if (insertErr) {
    log.error('cron/trends insert failed', insertErr)
    await pingHealthcheck(hcUrl, 'fail')
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  // Prune anything older than retention window. Service-role bypasses
  // RLS so the policy doesn't matter.
  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()
  await admin
    .from('trending_keywords')
    .delete()
    .lt('fetched_at', cutoff)

  await pingHealthcheck(hcUrl, 'success')

  return NextResponse.json({
    ok: true,
    inserted: result.rows.length,
    perNiche: result.perNiche,
  })
}
