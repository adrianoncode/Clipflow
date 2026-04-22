import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { createAdminClient } from '@/lib/supabase/admin'
import { getFromAddress, getResendClient } from '@/lib/email/client'
import { log } from '@/lib/log'

/**
 * POST /api/feedback
 *
 * In-app feedback widget submits here. We persist to `user_feedback`
 * (service-role bypasses RLS but a defensive user-id check is still
 * applied) and, if Resend + FEEDBACK_EMAIL are configured, forward
 * the message to a human.
 *
 * Never returns user-identifying info in error messages so a
 * mis-addressed POST from the browser can't leak session state.
 */
const bodySchema = z.object({
  type: z.enum(['bug', 'feature', 'feedback']),
  message: z.string().min(1).max(4000),
  path: z.string().max(500).optional(),
})

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid feedback payload.' },
      { status: 400 },
    )
  }

  const user = await getUser()
  const userAgent = request.headers.get('user-agent')?.slice(0, 200) ?? null
  const referer = request.headers.get('referer')?.slice(0, 500) ?? null

  const admin = createAdminClient()
  const { error: insertError } = await admin.from('user_feedback').insert({
    user_id: user?.id ?? null,
    type: parsed.data.type,
    message: parsed.data.message,
    metadata: {
      path: parsed.data.path ?? null,
      user_agent: userAgent,
      referer,
    },
  })

  if (insertError) {
    log.error('feedback insert failed', insertError)
    // We still try to email below — better to deliver SOMEWHERE than
    // 500 the user. But surface a soft failure so the UI retries.
    return NextResponse.json(
      { ok: false, error: 'Could not save feedback. Please try again.' },
      { status: 500 },
    )
  }

  // Best-effort Slack-free delivery via Resend. Any failure here is
  // non-fatal — the row is already in the DB.
  const resend = getResendClient()
  const to = process.env.FEEDBACK_EMAIL
  if (resend && to) {
    try {
      await resend.emails.send({
        from: getFromAddress(),
        to,
        subject: `[Clipflow · ${parsed.data.type.toUpperCase()}] feedback`,
        text: [
          `Type:    ${parsed.data.type}`,
          `User:    ${user?.email ?? '(anonymous)'}`,
          `Path:    ${parsed.data.path ?? referer ?? '(unknown)'}`,
          ``,
          parsed.data.message,
        ].join('\n'),
      })
    } catch (err) {
      log.error('feedback email send failed', err)
    }
  }

  return NextResponse.json({ ok: true })
}
