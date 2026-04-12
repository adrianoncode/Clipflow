import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'

export interface ProjectRow {
  id: string
  workspace_id: string
  name: string
  description: string | null
  created_at: string
  content_count: number
}

/**
 * Lists all projects in a workspace with a content item count.
 */
export const getProjects = cache(
  async (workspaceId: string): Promise<ProjectRow[]> => {
    const supabase = await createClient()

    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, workspace_id, name, description, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getProjects]', error.message)
      return []
    }

    if (!projects || projects.length === 0) return []

    // Count content items per project in one query.
    const projectIds = projects.map((p) => p.id)
    const { data: counts } = await supabase
      .from('content_items')
      .select('project_id')
      .in('project_id', projectIds)

    const countMap = new Map<string, number>()
    for (const row of counts ?? []) {
      if (!row.project_id) continue
      countMap.set(row.project_id, (countMap.get(row.project_id) ?? 0) + 1)
    }

    return projects.map((p) => ({
      ...p,
      content_count: countMap.get(p.id) ?? 0,
    }))
  },
)
