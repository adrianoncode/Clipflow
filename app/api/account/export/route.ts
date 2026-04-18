import { NextResponse } from 'next/server'

import { getUser } from '@/lib/auth/get-user'
import { checkRateLimit } from '@/lib/rate-limit'
import { exportUserData } from '@/lib/account/export-user-data'

/**
 * GET /api/account/export
 *
 * GDPR Article 20 ("right to data portability"). Streams a JSON blob
 * of everything we store tied to the user — their profile, their
 * workspaces' content and drafts, render history, scheduled posts,
 * subscription state, referral history.
 *
 * What's *not* included (by design):
 *   - AI provider keys (ciphertext — useless to the user)
 *   - Stripe customer/subscription IDs (internal)
 *   - OAuth tokens (security risk to hand over)
 *
 * Rate limit: 3 per hour per user. Generating the export hits ~11
 * DB queries — not free but small enough that we'd rather let users
 * retry without a captcha flow than be too strict.
 */
export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const rl = await checkRateLimit(`account-export:${user.id}`, 3, 60 * 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many export requests. Please wait an hour and try again.' },
      { status: 429 },
    )
  }

  const data = await exportUserData(user.id)

  const filename = `clipflow-export-${user.id}-${Date.now()}.json`
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
