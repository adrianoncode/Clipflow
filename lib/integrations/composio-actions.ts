import 'server-only'

import { executeComposioAction, getComposioConnections } from '@/lib/integrations/composio'
import type { IntegrationEvent } from '@/lib/integrations/dispatch-integrations'

/**
 * Dispatch Composio-based actions for connected OAuth integrations.
 * Called from dispatch-integrations.ts alongside the webhook-based handlers.
 *
 * Each action is fire-and-forget with per-integration error isolation.
 */
export async function dispatchComposioActions(
  workspaceId: string,
  event: IntegrationEvent,
  payload: {
    title: string
    body?: string
    platform?: string
    workspaceUrl?: string
  },
): Promise<void> {
  // Check which Composio integrations are connected
  let connected: Set<string>
  try {
    connected = await getComposioConnections(workspaceId)
  } catch {
    return // Composio unavailable — skip silently
  }

  if (connected.size === 0) return

  const tasks: Array<Promise<unknown>> = []

  // ── Notion: Create a page in the connected workspace ──────────────
  if (connected.has('notion') && (event === 'output.approved' || event === 'output.exported')) {
    tasks.push(
      executeComposioAction(workspaceId, 'NOTION_CREATE_A_PAGE', {
        title: `[Clipflow] ${payload.title}`,
        content: buildNotionContent(event, payload),
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[composio:notion]', err instanceof Error ? err.message : 'failed')
      }),
    )
  }

  // ── Google Sheets: Append a row ───────────────────────────────────
  if (connected.has('google-sheets') && (event === 'output.approved' || event === 'output.exported')) {
    tasks.push(
      executeComposioAction(workspaceId, 'GOOGLESHEETS_BATCH_UPDATE', {
        values: [[
          new Date().toISOString(),
          payload.title,
          event === 'output.approved' ? 'Approved' : 'Exported',
          payload.platform ?? '',
          payload.workspaceUrl ?? '',
          (payload.body ?? '').slice(0, 500),
        ]],
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[composio:sheets]', err instanceof Error ? err.message : 'failed')
      }),
    )
  }

  // ── LinkedIn: Post when exported ──────────────────────────────────
  if (connected.has('linkedin') && event === 'output.exported' && payload.body) {
    tasks.push(
      executeComposioAction(workspaceId, 'LINKEDIN_CREATE_A_LINKED_IN_POST', {
        text: payload.body.slice(0, 3000),
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('[composio:linkedin]', err instanceof Error ? err.message : 'failed')
      }),
    )
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks)
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function eventLabel(event: IntegrationEvent): string {
  switch (event) {
    case 'output.approved': return 'Output Approved'
    case 'output.exported': return 'Output Exported'
    case 'post.published': return 'Post Published'
  }
}

function buildNotionContent(
  event: IntegrationEvent,
  payload: { title: string; body?: string; platform?: string; workspaceUrl?: string },
): string {
  const lines: string[] = [
    `**Status:** ${eventLabel(event)}`,
  ]
  if (payload.platform) lines.push(`**Platform:** ${payload.platform}`)
  if (payload.workspaceUrl) lines.push(`**Link:** ${payload.workspaceUrl}`)
  if (payload.body) {
    lines.push('', '---', '', payload.body.slice(0, 2000))
  }
  return lines.join('\n')
}
