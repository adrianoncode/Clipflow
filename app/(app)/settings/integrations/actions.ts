'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

export type ConnectState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

/**
 * Saves integration credentials to workspace branding JSONB.
 * Stored under branding.integrations[integrationId] = { ...config }
 */
export async function saveIntegrationAction(
  _prev: ConnectState,
  formData: FormData,
): Promise<ConnectState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const integrationId = formData.get('integration_id')?.toString() ?? ''

  if (!workspaceId || !integrationId) {
    return {
      ok: false,
      error: 'Missing workspace or integration id. Refresh the page and try again.',
    }
  }

  // Collect all config fields (any field starting with "config_")
  const config: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('config_') && typeof value === 'string' && value.trim()) {
      config[key.replace('config_', '')] = value.trim()
    }
  }

  if (Object.keys(config).length === 0) {
    return { ok: false, error: 'Please fill in all the fields above, then try again.' }
  }

  const supabase = createClient()

  // Read existing branding
  const { data: ws } = await supabase
    .from('workspaces')
    .select('branding')
    .eq('id', workspaceId)
    .single()

  const branding = (ws?.branding ?? {}) as Record<string, unknown>
  const integrations = (branding.integrations ?? {}) as Record<string, unknown>

  integrations[integrationId] = {
    ...config,
    connected_at: new Date().toISOString(),
    connected_by: user.id,
  }

  const { error } = await supabase
    .from('workspaces')
    .update({
      branding: JSON.parse(JSON.stringify({ ...branding, integrations })),
    })
    .eq('id', workspaceId)

  if (error) {
    log.error('saveIntegrationAction failed', error, { workspaceId, integrationId })
    return {
      ok: false,
      error: `Could not save the integration: ${error.message}. Try again.`,
    }
  }

  revalidatePath('/settings/integrations')
  return { ok: true }
}

/**
 * Sends a test message to a webhook integration (Slack / Discord).
 */
export async function testWebhookAction(
  _prev: ConnectState,
  formData: FormData,
): Promise<ConnectState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const integrationId = formData.get('integration_id')?.toString() ?? ''

  if (!workspaceId || !integrationId) {
    return { ok: false, error: 'Missing workspace or integration id.' }
  }

  const supabase = createClient()
  const { data: ws } = await supabase
    .from('workspaces')
    .select('branding')
    .eq('id', workspaceId)
    .single()

  const branding = (ws?.branding ?? {}) as Record<string, unknown>
  const integrations = (branding.integrations ?? {}) as Record<string, Record<string, string>>
  const config = integrations?.[integrationId]
  const webhookUrl = config?.webhook_url

  if (!webhookUrl) return { ok: false, error: 'No webhook URL found. Please connect first.' }

  try {
    const testMessage = '✅ Clipflow test — your integration is working!'

    if (integrationId === 'slack') {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testMessage }),
      })
      if (!res.ok) return { ok: false, error: 'Slack rejected the message. Check your notification link.' }
    } else if (integrationId === 'discord') {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: testMessage,
          embeds: [{
            title: 'Clipflow — Test',
            description: testMessage,
            color: 0x7c3aed,
          }],
        }),
      })
      if (!res.ok) return { ok: false, error: 'Discord rejected the message. Check your notification link.' }
    }

    return { ok: true }
  } catch (err) {
    log.error('testWebhookAction fetch failed', err, { workspaceId, integrationId })
    const detail = err instanceof Error ? err.message : 'Network error'
    return {
      ok: false,
      error: `Could not reach the webhook: ${detail}. Check the URL and try again.`,
    }
  }
}

/**
 * Disconnects an integration by removing its config.
 */
export async function disconnectIntegrationAction(
  _prev: ConnectState,
  formData: FormData,
): Promise<ConnectState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const integrationId = formData.get('integration_id')?.toString() ?? ''

  if (!workspaceId || !integrationId) return { ok: false, error: 'Missing data.' }

  const supabase = createClient()

  const { data: ws } = await supabase
    .from('workspaces')
    .select('branding')
    .eq('id', workspaceId)
    .single()

  const branding = (ws?.branding ?? {}) as Record<string, unknown>
  const integrations = (branding.integrations ?? {}) as Record<string, unknown>

  delete integrations[integrationId]

  await supabase
    .from('workspaces')
    .update({
      branding: JSON.parse(JSON.stringify({ ...branding, integrations })),
    })
    .eq('id', workspaceId)

  revalidatePath('/settings/integrations')
  return { ok: true }
}
