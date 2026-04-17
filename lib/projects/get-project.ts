import { createClient } from '@/lib/supabase/server'
import type { ContentKind, ContentStatus } from '@/lib/supabase/types'
import { log } from '@/lib/log'

export interface ProjectDetail {
  id: string
  workspace_id: string
  name: string
  description: string | null
  created_at: string
}

export interface ProjectContentItem {
  id: string
  kind: ContentKind
  status: ContentStatus
  title: string | null
  created_at: string
}

export async function getProject(
  projectId: string,
  workspaceId: string,
): Promise<ProjectDetail | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, workspace_id, name, description, created_at')
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (error || !data) return null
  return data as ProjectDetail
}

export async function getProjectContentItems(
  projectId: string,
  workspaceId: string,
): Promise<ProjectContentItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('id, kind, status, title, created_at')
    .eq('project_id', projectId)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    log.error('getProjectContentItems failed', error)
    return []
  }
  return (data ?? []) as ProjectContentItem[]
}
