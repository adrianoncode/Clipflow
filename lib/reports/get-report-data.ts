import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface ReportPeriod {
  label: string
  from: string
  to: string
}

export interface ReportData {
  period: ReportPeriod
  contentCreated: number
  outputsGenerated: number
  outputsApproved: number
  starredOutputs: number
  topContent: Array<{ id: string; title: string | null; outputs: number }>
  platformBreakdown: Record<string, number>
}

export async function getReportData(
  workspaceId: string,
  period: 'week' | 'month' = 'week',
): Promise<ReportData> {
  const supabase = createClient()
  const now = new Date()
  let from: Date
  let label: string

  if (period === 'week') {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    label = 'Last 7 days'
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
    label = now.toLocaleString('default', { month: 'long', year: 'numeric' })
  }

  const fromIso = from.toISOString()

  const [contentResult, outputsResult, approvedResult, starredResult, platformResult] =
    await Promise.all([
      supabase
        .from('content_items')
        .select('id, title, created_at')
        .eq('workspace_id', workspaceId)
        .gte('created_at', fromIso),
      supabase
        .from('outputs')
        .select('id, content_id, platform, created_at')
        .eq('workspace_id', workspaceId)
        .gte('created_at', fromIso),
      supabase
        .from('output_states')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('state', 'approved')
        .gte('created_at', fromIso),
      supabase
        .from('outputs')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('is_starred', true)
        .gte('created_at', fromIso),
      supabase
        .from('outputs')
        .select('platform')
        .eq('workspace_id', workspaceId)
        .gte('created_at', fromIso),
    ])

  const contentItems = contentResult.data ?? []
  const outputs = outputsResult.data ?? []

  // outputs per content item
  const outputsByContent: Record<string, number> = {}
  for (const o of outputs) {
    outputsByContent[o.content_id] = (outputsByContent[o.content_id] ?? 0) + 1
  }

  const topContent = contentItems
    .map((item) => ({ id: item.id, title: item.title, outputs: outputsByContent[item.id] ?? 0 }))
    .sort((a, b) => b.outputs - a.outputs)
    .slice(0, 5)

  const platformBreakdown: Record<string, number> = {}
  for (const o of platformResult.data ?? []) {
    platformBreakdown[o.platform] = (platformBreakdown[o.platform] ?? 0) + 1
  }

  return {
    period: { label, from: fromIso, to: now.toISOString() },
    contentCreated: contentItems.length,
    outputsGenerated: outputs.length,
    outputsApproved: approvedResult.count ?? 0,
    starredOutputs: starredResult.count ?? 0,
    topContent,
    platformBreakdown,
  }
}
