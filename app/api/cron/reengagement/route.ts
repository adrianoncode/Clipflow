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

    for (const profile of candidates ?? []) {
      // Skip if we've already sent this kind — idempotency under cron
      // retry + catch-up runs.
      const { data: prior } = await admin
        .from('email_deliveries')
        .select('id')
        .eq('user_id', profile.id)
        .eq('kind', kind)
        .limit(1)
        .maybeSingle()
      if (prior) {
        skipped++
        continue
      }

      // Skip if they've imported any content — they're activated, don't
      // nag.
      const { count: contentCount } = await admin
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', profile.id)
      if ((contentCount ?? 0) > 0) {
        // Still log a "skipped — activated" marker so we don't keep
        // querying on later stages.
        await admin.from('email_deliveries').insert({
          user_id: profile.id,
          kind,
          metadata: { skipped_reason: 'activated' },
        })
        skipped++
        continue
      }

      // Fire email + record.
      await sendReengagementEmail({
        toEmail: profile.email,
        userName: profile.full_name ?? profile.email,
        stage: stage.key,
      })
      await admin
        .from('email_deliveries')
        .insert({ user_id: profile.id, kind })
      sent++
    }

    results[stage.key] = { considered, sent, skipped }
  }

  return NextResponse.json({ ok: true, results })
}
