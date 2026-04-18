import 'server-only'

import { getResendClient, getFromAddress } from '@/lib/email/client'
import { log } from '@/lib/log'

/**
 * Sends a "payment failed" email when Stripe reports an unpaid invoice
 * on a subscription.
 *
 * Stripe handles its own dunning and retry schedule — our job is to
 * give the user a proactive heads-up so they can update their card
 * before the subscription actually cancels.
 */
export async function sendPaymentFailedEmail(params: {
  toEmail: string
  workspaceName: string
  planName: string
  billingPortalUrl: string
  nextAttemptAt?: Date | null
}): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    log.warn('email: RESEND_API_KEY not set, skipping payment-failed email')
    return
  }

  const nextAttempt = params.nextAttemptAt
    ? params.nextAttemptAt.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0b;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr>
      <td style="background:#111114;border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:40px 32px;">
        <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#fbbf24;">We couldn't charge your card</p>
        <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);">
          Your payment for <strong style="color:#fff;">${escapeHtml(params.planName)}</strong> on <strong style="color:#fff;">${escapeHtml(params.workspaceName)}</strong> didn't go through.
        </p>

        <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#fbbf24;">What happens next</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;">
            ${
              nextAttempt
                ? `Stripe will automatically retry on <strong style="color:#fff;">${nextAttempt}</strong>. If it still fails, your subscription will be paused.`
                : `Stripe will retry over the next few days. If it keeps failing, your subscription will be paused.`
            }
          </p>
        </div>

        <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.6;">
          The quickest fix is to update your card in the billing portal.
        </p>

        <a href="${params.billingPortalUrl}"
          style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#c026d3);color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:999px;text-decoration:none;">
          Update payment method →
        </a>

        <p style="margin:32px 0 0;font-size:12px;color:rgba(255,255,255,0.25);">
          Questions? Reply to this email or write us at support@clipflow.to.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `We couldn't charge your card.

Your payment for ${params.planName} on ${params.workspaceName} didn't go through.

${nextAttempt ? `Stripe will retry on ${nextAttempt}. ` : 'Stripe will retry over the next few days. '}If it keeps failing, your subscription will be paused.

Update your payment method: ${params.billingPortalUrl}

Questions? support@clipflow.to`

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: params.toEmail,
      subject: `Payment failed — ${params.workspaceName}`,
      html,
      text,
    })
  } catch (err) {
    log.error('email: failed to send payment-failed email', err, {
      toEmail: params.toEmail,
    })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
