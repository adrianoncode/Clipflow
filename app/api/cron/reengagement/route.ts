import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/security/verify-cron-secret'
import {
  sendReengagementEmail,
  reengagementKindFor,
} from '@/lib/email/send-reengagement'
import { log } from '@/lib/log'

// `email_deliveries` was added in migration 20260419000000. The generated
// supabase types haven't been regenerated yet (that needs a live DB
// connection via `supabase gen types`), so the client-typed `.from`
// rejects the table name. Escape hatch: cast the admin client to a
// permissive shape just for this file. Remove the cast next time we
// regenerate types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseClient = any

/**
 * Re-engagement drip cron.
 *
 * Runs once per day. For each of three stages (day 3, day 7, day 14),
 * finds users who:
 *   - signed up within a 24-hour window that started exactly N days ago
 *   - have zero content items in any of their workspaces
 *   - have not already received this kind of email
 *
 * Sends the stage's email, logs the send in `email_deliveries`.
 *
 * Protected by CRON_SECRET. Vercel scheduled-function + Healthchecks
 * ping URL both hit this with the same bearer.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Stage = { key: 'day_3' | 'day_7' | 'day_14'; daysAgo: number }

const STAGES: Stage[] = [
  { key: 'day_3', daysAgo: 3 },
  { key: 'day_7', daysAgo: 7 },
  { key: 'day_14', daysAgo: 14 },
]

export async function POST(req: Request) {
  const provided =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    new URL(req.url).searchParams.get('secret') ??
    ''
  if (!verifyCronSecret(provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient() as unknown as LooseClient
  const results: Record<string, { considered: number; sent: number; skipped: number }> = {}

  for (const stage of STAGES) {
    const kind = reengagementKindFor(stage.key)
    const windowStart = new Date(Date.now() - (stage.daysAgo + 1) * 86_400_000)
    const windowEnd = new Date(Date.now() - stage.daysAgo * 86_400_000)

    // Profiles that signed up in the matching 24h window.
    const { data: candidates, error: profilesErr } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .gte('created_at', windowStart.toISOString())
      .lt('created_at', windowEnd.toISOString())

    if (profilesErr) {
      log.error('reengagement: profile fetch failed', profilesErr, {
        stage: stage.key,
      })
      continue
    }

    let sent = 0
    let skipped = 0
    const considered = (candidates ?? []).length
    const candidateIds = (candidates ?? []).map((c: { id: string }) => c.id)

    // Bulk-load everything the per-profile loop used to fetch one-by-
    // one. Previously this loop cost 2-3 DB round-trips per candidate
    // (email_deliveries lookup + content count + optional insert). For
    // a 100-profile stage that's ~300 sequential queries per cron run.
    // Now: 2 bulk queries up front, then in-memory filters + one bulk
    // insert at the end.
    if (candidateIds.length === 0) {
      results[stage.key] = { considered, sent, skipped }
      continue
    }

    const [priorDeliveries, activatedContent] = await Promise.all([
      admin
        .from('email_deliveries')
        .select('user_id')
        .in('user_id', candidateIds)
        .eq('kind', kind),
      admin
        .from('content_items')
        .select('created_by')
        .in('created_by', candidateIds)
        .limit(candidateIds.length * 5),
    ])

    const alreadySent = new Set(
      (priorDeliveries.data ?? []).map((r: { user_id: string }) => r.user_id),
    )
    const hasContent = new Set(
      (activatedContent.data ?? []).map(
        (r: { created_by: string }) => r.created_by,
      ),
    )

    const activatedSkipMarkers: Array<{
      user_id: string
      kind: string
      metadata: { skipped_reason: string }
    }> = []

    for (const profile of candidates ?? []) {
      if (alreadySent.has(profile.id)) {
        skipped++
        continue
      }
      if (hasContent.has(profile.id)) {
        activatedSkipMarkers.push({
          user_id: profile.id,
          kind,
          metadata: { skipped_reason: 'activated' },
        })
        skipped++
        continue
      }

      // Emails still fire sequentially — Resend's per-second throttle
      // makes parallelizing risky. DB write batched below.
      await sendReengagementEmail({
        toEmail: profile.email,
        userName: profile.full_name ?? profile.email,
        stage: stage.key,
      })
      activatedSkipMarkers.push({
        user_id: profile.id,
        kind,
        metadata: { skipped_reason: '' },
      })
      sent++
    }

    // Single batch insert for every delivery row (both sent + activated-
    // skip) instead of one insert per profile. Empty metadata string is
    // normalized to an empty object-less kind entry so the existing
    // query `eq('user_id').eq('kind')` idempotency check still matches.
    const inserts = activatedSkipMarkers.map((m) =>
      m.metadata.skipped_reason
        ? m
        : { user_id: m.user_id, kind: m.kind },
    )
    if (inserts.length > 0) {
      await admin.from('email_deliveries').insert(inserts as never)
    }

    results[stage.key] = { considered, sent, skipped }
  }

  return NextResponse.json({ ok: true, results })
}
