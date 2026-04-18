import 'server-only'

import { getResendClient, getFromAddress } from '@/lib/email/client'
import { log } from '@/lib/log'

/**
 * Sends a team-invite email with the accept link.
 *
 * Called from `inviteMemberAction` after we insert the `workspace_invites`
 * row. Fire-and-forget — a failed email shouldn't block the invite
 * creation, because the owner can always copy the link manually from
 * the members page.
 *
 * The token route (`/invite/:token`) handles expiry + membership
 * binding. This email is just the delivery channel.
 */
export async function sendTeamInviteEmail(params: {
  toEmail: string
  workspaceName: string
  inviterName: string
  role: string
  token: string
  appUrl?: string
}): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    log.warn('email: RESEND_API_KEY not set, skipping team invite email')
    return
  }

  const appUrl =
    params.appUrl ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'https://clipflow.to'
  const acceptUrl = `${appUrl}/invite/${params.token}`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0b;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr>
      <td style="background:#111114;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;">
        <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#fff;">You're invited to ${escapeHtml(params.workspaceName)}</p>
        <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);">
          ${escapeHtml(params.inviterName)} invited you as a <strong style="color:#fff;">${escapeHtml(params.role)}</strong> on Clipflow.
        </p>

        <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#a78bfa;">What you'll get access to</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6;">
            The full workflow in <strong style="color:#fff;">${escapeHtml(params.workspaceName)}</strong> — videos, drafts, schedule and analytics. Your role sets what you can edit vs. review.
          </p>
        </div>

        <a href="${acceptUrl}"
          style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#c026d3);color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:999px;text-decoration:none;">
          Accept invite →
        </a>

        <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">
          Or copy this link: <span style="color:rgba(255,255,255,0.6);">${acceptUrl}</span>
        </p>

        <p style="margin:32px 0 0;font-size:12px;color:rgba(255,255,255,0.25);">
          If you weren't expecting this, you can ignore this email. The invite will expire on its own.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `${params.inviterName} invited you to join ${params.workspaceName} on Clipflow as a ${params.role}.

Accept the invite: ${acceptUrl}

If you weren't expecting this, ignore this email. The invite will expire on its own.`

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: params.toEmail,
      subject: `${params.inviterName} invited you to ${params.workspaceName} on Clipflow`,
      html,
      text,
    })
  } catch (err) {
    log.error('email: failed to send team invite email', err, {
      toEmail: params.toEmail,
      workspaceName: params.workspaceName,
    })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
