import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface AnalyticsData {
  // Content created per month for last 6 months
  contentByMonth: Array<{ month: string; count: number }>
  // Outputs generated per month for last 6 months
  outputsByMonth: Array<{ month: string; count: number }>
  // Platform distribution (existing data)
  platformBreakdown: Record<string, number>
  // State distribution
  stateBreakdown: Record<string, number>
  // Top performing content (by starred output count)
  topContent: Array<{ id: string; title: string | null; starred: number; total_outputs: number }>
  // Total stats
  totalContent: number
  totalOutputs: number
  totalStarred: number
  totalApproved: number
}

export async function getAnalytics(workspaceId: string): Promise<AnalyticsData> {
  const supabase = createClient()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [
    contentItems,
    outputs,
    starredOutputs,
    outputStates,
    platformData,
  ] = await Promise.all([
    supabase.from('content_items').select('id, title, created_at').eq('workspace_id', workspaceId).gte('created_at', sixMonthsAgo.toISOString()),
    supabase.from('outputs').select('id, platform, content_id, is_starred, created_at').eq('workspace_id', workspaceId),
    supabase.from('outputs').select('id, content_id').eq('workspace_id', workspaceId).eq('is_starred', true),
    supabase.from('output_states').select('output_id, state, created_at').eq('workspace_id', workspaceId).order('created_at', { ascending: false }),
    supabase.from('outputs').select('platform').eq('workspace_id', workspaceId),
  ])

  // Content by month
  const contentByMonthMap: Record<string, number> = {}
  for (const item of contentItems.data ?? []) {
    const month = item.created_at.slice(0, 7) // YYYY-MM
    contentByMonthMap[month] = (contentByMonthMap[month] ?? 0) + 1
  }

  // Outputs by month
  const outputsByMonthMap: Record<string, number> = {}
  for (const o of outputs.data ?? []) {
    const month = o.created_at.slice(0, 7)
    outputsByMonthMap[month] = (outputsByMonthMap[month] ?? 0) + 1
  }

  // Generate last 6 months array
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // Platform breakdown
  const platformBreakdown: Record<string, number> = {}
  for (const o of platformData.data ?? []) {
    platformBreakdown[o.platform] = (platformBreakdown[o.platform] ?? 0) + 1
  }

  // State breakdown (latest state per output)
  const latestStateByOutput: Record<string, string> = {}
  for (const s of outputStates.data ?? []) {
    if (!latestStateByOutput[s.output_id]) {
      latestStateByOutput[s.output_id] = s.state
    }
  }
  const stateBreakdown: Record<string, number> = {}
  for (const state of Object.values(latestStateByOutput)) {
    stateBreakdown[state] = (stateBreakdown[state] ?? 0) + 1
  }

  // Top content by starred outputs
  const starsByContent: Record<string, number> = {}
  const totalOutputsByContent: Record<string, number> = {}
  for (const o of outputs.data ?? []) {
    totalOutputsByContent[o.content_id] = (totalOutputsByContent[o.content_id] ?? 0) + 1
    if (o.is_starred) starsByContent[o.content_id] = (starsByContent[o.content_id] ?? 0) + 1
  }

  // Get all content items for top content (need titles)
  const { data: allContentItems } = await supabase
    .from('content_items')
    .select('id, title')
    .eq('workspace_id', workspaceId)

  const topContent = (allContentItems ?? [])
    .filter(item => (starsByContent[item.id] ?? 0) > 0 || (totalOutputsByContent[item.id] ?? 0) > 0)
    .map(item => ({
      id: item.id,
      title: item.title,
      starred: starsByContent[item.id] ?? 0,
      total_outputs: totalOutputsByContent[item.id] ?? 0,
    }))
    .sort((a, b) => b.starred - a.starred || b.total_outputs - a.total_outputs)
    .slice(0, 5)

  // Count total items (all time, not just 6 months)
  const { count: totalContentCount } = await supabase.from('content_items').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId)
  const { count: totalOutputsCount } = await supabase.from('outputs').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId)

  return {
    contentByMonth: months.map(m => ({ month: m, count: contentByMonthMap[m] ?? 0 })),
    outputsByMonth: months.map(m => ({ month: m, count: outputsByMonthMap[m] ?? 0 })),
    platformBreakdown,
    stateBreakdown,
    topContent,
    totalContent: totalContentCount ?? 0,
    totalOutputs: totalOutputsCount ?? 0,
    totalStarred: starredOutputs.data?.length ?? 0,
    totalApproved: stateBreakdown['approved'] ?? 0,
  }
}
