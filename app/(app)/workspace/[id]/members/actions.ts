'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess } from '@/lib/billing/plans'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendTeamInviteEmail } from '@/lib/email/send-team-invite'
import type { WorkspaceRole } from '@/lib/supabase/types'

// ── Create invite link ────────────────────────────────────────────────────────

const createInviteSchema = z.object({
  workspace_id: z.string().uuid(),
  email: z.string().email().optional().nullable(),
  role: z.enum(['editor', 'viewer', 'client']),
})

export type CreateInviteState =
  | { ok?: undefined }
  | { ok: true; token: string }
  | { ok: false; error: string }

export async function createInviteAction(
  _prev: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  const parsed = createInviteSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    email: formData.get('email') || null,
    role: formData.get('role') ?? 'editor',
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  // Membership + plan gate. Only Studio-plan workspaces can invite
  // team members — matches the sidebar `requires: 'teamSeats'` rule
  // and the /members page guard.
  const member = await requireWorkspaceMember(parsed.data.workspace_id)
  if (!member.ok) return { ok: false, error: member.message }
  const plan = await getWorkspacePlan(parsed.data.workspace_id)
  if (!checkPlanAccess(plan, 'teamSeats')) {
    return {
      ok: false,
      error: 'Team seats are on the Studio plan. Upgrade in Billing to invite teammates.',
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('workspace_invites')
    .insert({
      workspace_id: parsed.data.workspace_id,
      invited_by: user.id,
      email: parsed.data.email ?? null,
      role: parsed.data.role as WorkspaceRole,
    })
    .select('token')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create invite.' }

  // Fire-and-forget invite email when we have a target address.
  // Failures log but don't block — the owner can always copy the link
  // manually from the members panel if the email doesn't land.
  if (parsed.data.email) {
    void (async () => {
      try {
        const admin = createAdminClient()
        const [{ data: ws }, { data: profile }] = await Promise.all([
          admin.from('workspaces').select('name').eq('id', parsed.data.workspace_id).maybeSingle(),
          admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
        ])
        await sendTeamInviteEmail({
          toEmail: parsed.data.email!,
          workspaceName: ws?.name ?? 'a Clipflow workspace',
          inviterName: profile?.full_name ?? user.email ?? 'A teammate',
          role: parsed.data.role,
          token: data.token,
        })
      } catch {
        // logged inside sendTeamInviteEmail — don't fail the action
      }
    })()
  }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/members`)
  return { ok: true, token: data.token }
}

// ── Revoke invite ─────────────────────────────────────────────────────────────

export type RevokeInviteState = { ok?: undefined } | { ok: true } | { ok: false; error: string }

export async function revokeInviteAction(
  _prev: RevokeInviteState,
  formData: FormData,
): Promise<RevokeInviteState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const inviteId = formData.get('invite_id')?.toString() ?? ''
  if (!workspaceId || !inviteId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { error } = await supabase
    .from('workspace_invites')
    .delete()
    .eq('id', inviteId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/members`)
  return { ok: true }
}

// ── Update member role ────────────────────────────────────────────────────────

export type UpdateMemberRoleState = { ok?: undefined } | { ok: true } | { ok: false; error: string }

export async function updateMemberRoleAction(
  _prev: UpdateMemberRoleState,
  formData: FormData,
): Promise<UpdateMemberRoleState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const userId = formData.get('user_id')?.toString() ?? ''
  const role = formData.get('role')?.toString() ?? ''
  if (!workspaceId || !userId || !role) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  // Role changes are owner-only. Previously the action trusted the
  // workspace_members RLS "owner-only update" policy as the sole check;
  // an accidental policy relaxation would otherwise let any editor
  // silently promote themselves.
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner') {
    return { ok: false, error: 'Only workspace owners can change member roles.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('workspace_members')
    .update({ role: role as WorkspaceRole })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/members`)
  return { ok: true }
}

// ── Remove member ─────────────────────────────────────────────────────────────

export type RemoveMemberState = { ok?: undefined } | { ok: true } | { ok: false; error: string }

export async function removeMemberAction(
  _prev: RemoveMemberState,
  formData: FormData,
): Promise<RemoveMemberState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const userId = formData.get('user_id')?.toString() ?? ''
  if (!workspaceId || !userId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  // Same defense as updateMemberRoleAction — removals are owner-only.
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner') {
    return { ok: false, error: 'Only workspace owners can remove members.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/members`)
  return { ok: true }
}
