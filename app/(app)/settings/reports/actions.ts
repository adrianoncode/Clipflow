'use server'

import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/get-user'
import { getReportData } from '@/lib/reports/get-report-data'
import { getResendClient, getFromAddress } from '@/lib/email/client'

export type SendReportEmailState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function sendReportEmailAction(
  _prev: SendReportEmailState,
  formData: FormData,
): Promise<SendReportEmailState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const period = (formData.get('period')?.toString() ?? 'week') as 'week' | 'month'
  const userEmail = formData.get('user_email')?.toString() ?? ''

  if (!workspaceId) return { ok: false, error: 'Missing workspace.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const resend = getResendClient()
  if (!resend) return { ok: false, error: 'Email not configured' }

  const report = await getReportData(workspaceId, period)
  const toEmail = userEmail || user.email || ''
  if (!toEmail) return { ok: false, error: 'No email address found.' }

  const platformRows = Object.entries(report.platformBreakdown)
    .map(([platform, count]) => `<tr><td style="padding:4px 8px;">${platform}</td><td style="padding:4px 8px;text-align:right;">${count}</td></tr>`)
    .join('')

  const topContentRows = report.topContent
    .map(
      (item) =>
        `<tr><td style="padding:4px 8px;">${item.title ?? '(untitled)'}</td><td style="padding:4px 8px;text-align:right;">${item.outputs}</td></tr>`,
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Clipflow Report</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
  <h1 style="font-size:22px;margin-bottom:4px;">Clipflow Activity Report</h1>
  <p style="color:#666;margin-top:0;">${report.period.label}</p>

  <table style="width:100%;border-collapse:collapse;margin:24px 0;">
    <tr>
      <td style="padding:12px;background:#f5f5f5;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:700;">${report.contentCreated}</div>
        <div style="font-size:12px;color:#666;">Content Created</div>
      </td>
      <td style="width:12px;"></td>
      <td style="padding:12px;background:#f5f5f5;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:700;">${report.outputsGenerated}</div>
        <div style="font-size:12px;color:#666;">Outputs Generated</div>
      </td>
      <td style="width:12px;"></td>
      <td style="padding:12px;background:#f5f5f5;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:700;">${report.outputsApproved}</div>
        <div style="font-size:12px;color:#666;">Approved</div>
      </td>
      <td style="width:12px;"></td>
      <td style="padding:12px;background:#f5f5f5;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:700;">${report.starredOutputs}</div>
        <div style="font-size:12px;color:#666;">Starred</div>
      </td>
    </tr>
  </table>

  ${
    platformRows
      ? `
  <h2 style="font-size:16px;">Platform Breakdown</h2>
  <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
    <thead><tr style="background:#f9f9f9;">
      <th style="padding:4px 8px;text-align:left;">Platform</th>
      <th style="padding:4px 8px;text-align:right;">Outputs</th>
    </tr></thead>
    <tbody>${platformRows}</tbody>
  </table>`
      : ''
  }

  ${
    topContentRows
      ? `
  <h2 style="font-size:16px;margin-top:24px;">Top Content</h2>
  <table style="width:100%;border-collapse:collapse;border:1px solid #eee;">
    <thead><tr style="background:#f9f9f9;">
      <th style="padding:4px 8px;text-align:left;">Content</th>
      <th style="padding:4px 8px;text-align:right;">Outputs</th>
    </tr></thead>
    <tbody>${topContentRows}</tbody>
  </table>`
      : ''
  }

  <p style="margin-top:32px;font-size:12px;color:#999;">
    Sent by Clipflow · <a href="https://clipflow.app/settings/reports" style="color:#999;">Manage reports</a>
  </p>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: toEmail,
    subject: `Clipflow Report — ${report.period.label}`,
    html,
  })

  if (error) return { ok: false, error: (error as { message?: string }).message ?? 'Failed to send email.' }
  return { ok: true }
}
