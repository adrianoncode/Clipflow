import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { ContentStatus, OutputPlatform } from '@/lib/supabase/types'

export interface RecentContentItem {
  id: string
  title: string | null
  status: ContentStatus
  kind: string
  created_at: string
}

export interface WorkspaceStats {
  totalContent: number
  totalOutputs: number
  starredOutputs: number
  approvedOutputs: number
  recentContent: RecentContentItem[]
  outputsByPlatform: Record<OutputPlatform, number>
}

export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
  const supabase = await createClient()

  const [
    contentResult,
    outputResult,
    starredResult,
    approvedResult,
    recentResult,
    platformResult,
  ] = await Promise.all([
    // Total content items
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),

    // Total outputs
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),

    // Starred outputs
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('is_starred', true),

    // Approved outputs (via output_states)
    supabase
      .from('output_states')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('state', 'approved'),

    // 5 most recent content items
    supabase
      .from('content_items')
      .select('id, title, status, kind, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5),

    // Outputs grouped by platform (fetch all, group in JS)
    supabase
      .from('outputs')
      .select('platform')
      .eq('workspace_id', workspaceId),
  ])

  const platformCounts: Record<string, number> = {}
  for (const row of platformResult.data ?? []) {
    platformCounts[row.platform] = (platformCounts[row.platform] ?? 0) + 1
  }

  return {
    totalContent: contentResult.count ?? 0,
    totalOutputs: outputResult.count ?? 0,
    starredOutputs: starredResult.count ?? 0,
    approvedOutputs: approvedResult.count ?? 0,
    recentContent: (recentResult.data ?? []) as RecentContentItem[],
    outputsByPlatform: {
      tiktok: platformCounts['tiktok'] ?? 0,
      instagram_reels: platformCounts['instagram_reels'] ?? 0,
      youtube_shorts: platformCounts['youtube_shorts'] ?? 0,
      linkedin: platformCounts['linkedin'] ?? 0,
    },
  }
}
