import { NextResponse, type NextRequest } from 'next/server'

import { resumeRun } from '@/lib/agent/resume'
import { verifyEnvSecret } from '@/lib/security/verify-cron-secret'

/**
 * POST /api/agent/resume
 *
 * Continue a previously-parked agent run. Authentication: shared
 * secret in `x-resume-secret` header (matches `AGENT_RESUME_SECRET` env).
 * Webhook handlers + the cron sweep call this after wakeRunsWaitingOn
 * flips a parked run's status to `queued`.
 *
 * Body: { runId }
 *
 * Implementation lives in `lib/agent/resume.ts` so the cron sweep can
 * call the same logic without a self-fetch.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const provided = req.headers.get('x-resume-secret')
  if (!verifyEnvSecret('AGENT_RESUME_SECRET', provided)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be object' }, { status: 400 })
  }
  const { runId } = body as { runId?: string }
  if (!runId || typeof runId !== 'string') {
    return NextResponse.json({ error: 'runId required' }, { status: 400 })
  }

  const result = await resumeRun(runId)
  if (result.ok) return NextResponse.json(result)
  return NextResponse.json(result, { status: 500 })
}
