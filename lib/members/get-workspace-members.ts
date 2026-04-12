import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { WorkspaceRole } from '@/lib/supabase/types'

export interface WorkspaceMember {
  user_id: string
  role: WorkspaceRole
  email: string | null
  full_name: string | null
  created_at: string
}

export interface WorkspaceInvite {
  id: string
  token: string
  email: string | null
  role: WorkspaceRole
  is_accepted: boolean
  expires_at: string
  created_at: string
}

/**
 * Returns all members of a workspace with profile info.
 * Uses admin client to join auth.users for email.
 */
export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const admin = createAdminClient()

  const { data: members } = await admin
    .from('workspace_members')
    .select('user_id, role, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (!members || members.length === 0) return []

  const userIds = members.map((m) => m.user_id)

  // Fetch profiles for name
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  // Fetch emails from auth.users via admin API
  const emailMap = new Map<string, string>()
  for (const userId of userIds) {
    const { data } = await admin.auth.admin.getUserById(userId)
    if (data.user?.email) emailMap.set(userId, data.user.email)
  }

  const profileMap = new Map<string, string | null>()
  for (const p of profiles ?? []) {
    profileMap.set(p.id, p.full_name)
  }

  return members.map((m) => ({
    user_id: m.user_id,
    role: m.role as WorkspaceRole,
    email: emailMap.get(m.user_id) ?? null,
    full_name: profileMap.get(m.user_id) ?? null,
    created_at: m.created_at,
  }))
}

/**
 * Returns all pending (not accepted) invites for a workspace.
 */
export async function getWorkspaceInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('workspace_invites')
    .select('id, token, email, role, is_accepted, expires_at, created_at')
    .eq('workspace_id', workspaceId)
    .eq('is_accepted', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return (data ?? []) as WorkspaceInvite[]
}
