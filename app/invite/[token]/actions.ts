'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import type { WorkspaceRole } from '@/lib/supabase/types'

export type AcceptInviteState =
  | { ok?: undefined }
  | { ok: true; workspaceId: string }
  | { ok: false; error: string }

export async function acceptInviteAction(
  _prev: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const token = formData.get('token')?.toString() ?? ''
  if (!token) return { ok: false, error: 'Invalid invite token.' }

  const user = await getUser()
  if (!user) redirect(`/login?next=/invite/${token}`)

  const admin = createAdminClient()

  // Look up invite
  const { data: invite } = await admin
    .from('workspace_invites')
    .select('id, workspace_id, role, is_accepted, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!invite) return { ok: false, error: 'Invite not found or already used.' }
  if (invite.is_accepted) return { ok: false, error: 'This invite has already been accepted.' }
  if (new Date(invite.expires_at) < new Date()) {
    return { ok: false, error: 'This invite has expired.' }
  }

  // Check if already a member
  const { data: existing } = await admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', invite.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    // Add to workspace
    const { error: insertError } = await admin
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role as WorkspaceRole,
      })

    if (insertError) return { ok: false, error: insertError.message }
  }

  // Mark invite as accepted
  await admin
    .from('workspace_invites')
    .update({ is_accepted: true })
    .eq('id', invite.id)

  redirect(`/workspace/${invite.workspace_id}`)
}
