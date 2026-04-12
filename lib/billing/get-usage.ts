import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface WorkspaceUsage {
  contentItemsThisMonth: number
  outputsThisMonth: number
}

/**
 * Returns current-month usage counts for a workspace.
 * Uses calendar-month boundaries (UTC).
 */
export async function getWorkspaceUsage(workspaceId: string): Promise<WorkspaceUsage> {
  const supabase = createClient()

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  const [contentResult, outputResult] = await Promise.all([
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', monthStart),
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', monthStart),
  ])

  return {
    contentItemsThisMonth: contentResult.count ?? 0,
    outputsThisMonth: outputResult.count ?? 0,
  }
}
