'use server'

import { revalidatePath } from 'next/cache'

import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto/encryption'
import { verifyXCredentials, type XCredentials } from '@/lib/publish/x-publish'

export type ConnectXState =
  | { ok?: undefined }
  | { ok: true; handle: string }
  | { ok: false; error: string }

/**
 * Verify the 4 X API credentials against /users/me, then (if valid)
 * AES-GCM encrypt them and store inside
 * workspaces.branding.channels.x.credentials. No DB migration needed.
 */
export async function connectXAction(
  _prev: ConnectXState,
  formData: FormData,
): Promise<ConnectXState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const workspaceId = String(formData.get('workspace_id') ?? '')
  if (!workspaceId) return { ok: false, error: 'Missing workspace.' }

  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only owners or editors can manage channels.' }
  }

  const creds: XCredentials = {
    consumerKey: String(formData.get('consumer_key') ?? '').trim(),
    consumerSecret: String(formData.get('consumer_secret') ?? '').trim(),
    accessToken: String(formData.get('access_token') ?? '').trim(),
    accessTokenSecret: String(formData.get('access_token_secret') ?? '').trim(),
  }

  for (const [field, value] of Object.entries(creds)) {
    if (!value || value.length < 8) {
      return {
        ok: false,
        error: `Missing or too short: ${field}. Re-copy from your X Developer Portal.`,
      }
    }
  }

  // Probe first — fail fast on bad creds so we never persist something
  // that can't post.
  const verify = await verifyXCredentials(creds)
  if (!verify.ok) {
    return {
      ok: false,
      error: `X rejected those keys: ${verify.error}. Double-check all 4 values have no trailing spaces.`,
    }
  }

  const encrypted = encrypt(JSON.stringify(creds))

  const supabase = createClient()
  const { data: ws } = await supabase
    .from('workspaces')
    .select('branding')
    .eq('id', workspaceId)
    .single()
  const branding = (ws?.branding ?? {}) as Record<string, unknown>
  const channels = (branding.channels ?? {}) as Record<string, unknown>

  channels.x = {
    type: 'byo-keys',
    credentials: encrypted,
    handle: verify.handle,
    connected_at: new Date().toISOString(),
    connected_by: user.id,
  }

  await supabase
    .from('workspaces')
    .update({
      branding: JSON.parse(JSON.stringify({ ...branding, channels })),
    })
    .eq('id', workspaceId)

  revalidatePath('/settings/channels')
  return { ok: true, handle: verify.handle }
}

export async function disconnectXAction(formData: FormData): Promise<void> {
  const workspaceId = String(formData.get('workspace_id') ?? '')
  if (!workspaceId) return
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return
  if (check.role !== 'owner' && check.role !== 'editor') return

  const supabase = createClient()
  const { data: ws } = await supabase
    .from('workspaces')
    .select('branding')
    .eq('id', workspaceId)
    .single()
  const branding = (ws?.branding ?? {}) as Record<string, unknown>
  const channels = { ...((branding.channels ?? {}) as Record<string, unknown>) }
  delete channels.x

  await supabase
    .from('workspaces')
    .update({
      branding: JSON.parse(JSON.stringify({ ...branding, channels })),
    })
    .eq('id', workspaceId)

  revalidatePath('/settings/channels')
}
