import 'server-only'

/**
 * Sends a message to Discord via Webhook.
 */
export async function sendDiscordMessage(params: {
  webhookUrl: string
  content: string
  embeds?: Array<{ title?: string; description?: string; color?: number; url?: string }>
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const body: Record<string, unknown> = { content: params.content }
    if (params.embeds) body.embeds = params.embeds

    const res = await fetch(params.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { ok: false, error: `Discord error ${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Discord notification failed' }
  }
}

/** Builds a rich Discord embed for output generation events */
export function buildOutputDiscordEmbed(params: {
  contentTitle: string
  platformCount: number
  workspaceUrl: string
}): Array<{ title: string; description: string; color: number; url: string }> {
  return [
    {
      title: '🎬 Outputs Ready — Clipflow',
      description: `**${params.contentTitle}**\n${params.platformCount} platform drafts generated and ready for review.`,
      color: 0x7c3aed, // violet
      url: params.workspaceUrl,
    },
  ]
}
