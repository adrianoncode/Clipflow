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
    .select('id, workspace_id, role, is_accepted, expires_at, invited_by, email')
    .eq('token', token)
    .maybeSingle()

  if (!invite) return { ok: false, error: 'Invite not found or already used.' }
  if (invite.is_accepted) return { ok: false, error: 'This invite has already been accepted.' }
  if (new Date(invite.expires_at) < new Date()) {
    return { ok: false, error: 'This invite has expired.' }
  }

  // If the invite was emailed to a specific address, the redeemer MUST
  // be that user. Without this, anyone who obtains the link (forwarded
  // email, leaked Slack message, exposed in server logs) can join the
  // workspace under whatever role the invite was created for. Compare
  // case-insensitively because email casing isn't significant.
  if (invite.email) {
    const normalizedInvitee = invite.email.trim().toLowerCase()
    const normalizedUser = (user.email ?? '').trim().toLowerCase()
    if (!normalizedUser || normalizedUser !== normalizedInvitee) {
      return {
        ok: false,
        error:
          'This invite was sent to a different email address. Sign in with the invited account to accept it.',
      }
    }
  }

  // Re-validate the inviter's authority at acceptance time. A pending
  // owner-invite created when the inviter was an owner would otherwise
  // mint a new owner even after the inviter was demoted/removed —
  // privilege escalation via stale invite.
  //
  // Rule: the inviter must still be a member of the workspace, and
  // must hold a role >= the role they're handing out. A demoted-to-
  // viewer cannot promote anyone; an editor cannot mint owners.
  if (invite.role === 'owner') {
    // Owner invites require the inviter to STILL be an owner. We never
    // let a non-owner mint an owner, no matter what the invite says.
    const { data: inviterRow } = await admin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', invite.invited_by)
      .maybeSingle()
    if (inviterRow?.role !== 'owner') {
      return {
        ok: false,
        error:
          'This invite is no longer valid — the person who sent it is no longer authorized to add owners.',
      }
    }
  } else {
    // Non-owner invites require the inviter to still hold owner OR
    // editor (whichever is needed to create that role today).
    const { data: inviterRow } = await admin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', invite.invited_by)
      .maybeSingle()
    if (!inviterRow || !['owner', 'editor'].includes(inviterRow.role)) {
      return {
        ok: false,
        error:
          'This invite is no longer valid — the person who sent it is no longer authorized.',
      }
    }
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
