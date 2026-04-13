'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
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

  // Use admin client so we can bypass RLS for the insert
  // (RLS requires is_workspace_member check which works for the current user)
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
