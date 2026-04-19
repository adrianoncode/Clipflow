import 'server-only'

import { getResendClient, getFromAddress } from '@/lib/email/client'
import { log } from '@/lib/log'

/**
 * Re-engagement drip: nudges users who signed up but never imported a
 * video. Three stages, three different tones.
 *
 *   day_3  — light, "get started in 30 seconds" nudge
 *   day_7  — helpful, "here's what others like you have shipped"
 *   day_14 — last attempt, "closing the loop" / offer help
 *
 * Stages picked empirically — most creator-SaaS data says users who
 * don't activate by day 14 rarely come back without direct outreach.
 * After day 14 we stop emailing to avoid being spam.
 */

type Stage = 'day_3' | 'day_7' | 'day_14'

interface Copy {
  subject: string
  headline: string
  body: string
  cta: string
  ctaHref: string
}

const COPY: Record<Stage, Copy> = {
  day_3: {
    subject: 'Your first video → 4 platform posts in 30 seconds',
    headline: 'Still here?',
    body:
      "You signed up a few days ago but haven't imported a video yet. The fastest way to see what Clipflow does: paste a YouTube URL, wait 30 seconds, and you'll have four platform-native drafts ready to review.",
    cta: 'Import your first video →',
    ctaHref: 'https://clipflow.to/dashboard',
  },
  day_7: {
    subject: 'A week in — want a hand getting started?',
    headline: 'Stuck somewhere?',
    body:
      "It's been a week since you signed up. If Clipflow didn't click or you ran into a snag, reply to this email — a real human reads every message and will help you get unstuck. Most first-time users hit the AI-key step; our docs walk you through it in two minutes.",
    cta: 'Read the getting-started guide',
    ctaHref: 'https://clipflow.to/help/getting-started',
  },
  day_14: {
    subject: 'Last check-in — anything we can help with?',
    headline: "We'll stop emailing after this",
    body:
      "This is the last email we'll send in this series. If Clipflow isn't for you right now, that's fine — no hard feelings. If you'd like a short walkthrough or want to tell us what didn't work, reply to this email and we'll make it right. Your workspace and any data you've imported stay exactly where you left them.",
    cta: 'Tell us what went wrong',
    ctaHref: 'mailto:support@clipflow.to?subject=Clipflow%20feedback',
  },
}

export function reengagementKindFor(stage: Stage): string {
  return `reengagement_${stage}`
}

export async function sendReengagementEmail(params: {
  toEmail: string
  userName: string
  stage: Stage
}): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    log.warn('email: RESEND_API_KEY not set, skipping reengagement email', {
      stage: params.stage,
    })
    return
  }

  const copy = COPY[params.stage]
  const firstName = params.userName.split(/[\s@]/)[0] ?? 'there'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0b;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr>
      <td style="background:#111114;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;">
        <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#fff;">${escapeHtml(copy.headline)}</p>
        <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);">
          Hey ${escapeHtml(firstName)},
        </p>

        <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.75);line-height:1.6;">
          ${escapeHtml(copy.body)}
        </p>

        <a href="${copy.ctaHref}"
          style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#c026d3);color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:999px;text-decoration:none;">
          ${escapeHtml(copy.cta)}
        </a>

        <p style="margin:32px 0 0;font-size:12px;color:rgba(255,255,255,0.3);">
          If you'd rather not receive these, reply with &quot;stop&quot; and we'll take you off the list.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `${copy.headline}

Hey ${firstName},

${copy.body}

${copy.cta}: ${copy.ctaHref}

If you'd rather not receive these, reply with "stop" and we'll take you off the list.`

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: params.toEmail,
      subject: copy.subject,
      html,
      text,
    })
  } catch (err) {
    log.error('email: failed to send reengagement email', err, {
      toEmail: params.toEmail,
      stage: params.stage,
    })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
