import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface ClientWorkspaceSummary {
  id: string
  name: string
  created_at: string
  memberCount: number
  contentCount: number
  outputCount: number
  approvedCount: number
}

interface WorkspaceRow {
  id: string
  name: string
  type: string
  created_at: string
}

interface MembershipRow {
  workspace_id: string
  workspaces: WorkspaceRow | null
}

interface WorkspaceIdRow {
  workspace_id: string
}

export async function getClientWorkspaces(userId: string): Promise<ClientWorkspaceSummary[]> {
  const supabase = createClient()

  // Get all workspaces where user is owner and type is 'client'
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(id, name, type, created_at)')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .returns<MembershipRow[]>()

  const clientWorkspaces = (memberships ?? [])
    .filter((m) => m.workspaces?.type === 'client')
    .map((m) => m.workspaces)
    .filter((w): w is WorkspaceRow => w !== null)

  if (!clientWorkspaces.length) return []

  const workspaceIds = clientWorkspaces.map((w) => w.id)

  const [memberCounts, contentCounts, outputCounts, approvedCounts] = await Promise.all([
    supabase
      .from('workspace_members')
      .select('workspace_id')
      .in('workspace_id', workspaceIds)
      .returns<WorkspaceIdRow[]>(),
    supabase
      .from('content_items')
      .select('workspace_id')
      .in('workspace_id', workspaceIds)
      .returns<WorkspaceIdRow[]>(),
    supabase
      .from('outputs')
      .select('workspace_id')
      .in('workspace_id', workspaceIds)
      .returns<WorkspaceIdRow[]>(),
    supabase
      .from('output_states')
      .select('workspace_id')
      .in('workspace_id', workspaceIds)
      .eq('state', 'approved')
      .returns<WorkspaceIdRow[]>(),
  ])

  const countByWorkspace = (rows: WorkspaceIdRow[]) => {
    const map: Record<string, number> = {}
    for (const r of rows) map[r.workspace_id] = (map[r.workspace_id] ?? 0) + 1
    return map
  }

  const members = countByWorkspace(memberCounts.data ?? [])
  const content = countByWorkspace(contentCounts.data ?? [])
  const outputs = countByWorkspace(outputCounts.data ?? [])
  const approved = countByWorkspace(approvedCounts.data ?? [])

  return clientWorkspaces.map((w) => ({
    id: w.id,
    name: w.name,
    created_at: w.created_at,
    memberCount: members[w.id] ?? 0,
    contentCount: content[w.id] ?? 0,
    outputCount: outputs[w.id] ?? 0,
    approvedCount: approved[w.id] ?? 0,
  }))
}
