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

export type PipelineState = 'draft' | 'review' | 'approved' | 'exported'

export interface WorkspaceStats {
  totalContent: number
  totalOutputs: number
  starredOutputs: number
  approvedOutputs: number
  recentContent: RecentContentItem[]
  outputsByPlatform: Record<OutputPlatform, number>
  contentThisMonth: number
  outputsThisMonth: number
  contentLastMonth: number
  outputsLastMonth: number
  pipelineByState: Record<PipelineState, number>
}

export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
  const supabase = await createClient()

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    contentResult,
    outputResult,
    starredResult,
    approvedResult,
    recentResult,
    platformResult,
    contentThisMonthResult,
    outputsThisMonthResult,
    contentLastMonthResult,
    outputsLastMonthResult,
    allStatesResult,
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

    // 8 most recent content items
    supabase
      .from('content_items')
      .select('id, title, status, kind, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(8),

    // Outputs grouped by platform (fetch all, group in JS)
    supabase
      .from('outputs')
      .select('platform')
      .eq('workspace_id', workspaceId),

    // Content items this month
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', startOfThisMonth),

    // Outputs this month
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', startOfThisMonth),

    // Content items last month
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', startOfLastMonth)
      .lt('created_at', endOfLastMonth),

    // Outputs last month
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', startOfLastMonth)
      .lt('created_at', endOfLastMonth),

    // All output_states for pipeline grouping
    supabase
      .from('output_states')
      .select('output_id, state, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
  ])

  // Platform breakdown
  const platformCounts: Record<string, number> = {}
  for (const row of platformResult.data ?? []) {
    platformCounts[row.platform] = (platformCounts[row.platform] ?? 0) + 1
  }

  // Pipeline by state: take the latest state per output_id
  const latestStateByOutput = new Map<string, string>()
  for (const row of allStatesResult.data ?? []) {
    if (!latestStateByOutput.has(row.output_id)) {
      latestStateByOutput.set(row.output_id, row.state)
    }
  }

  const pipelineByState: Record<PipelineState, number> = {
    draft: 0,
    review: 0,
    approved: 0,
    exported: 0,
  }
  for (const state of latestStateByOutput.values()) {
    if (state === 'draft' || state === 'review' || state === 'approved' || state === 'exported') {
      pipelineByState[state as PipelineState]++
    }
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
    contentThisMonth: contentThisMonthResult.count ?? 0,
    outputsThisMonth: outputsThisMonthResult.count ?? 0,
    contentLastMonth: contentLastMonthResult.count ?? 0,
    outputsLastMonth: outputsLastMonthResult.count ?? 0,
    pipelineByState,
  }
}
