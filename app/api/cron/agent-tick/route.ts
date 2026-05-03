import { NextResponse, type NextRequest } from 'next/server'

import { resumeRun } from '@/lib/agent/resume'
import { findStuckWaitingRuns, transitionStatus } from '@/lib/agent/state'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret } from '@/lib/security/verify-cron-secret'
import { log } from '@/lib/log'

/**
 * GET /api/cron/agent-tick
 *
 * Hourly sweep that does two things:
 *
 *   1. Finds parked runs whose deadline has passed (webhook never
 *      arrived) and marks them failed so they don't sit indefinitely
 *      in `waiting_external`.
 *
 *   2. Picks up `queued` chat runs (set by webhook wake-ups but never
 *      processed inline) and resumes them.
 *
 * Cron is the FALLBACK — webhooks are the primary resume path. If
 * Phase 2.5 telemetry shows webhooks consistently miss, we'll
 * either tighten webhook reliability or switch to a queue (Inngest)
 * before Phase 3.
 *
 * Auth: standard `CRON_SECRET` via Authorization Bearer or
 * `?secret=` query param.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_RESUMES_PER_TICK = 20

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const headerToken = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const queryToken = new URL(req.url).searchParams.get('secret')
  const provided = headerToken ?? queryToken
  if (!verifyCronSecret(provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Step 1: timeout stuck waiting_external runs ─────────────────
  const stuck = await findStuckWaitingRuns(50)
  let timedOut = 0
  for (const r of stuck) {
    const res = await transitionStatus({
      runId: r.id,
      expectedVersion: r.version,
      newStatus: 'failed',
      error: 'Webhook never arrived; run timed out.',
      setEndedAt: true,
    })
    if (res.ok) timedOut++
  }

  // ── Step 2: resume queued chat runs ─────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data: queued } = await admin
    .from('agent_runs')
    .select('id')
    .eq('status', 'queued')
    .eq('kind', 'chat')
    .order('updated_at', { ascending: true })
    .limit(MAX_RESUMES_PER_TICK)

  let resumed = 0
  let failed = 0
  for (const row of (queued ?? []) as Array<{ id: string }>) {
    try {
      const r = await resumeRun(row.id)
      if (r.ok) resumed++
      else failed++
    } catch (err) {
      failed++
      log.error('agent-tick resumeRun crashed', err instanceof Error ? err : new Error(String(err)), {
        runId: row.id,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    timedOut,
    resumed,
    failed,
    queuedFound: (queued ?? []).length,
  })
}
