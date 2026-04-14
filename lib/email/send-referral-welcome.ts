import 'server-only'

import { getResendClient, getFromAddress } from '@/lib/email/client'
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'

interface ReferralWelcomeParams {
  /** The new signup (referee). */
  toEmail: string
  toName?: string | null
  /** Display name of the person who invited them. */
  referrerDisplay: string
}

/**
 * Reinforces the referral discount to the new user right after signup.
 * Complements the "20 % off unlocked" banner on the signup page — users
 * who sign up via magic link or close the tab before the banner loads
 * still get the confirmation in writing.
 */
export async function sendReferralWelcomeEmail(params: ReferralWelcomeParams): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, skipping referral welcome email')
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clipflow.io'
  const billingUrl = `${baseUrl}/billing`
  const greeting = params.toName ? `Hi ${params.toName},` : 'Hi,'
  const subject = `Welcome to Clipflow — your ${REFERRAL_DISCOUNT_PERCENT}% discount is ready`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
        <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
          🎁 You've got ${REFERRAL_DISCOUNT_PERCENT}% off
        </p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#374151;">
          ${greeting}<br />
          <strong>${escapeHtml(params.referrerDisplay)}</strong> invited you to Clipflow —
          the tool they use to turn one video into posts for TikTok, Reels, Shorts and LinkedIn.
        </p>

        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#047857;">
            ${REFERRAL_DISCOUNT_PERCENT}% off your first paid plan
          </p>
          <p style="margin:0;font-size:13px;color:#065f46;">
            Applied automatically at checkout. Stays active for as long as your subscription runs.
          </p>
        </div>

        <p style="margin:0 0 16px;font-size:14px;color:#374151;">
          No need to rush — play around on the free plan first. When you're ready to scale,
          your discount is waiting.
        </p>

        <a
          href="${billingUrl}"
          style="display:inline-block;background:#10b981;color:#fff;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;text-decoration:none;"
        >
          See plans →
        </a>

        <p style="margin:32px 0 0;font-size:12px;color:#9ca3af;">
          Sent by Clipflow.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `${greeting}

${params.referrerDisplay} invited you to Clipflow.

Your ${REFERRAL_DISCOUNT_PERCENT}% discount on any paid plan is applied automatically at checkout and stays active as long as your subscription runs.

See plans: ${billingUrl}
`

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: params.toEmail,
    subject,
    html,
    text,
  })

  if (error) {
    console.error('[email] Failed to send referral welcome:', error)
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
