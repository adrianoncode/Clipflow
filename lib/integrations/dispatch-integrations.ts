import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackMessage } from '@/lib/integrations/slack'
import { sendDiscordMessage } from '@/lib/integrations/discord'
import { publishToWordPress } from '@/lib/integrations/wordpress'
import { publishToMedium } from '@/lib/integrations/medium'
import { publishToBeehiiv } from '@/lib/integrations/beehiiv'
import { createAirtableRecord } from '@/lib/integrations/airtable'
import { dispatchComposioActions } from '@/lib/integrations/composio-actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IntegrationEvent =
  | 'output.approved'
  | 'output.exported'
  | 'post.published'

interface DispatchPayload {
  /** Human-readable title (content title or output title) */
  title: string
  /** HTML or markdown body — used for CMS publishing */
  body?: string
  /** Deep link back into the Clipflow workspace */
  workspaceUrl?: string
  /** Platform the output targets (tiktok, linkedin, etc.) */
  platform?: string
  /** Any extra metadata to pass to Airtable */
  extra?: Record<string, unknown>
}

interface IntegrationConfig {
  connected_at?: string
  connected_by?: string
  // Slack / Discord
  webhook_url?: string
  // WordPress
  site_url?: string
  username?: string
  app_password?: string
  // Medium
  integration_token?: string
  // Beehiiv
  api_key?: string
  publication_id?: string
  // Airtable
  base_id?: string
  table_name?: string
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget integration dispatcher.
 * Reads workspace branding.integrations JSONB, then fans out to every
 * connected integration that cares about `event`.
 *
 * Errors are caught per-integration so one failure never blocks the others.
 * Call without `await` — the caller should not wait on integration results.
 */
export function dispatchIntegrations(
  workspaceId: string,
  event: IntegrationEvent,
  payload: DispatchPayload,
): void {
  // Intentionally not awaited — fire-and-forget
  _dispatch(workspaceId, event, payload).catch(() => {
    // integrations are non-critical
  })
}

async function _dispatch(
  workspaceId: string,
  event: IntegrationEvent,
  payload: DispatchPayload,
): Promise<void> {
  const supabase = createAdminClient()

  const { data: ws } = await supabase
    .from('workspaces')
    .select('branding')
    .eq('id', workspaceId)
    .single()

  if (!ws?.branding) return

  const branding = ws.branding as Record<string, unknown>
  const integrations = branding.integrations as Record<string, IntegrationConfig> | undefined
  if (!integrations || Object.keys(integrations).length === 0) return

  const message = buildMessage(event, payload)
  const tasks: Array<Promise<unknown>> = []

  // ── Slack ────────────────────────────────────────────────────────────────
  const slack = integrations.slack
  if (slack?.webhook_url) {
    tasks.push(
      sendSlackMessage({
        webhookUrl: slack.webhook_url,
        text: message,
      }).catch(() => {}),
    )
  }

  // ── Discord ──────────────────────────────────────────────────────────────
  const discord = integrations.discord
  if (discord?.webhook_url) {
    tasks.push(
      sendDiscordMessage({
        webhookUrl: discord.webhook_url,
        content: message,
        embeds: [
          {
            title: `Clipflow — ${eventLabel(event)}`,
            description: message,
            color: 0x7c3aed,
            url: payload.workspaceUrl ?? '',
          },
        ],
      }).catch(() => {}),
    )
  }

  // ── WordPress (only on output.exported) ──────────────────────────────────
  const wordpress = integrations.wordpress
  if (wordpress?.site_url && wordpress.username && wordpress.app_password && event === 'output.exported' && payload.body) {
    tasks.push(
      publishToWordPress({
        siteUrl: wordpress.site_url,
        username: wordpress.username,
        applicationPassword: wordpress.app_password,
        title: payload.title,
        content: payload.body,
        status: 'draft',
      }).catch(() => {}),
    )
  }

  // ── Medium (only on output.exported) ─────────────────────────────────────
  const medium = integrations.medium
  if (medium?.integration_token && event === 'output.exported' && payload.body) {
    tasks.push(
      publishToMedium({
        integrationToken: medium.integration_token,
        title: payload.title,
        content: payload.body,
        contentFormat: 'html',
        publishStatus: 'draft',
      }).catch(() => {}),
    )
  }

  // ── Beehiiv (only on output.exported) ────────────────────────────────────
  const beehiiv = integrations.beehiiv
  if (beehiiv?.api_key && beehiiv.publication_id && event === 'output.exported' && payload.body) {
    tasks.push(
      publishToBeehiiv({
        apiKey: beehiiv.api_key,
        publicationId: beehiiv.publication_id,
        title: payload.title,
        content: payload.body,
        status: 'draft',
      }).catch(() => {}),
    )
  }

  // ── Airtable (all events) ────────────────────────────────────────────────
  const airtable = integrations.airtable
  if (airtable?.api_key && airtable.base_id && airtable.table_name) {
    tasks.push(
      createAirtableRecord({
        apiKey: airtable.api_key,
        baseId: airtable.base_id,
        tableName: airtable.table_name,
        fields: {
          Title: payload.title,
          Event: event,
          Platform: payload.platform ?? '',
          Date: new Date().toISOString(),
          URL: payload.workspaceUrl ?? '',
          ...payload.extra,
        },
      }).catch(() => {}),
    )
  }

  // ── Composio OAuth integrations (Notion, Sheets, Airtable, LinkedIn) ──
  tasks.push(
    dispatchComposioActions(workspaceId, event, payload).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[dispatch:composio]', err instanceof Error ? err.message : 'failed')
    }),
  )

  await Promise.allSettled(tasks)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function eventLabel(event: IntegrationEvent): string {
  switch (event) {
    case 'output.approved':
      return 'Output Approved'
    case 'output.exported':
      return 'Output Exported'
    case 'post.published':
      return 'Post Published'
  }
}

function buildMessage(event: IntegrationEvent, payload: DispatchPayload): string {
  const title = payload.title || 'Untitled'
  switch (event) {
    case 'output.approved':
      return `✅ Output approved: "${title}"${payload.platform ? ` (${payload.platform})` : ''}`
    case 'output.exported':
      return `📤 Output exported: "${title}"${payload.platform ? ` (${payload.platform})` : ''}`
    case 'post.published':
      return `🚀 Post published: "${title}"${payload.platform ? ` on ${payload.platform}` : ''}`
  }
}
