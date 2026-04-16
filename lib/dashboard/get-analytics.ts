import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface FunnelStage {
  key: 'imported' | 'outputs' | 'approved' | 'exported'
  label: string
  count: number
  /** Conversion rate from the previous stage. null at the first stage. */
  conversion: number | null
}

export interface StuckDraft {
  id: string
  title: string | null
  platform: string
  state: 'draft' | 'review'
  daysSince: number
  contentId: string
}

export interface PlatformCoverage {
  /** Content items that have outputs on ALL four platforms. */
  full: number
  /** Content items missing one or more platforms. */
  partial: number
  /** Content with no outputs at all. */
  none: number
}

export interface AnalyticsData {
  // Timeline
  contentByMonth: Array<{ month: string; count: number }>
  outputsByMonth: Array<{ month: string; count: number }>

  // Breakdowns
  platformBreakdown: Record<string, number>
  stateBreakdown: Record<string, number>

  // Top performers
  topContent: Array<{ id: string; title: string | null; starred: number; total_outputs: number }>

  // Totals
  totalContent: number
  totalOutputs: number
  totalStarred: number
  totalApproved: number

  // ── New: Funnel, velocity, health ───────────────────────────────
  /** Stage-by-stage funnel with conversion rates. */
  funnel: FunnelStage[]
  /** Content items created this week (rolling 7d) and delta vs previous 7d. */
  velocityContent: { thisWeek: number; lastWeek: number; deltaPct: number | null }
  /** Outputs generated this week and delta. */
  velocityOutputs: { thisWeek: number; lastWeek: number; deltaPct: number | null }
  /** % of generated outputs that reached `approved` (among those that moved past draft). */
  approvalRate: number
  /** Draft/review outputs older than 7 days — need attention. */
  stuckDrafts: StuckDraft[]
  /** Platform coverage snapshot. */
  platformCoverage: PlatformCoverage
}

const SUPPORTED_PLATFORMS = ['tiktok', 'instagram_reels', 'youtube_shorts', 'linkedin'] as const

