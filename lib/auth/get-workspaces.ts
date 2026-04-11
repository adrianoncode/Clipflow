import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import type { WorkspaceRole, WorkspaceType } from '@/lib/supabase/types'

export interface WorkspaceSummary {
  id: string
  name: string
  slug: string
  type: WorkspaceType
  role: WorkspaceRole
}

interface WorkspaceMemberJoinRow {
  role: WorkspaceRole
  workspace: {
    id: string
    name: string
    slug: string
    type: WorkspaceType
  } | null
}

/**
 * Returns every workspace the current user is a member of, plus their role
 * in each. RLS guarantees we only see our own rows.
 */
export const getWorkspaces = cache(async (): Promise<WorkspaceSummary[]> => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('workspace_members')
    .select('role, workspace:workspaces(id, name, slug, type)')
    .returns<WorkspaceMemberJoinRow[]>()

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[getWorkspaces]', error.message)
    return []
  }

  const rows: WorkspaceMemberJoinRow[] = data ?? []
  const result: WorkspaceSummary[] = []
  for (const row of rows) {
    if (!row.workspace) continue
    result.push({
      id: row.workspace.id,
      name: row.workspace.name,
      slug: row.workspace.slug,
      type: row.workspace.type,
      role: row.role,
    })
  }
  return result
})
