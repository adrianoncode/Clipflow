import 'server-only'
import { getResendClient, getFromAddress } from '@/lib/email/client'

interface ReviewNotificationParams {
  /** Workspace owner's email */
  toEmail: string
  /** Name/email of the reviewer who left the comment */
  reviewerName: string
  reviewerEmail?: string | null
  /** The comment body */
  commentBody: string
  /** The content item title */
  contentTitle: string
  /** The platform this comment is about (or null for general) */
  platform: string | null
  /** Link back to the outputs page */
  outputsUrl: string
}

export async function sendReviewNotification(
  params: ReviewNotificationParams,
): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    // No API key configured — skip silently in dev
    console.warn('[email] RESEND_API_KEY not set, skipping review notification email')
    return
  }

  const platformLabel = params.platform
    ? ` on the ${formatPlatform(params.platform)} output`
    : ''

  const subject = `New review comment on "${params.contentTitle}"`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
        <p style="margin:0 0 4px;font-size:18px;font-weight:600;color:#111827;">New review comment</p>
        <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">
          ${params.reviewerName}${params.reviewerEmail ? ` &lt;${params.reviewerEmail}&gt;` : ''} left a comment${platformLabel} on
          <strong>${params.contentTitle}</strong>.
        </p>

        <div style="background:#f3f4f6;border-radius:6px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;">${escapeHtml(params.commentBody)}</p>
        </div>

        <a
          href="${params.outputsUrl}"
          style="display:inline-block;background:#111827;color:#fff;font-size:14px;font-weight:500;padding:10px 20px;border-radius:6px;text-decoration:none;"
        >
          View outputs →
        </a>

        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
          Sent by Clipflow · You are receiving this because you own the workspace.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `New review comment on "${params.contentTitle}"\n\nFrom: ${params.reviewerName}${params.reviewerEmail ? ` <${params.reviewerEmail}>` : ''}${platformLabel ? `\nPlatform: ${formatPlatform(params.platform ?? '')}` : ''}\n\n${params.commentBody}\n\nView outputs: ${params.outputsUrl}`

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: params.toEmail,
    subject,
    html,
    text,
  })

  if (error) {
    console.error('[email] Failed to send review notification:', error)
  }
}

function formatPlatform(p: string): string {
  const labels: Record<string, string> = {
    tiktok: 'TikTok',
    instagram_reels: 'Instagram Reels',
    youtube_shorts: 'YouTube Shorts',
    linkedin: 'LinkedIn',
  }
  return labels[p] ?? p
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
