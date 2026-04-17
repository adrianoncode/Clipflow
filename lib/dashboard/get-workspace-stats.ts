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
  /** 7-day rolling buckets for sparklines. Index 0 = oldest day. */
  contentByDay: number[]
  outputsByDay: number[]
}

export async function getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
  const supabase = await createClient()

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // 7-day trailing window (midnight today minus 6 days) for sparklines.
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sparklineStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)
  const sparklineStartIso = sparklineStart.toISOString()

  const [
    contentResult,
    outputResult,
    starredResult,
    approvedResult,
    recentResult,
    // All outputs in one fetch — platform + current_state from the
    // denormalized column. Replaces 2 separate queries (platform grouping
    // + full output_states scan in JS).
    allOutputsResult,
    contentThisMonthResult,
    outputsThisMonthResult,
    contentLastMonthResult,
    outputsLastMonthResult,
    contentSparkResult,
    outputsSparkResult,
  ] = await Promise.all([
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null),
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null),
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('is_starred', true)
      .is('deleted_at', null),
    // Approved outputs count now comes from outputs.current_state — no
    // more scanning the full output_states audit log.
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('current_state', 'approved')
      .is('deleted_at', null),
    supabase
      .from('content_items')
      .select('id, title, status, kind, created_at')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(8),
    // Single fetch of (platform, current_state) — serves both the platform
    // breakdown AND the pipeline-by-state aggregation below. Capped at 5k
    // for safety on very large workspaces; counts still come from the
    // `count: 'exact'` queries above.
    supabase
      .from('outputs')
      .select('platform, current_state')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .limit(5000),
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .gte('created_at', startOfThisMonth),
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .gte('created_at', startOfThisMonth),
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .gte('created_at', startOfLastMonth)
      .lt('created_at', endOfLastMonth),
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .gte('created_at', startOfLastMonth)
      .lt('created_at', endOfLastMonth),
    supabase
      .from('content_items')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .gte('created_at', sparklineStartIso),
    supabase
      .from('outputs')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .gte('created_at', sparklineStartIso),
  ])

  // Bucket by day for sparklines — 7 slots, index 0 is the oldest day
  // (6 days ago), index 6 is today.
  function bucketByDay(rows: Array<{ created_at: string }> | null): number[] {
    const buckets = Array(7).fill(0)
    for (const row of rows ?? []) {
      const date = new Date(row.created_at)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const daysAgo = Math.floor(
        (todayStart.getTime() - dayStart.getTime()) / (24 * 60 * 60 * 1000),
      )
      if (daysAgo >= 0 && daysAgo <= 6) {
        buckets[6 - daysAgo]++
      }
    }
    return buckets
  }

  // Platform + state breakdowns both derived from the single allOutputsResult
  // fetch — no more "scan all output_states history in JS" pattern.
  const platformCounts: Record<string, number> = {}
  const pipelineByState: Record<PipelineState, number> = {
    draft: 0,
    review: 0,
    approved: 0,
    exported: 0,
  }
  for (const row of allOutputsResult.data ?? []) {
    platformCounts[row.platform] = (platformCounts[row.platform] ?? 0) + 1
    const state = row.current_state
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
    contentByDay: bucketByDay(contentSparkResult.data ?? null),
    outputsByDay: bucketByDay(outputsSparkResult.data ?? null),
  }
}
