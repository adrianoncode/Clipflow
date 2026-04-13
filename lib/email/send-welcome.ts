import 'server-only'

import { getResendClient, getFromAddress } from '@/lib/email/client'

/**
 * Sends a welcome email after a new user completes onboarding.
 */
export async function sendWelcomeEmail(params: {
  toEmail: string
  userName: string
}): Promise<void> {
  const resend = getResendClient()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, skipping welcome email')
    return
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0b;margin:0;padding:32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr>
      <td style="background:#111114;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;">
        <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#fff;">Welcome to Clipflow</p>
        <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.5);">
          Hey ${escapeHtml(params.userName)}, you're in! Here's how to get the most out of Clipflow.
        </p>

        <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#a78bfa;">Quick Start Guide</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;font-size:13px;color:rgba(255,255,255,0.6);">
                <strong style="color:#fff;">1.</strong> Add your AI key (OpenAI, Anthropic, or Google) in Settings → AI Keys
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:rgba(255,255,255,0.6);">
                <strong style="color:#fff;">2.</strong> Paste a YouTube link or upload a video
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:rgba(255,255,255,0.6);">
                <strong style="color:#fff;">3.</strong> Click "Generate" → get TikTok, Reels, Shorts & LinkedIn drafts in 30 seconds
              </td>
            </tr>
          </table>
        </div>

        <p style="font-size:13px;color:rgba(255,255,255,0.4);margin:0 0 24px;">
          Clipflow uses your own AI key — you pay your provider at cost. Zero markup, ever.
        </p>

        <a href="https://clipflow.to/dashboard"
          style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#c026d3);color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:999px;text-decoration:none;">
          Go to Dashboard →
        </a>

        <p style="margin:32px 0 0;font-size:12px;color:rgba(255,255,255,0.25);">
          Sent by Clipflow · <a href="https://clipflow.to" style="color:rgba(255,255,255,0.25);">clipflow.to</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `Welcome to Clipflow, ${params.userName}!

Quick Start:
1. Add your AI key in Settings → AI Keys
2. Paste a YouTube link or upload a video
3. Click "Generate" → 4 platform drafts in 30 seconds

Go to dashboard: https://clipflow.to/dashboard`

  try {
    await resend.emails.send({
      from: getFromAddress(),
      to: params.toEmail,
      subject: `Welcome to Clipflow, ${params.userName}!`,
      html,
      text,
    })
  } catch (err) {
    console.error('[email] Failed to send welcome email:', err)
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
