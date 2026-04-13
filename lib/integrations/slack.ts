import 'server-only'

/**
 * Sends a message to Slack via Incoming Webhook.
 * User provides their Slack webhook URL in settings.
 */
export async function sendSlackMessage(params: {
  webhookUrl: string
  text: string
  blocks?: Array<Record<string, unknown>>
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const body: Record<string, unknown> = { text: params.text }
    if (params.blocks) body.blocks = params.blocks

    const res = await fetch(params.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { ok: false, error: `Slack error ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Slack notification failed' }
  }
}

/** Builds a rich Slack message for output generation events */
export function buildOutputSlackBlocks(params: {
  contentTitle: string
  platformCount: number
  workspaceUrl: string
}): Array<Record<string, unknown>> {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🎬 Clipflow — Outputs Ready*\n\n*${params.contentTitle}*\n${params.platformCount} platform drafts generated and ready for review.`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View Outputs' },
          url: params.workspaceUrl,
          style: 'primary',
        },
      ],
    },
  ]
}
