import 'server-only'

import { getResendClient, getFromAddress } from '@/lib/email/client'
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'
import { log } from '@/lib/log'

interface ReferralConversionEmailParams {
  /** Referrer — the person who earned the reward. */
  toEmail: string
  toName?: string | null
  /** Display name/email of the referee who just converted. */
  refereeDisplay: string
  /** Optional savings line — when we know the monthly base price. */
  savingsLine?: string | null
}

/**
 * Congratulatory email to the referrer when their referee starts paying.
 * Mirrors the in-app notification but reaches users who aren't in the
 * product right now, pulling them back in.
 */
export async function sendReferralConversionEmail(
  params: ReferralConversionEmailParams,
): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    log.warn('email: RESEND_API_KEY not set, skipping referral conversion email')
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clipflow.to'
  const referralsUrl = `${baseUrl}/settings/referrals`
  const greeting = params.toName ? `Hi ${params.toName},` : 'Hi,'
  const subject = `🎉 ${params.refereeDisplay} signed up — you're saving ${REFERRAL_DISCOUNT_PERCENT}%`

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
        <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">🎉 Your referral paid off</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#374151;">
          ${greeting}<br />
          <strong>${escapeHtml(params.refereeDisplay)}</strong> just started a paid Clipflow
          subscription through your link — your ${REFERRAL_DISCOUNT_PERCENT}% referral
          discount is now active.
        </p>

        ${params.savingsLine ? `
        <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin-bottom:20px;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#047857;">${escapeHtml(params.savingsLine)}</p>
        </div>` : ''}

        <a
          href="${referralsUrl}"
          style="display:inline-block;background:#10b981;color:#fff;font-size:14px;font-weight:600;padding:12px 22px;border-radius:8px;text-decoration:none;"
        >
          View your referrals →
        </a>

        <p style="margin:32px 0 0;font-size:13px;color:#6b7280;line-height:1.55;">
          Want to keep compounding? Share your link again — the discount applies on top of
          your existing plan for as long as both subscriptions stay active.
        </p>

        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">
          Sent by Clipflow.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `${greeting}

${params.refereeDisplay} just started a paid Clipflow subscription through your link — your ${REFERRAL_DISCOUNT_PERCENT}% referral discount is now active.${params.savingsLine ? `\n\n${params.savingsLine}` : ''}

View your referrals: ${referralsUrl}
`

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: params.toEmail,
    subject,
    html,
    text,
  })

  if (error) {
    log.error('email: failed to send referral conversion', error, { toEmail: params.toEmail })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
