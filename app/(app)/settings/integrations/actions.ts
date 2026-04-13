'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

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

  if (!workspaceId || !integrationId) return { ok: false, error: 'Missing data.' }

  // Collect all config fields (any field starting with "config_")
  const config: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('config_') && typeof value === 'string' && value.trim()) {
      config[key.replace('config_', '')] = value.trim()
    }
  }

  if (Object.keys(config).length === 0) {
    return { ok: false, error: 'Please fill in the required fields.' }
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

  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings/integrations')
  return { ok: true }
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