function daysBetween(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function pctChange(now: number, prev: number): number | null {
  if (prev === 0) return now > 0 ? null : 0 // can't compute pct from zero base
  return Math.round(((now - prev) / prev) * 100)
}

export async function getAnalytics(workspaceId: string): Promise<AnalyticsData> {
  const supabase = createClient()

  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const weekAgo = new Date(now.getTime() - 7 * 86_400_000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000)

  const [
    contentItemsResult,
    outputsResult,
    outputStatesResult,
    platformDataResult,
  ] = await Promise.all([
    supabase
      .from('content_items')
      .select('id, title, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sixMonthsAgo.toISOString()),
    supabase
      .from('outputs')
      .select('id, platform, content_id, is_starred, created_at')
      .eq('workspace_id', workspaceId),
    supabase
      .from('output_states')
      .select('output_id, state, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    supabase.from('outputs').select('platform').eq('workspace_id', workspaceId),
  ])

  const contentItems = contentItemsResult.data ?? []
  const outputs = outputsResult.data ?? []
  const outputStates = outputStatesResult.data ?? []
  const platformData = platformDataResult.data ?? []

  // ── Monthly buckets ────────────────────────────────────────────
  const contentByMonthMap: Record<string, number> = {}
  for (const item of contentItems) {
    const month = item.created_at.slice(0, 7)
    contentByMonthMap[month] = (contentByMonthMap[month] ?? 0) + 1
  }
  const outputsByMonthMap: Record<string, number> = {}
  for (const o of outputs) {
    const month = o.created_at.slice(0, 7)
    outputsByMonthMap[month] = (outputsByMonthMap[month] ?? 0) + 1
  }

  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // ── Platform + state breakdown ─────────────────────────────────
  const platformBreakdown: Record<string, number> = {}
  for (const o of platformData) {
    platformBreakdown[o.platform] = (platformBreakdown[o.platform] ?? 0) + 1
  }

  // Latest state per output (outputStates is ordered DESC by created_at)
  const latestStateByOutput: Record<string, { state: string; createdAt: string }> = {}
  for (const s of outputStates) {
    if (!latestStateByOutput[s.output_id]) {
      latestStateByOutput[s.output_id] = { state: s.state, createdAt: s.created_at }
    }
  }
  const stateBreakdown: Record<string, number> = {}
  for (const entry of Object.values(latestStateByOutput)) {
    stateBreakdown[entry.state] = (stateBreakdown[entry.state] ?? 0) + 1
  }

  // ── Top content ────────────────────────────────────────────────
  const starsByContent: Record<string, number> = {}
  const totalOutputsByContent: Record<string, number> = {}
  const platformsByContent: Record<string, Set<string>> = {}
  for (const o of outputs) {
    totalOutputsByContent[o.content_id] = (totalOutputsByContent[o.content_id] ?? 0) + 1
    if (!platformsByContent[o.content_id]) platformsByContent[o.content_id] = new Set()
    platformsByContent[o.content_id]!.add(o.platform)
    if (o.is_starred) starsByContent[o.content_id] = (starsByContent[o.content_id] ?? 0) + 1
  }

  const { data: allContentItems } = await supabase
    .from('content_items')
    .select('id, title')
    .eq('workspace_id', workspaceId)

  const topContent = (allContentItems ?? [])
    .filter(
      (item) => (starsByContent[item.id] ?? 0) > 0 || (totalOutputsByContent[item.id] ?? 0) > 0,
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
      starred: starsByContent[item.id] ?? 0,
      total_outputs: totalOutputsByContent[item.id] ?? 0,
    }))
    .sort((a, b) => b.starred - a.starred || b.total_outputs - a.total_outputs)
    .slice(0, 5)

  // ── Totals ─────────────────────────────────────────────────────
  const { count: totalContentCount } = await supabase
    .from('content_items')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
  const { count: totalOutputsCount } = await supabase
    .from('outputs')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
  const { count: totalStarredCount } = await supabase
    .from('outputs')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('is_starred', true)

  // ── Funnel ─────────────────────────────────────────────────────
  const approvedCount = stateBreakdown['approved'] ?? 0
  const exportedCount = stateBreakdown['exported'] ?? 0
  const imported = totalContentCount ?? 0
  const outputsTotal = totalOutputsCount ?? 0

  function safeRate(num: number, denom: number): number | null {
    if (denom === 0) return null
    return Math.round((num / denom) * 100)
  }

  const funnel: FunnelStage[] = [
    { key: 'imported', label: 'Imported', count: imported, conversion: null },
    {
      key: 'outputs',
      label: 'Drafts generated',
      count: outputsTotal,
      conversion: safeRate(outputsTotal, imported),
    },
    {
      key: 'approved',
      label: 'Approved',
      count: approvedCount + exportedCount,
      conversion: safeRate(approvedCount + exportedCount, outputsTotal),
    },
    {
      key: 'exported',
      label: 'Exported',
      count: exportedCount,
      conversion: safeRate(exportedCount, approvedCount + exportedCount),
    },
  ]

  // ── Velocity (this week vs last week) ───────────────────────────
  const contentThisWeek = contentItems.filter(
    (c) => new Date(c.created_at) >= weekAgo,
  ).length
  const contentLastWeek = contentItems.filter((c) => {
    const d = new Date(c.created_at)
    return d >= twoWeeksAgo && d < weekAgo
  }).length

  const outputsThisWeek = outputs.filter((o) => new Date(o.created_at) >= weekAgo).length
  const outputsLastWeek = outputs.filter((o) => {
    const d = new Date(o.created_at)
    return d >= twoWeeksAgo && d < weekAgo
  }).length

  // ── Approval rate ──────────────────────────────────────────────
  // Among outputs that have ANY state beyond default 'draft', what % reached 'approved' (or beyond)
  const movedBeyondDraft = Object.values(latestStateByOutput).filter(
    (entry) => entry.state !== 'draft',
  ).length
  const approvedOrBeyond = Object.values(latestStateByOutput).filter(
    (entry) => entry.state === 'approved' || entry.state === 'exported',
  ).length
  const approvalRate = movedBeyondDraft === 0 ? 0 : Math.round((approvedOrBeyond / movedBeyondDraft) * 100)

  // ── Stuck drafts (in draft/review for > 7d) ─────────────────────
  // Build a map of when each output was LAST touched (state change or creation)
  const lastTouchByOutput: Record<string, string> = {}
  for (const s of outputStates) {
    if (!lastTouchByOutput[s.output_id] || s.created_at > lastTouchByOutput[s.output_id]!) {
      lastTouchByOutput[s.output_id] = s.created_at
    }
  }

  const contentTitleById = new Map(
    (allContentItems ?? []).map((c) => [c.id, c.title] as const),
  )

  const stuckCandidates: StuckDraft[] = []
  for (const o of outputs) {
    const latestState = latestStateByOutput[o.id]?.state ?? 'draft'
    if (latestState !== 'draft' && latestState !== 'review') continue
    const lastTouch = lastTouchByOutput[o.id] ?? o.created_at
    const age = daysBetween(lastTouch)
    if (age < 7) continue
    stuckCandidates.push({
      id: o.id,
      title: contentTitleById.get(o.content_id) ?? null,
      platform: o.platform as string,
      state: latestState as 'draft' | 'review',
      daysSince: age,
      contentId: o.content_id,
    })
  }
  stuckCandidates.sort((a, b) => b.daysSince - a.daysSince)
  const topStuck = stuckCandidates.slice(0, 5)

  // ── Platform coverage ──────────────────────────────────────────
  let full = 0
  let partial = 0
  let none = 0
  for (const c of allContentItems ?? []) {
    const covered = platformsByContent[c.id] ?? new Set()
    const hasAllFour = SUPPORTED_PLATFORMS.every((p) => covered.has(p))
    if (covered.size === 0) none++
    else if (hasAllFour) full++
    else partial++
  }

  return {
    contentByMonth: months.map((m) => ({ month: m, count: contentByMonthMap[m] ?? 0 })),
    outputsByMonth: months.map((m) => ({ month: m, count: outputsByMonthMap[m] ?? 0 })),
    platformBreakdown,
    stateBreakdown,
    topContent,
    totalContent: totalContentCount ?? 0,
    totalOutputs: totalOutputsCount ?? 0,
    totalStarred: totalStarredCount ?? 0,
    totalApproved: approvedCount,

    funnel,
    velocityContent: {
      thisWeek: contentThisWeek,
      lastWeek: contentLastWeek,
      deltaPct: pctChange(contentThisWeek, contentLastWeek),
    },
    velocityOutputs: {
      thisWeek: outputsThisWeek,
      lastWeek: outputsLastWeek,
      deltaPct: pctChange(outputsThisWeek, outputsLastWeek),
    },
    approvalRate,
    stuckDrafts: topStuck,
    platformCoverage: { full, partial, none },
  }
}
