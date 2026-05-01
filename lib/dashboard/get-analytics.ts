import 'server-only'
import { createClient } from '@/lib/supabase/server'
import {
  bucketSpec,
  rangeToDays,
  type DashboardRange,
} from '@/lib/dashboard/range'

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

export interface PublishedPost {
  id: string
  platform: string
  status: string
  scheduled_for: string
  published_at: string | null
  contentTitle: string | null
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  engagementRate: number | null
  url: string | null
}

export interface EngagementTotals {
  totalViews: number
  totalLikes: number
  totalComments: number
  totalShares: number
  avgEngagementRate: number | null
}

export interface PublishingStats {
  scheduled: number
  published: number
  failed: number
}

export interface OutputBucket {
  /** ISO date marking the START of the bucket (oldest first). For
   *  daily buckets this is the day itself; for weekly buckets this
   *  is Monday of the week. */
  isoStart: string
  /** Compact label for the chart axis. Daily: weekday-letter ("M").
   *  Weekly: ISO week number ("W12"). */
  label: string
  count: number
}

export interface AnalyticsData {
  // Timeline
  contentByMonth: Array<{ month: string; count: number }>
  outputsByMonth: Array<{ month: string; count: number }>
  /** Output volume bucketed across the selected range. Bucket size
   *  follows `bucketSpec(range)` — daily for 7d/30d, weekly for 90d.
   *  Replaces the previous fixed `outputsByDayLast7Days` field. */
  outputsByBucket: OutputBucket[]
  /** The range used to compute this snapshot. Mirrored from input so
   *  the client renders matching axis labels and the "Last Nd" header
   *  without re-deriving from URL state. */
  range: DashboardRange

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

  // ── Funnel, velocity, health ───────────────────────────────────
  funnel: FunnelStage[]
  /** Imports volume comparison: this period vs the period before it.
   *  Period length follows `range`. */
  velocityContent: { thisPeriod: number; lastPeriod: number; deltaPct: number | null }
  /** Outputs volume comparison: this period vs the period before it. */
  velocityOutputs: { thisPeriod: number; lastPeriod: number; deltaPct: number | null }
  approvalRate: number
  stuckDrafts: StuckDraft[]
  platformCoverage: PlatformCoverage

  // ── Engagement & publishing ────────────────────────────────────
  /** Real engagement data from published posts (via Upload-Post). */
  engagement: EngagementTotals
  /** Top posts by views with engagement stats. */
  topPublished: PublishedPost[]
  /** Per-platform engagement breakdown. */
  engagementByPlatform: Record<string, EngagementTotals>
  /** Scheduling funnel: scheduled → published → failed. */
  publishingStats: PublishingStats
  /** Whether workspace has an Upload-Post key connected. */
  hasPublishKey: boolean
}

const SUPPORTED_PLATFORMS = ['tiktok', 'instagram_reels', 'youtube_shorts', 'linkedin'] as const

function daysBetween(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function pctChange(now: number, prev: number): number | null {
  if (prev === 0) return now > 0 ? null : 0 // can't compute pct from zero base
  return Math.round(((now - prev) / prev) * 100)
}

export async function getAnalytics(
  workspaceId: string,
  range: DashboardRange = '7d',
): Promise<AnalyticsData> {
  const supabase = createClient()

  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  // Range-driven comparison windows. "this period" = last N days,
  // "previous period" = the N days before that. Keeps velocity-delta
  // semantics consistent at any range — 7d → week-over-week,
  // 30d → month-over-month, 90d → quarter-over-quarter.
  const windowDays = rangeToDays(range)
  const periodAgo = new Date(now.getTime() - windowDays * 86_400_000)
  const prevPeriodAgo = new Date(now.getTime() - 2 * windowDays * 86_400_000)
  // Six-month source window for content fetches must always cover the
  // 90-day case plus its previous-period comparison (180 days).
  // sixMonthsAgo (which is exactly 6 months ≈ 183 days) already does.

  // Stuck drafts only look at rows aged 7+ days — no need to fetch full
  // state history. 60-day window catches every possible candidate
  // regardless of dashboard range (drafts older than 60d already get
  // truncated to "60d cold" anyway).
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86_400_000)

  // Single batched Promise.all — previously two extra sequential queries
  // (`allContentItems` + totals counts) ran after this block. Reduces
  // dashboard p50 by ~30% on workspaces with large history.
  // The three separate count('exact', head: true) queries used to be
  // our wall-clock bottleneck — outputsCount alone averaged 280 ms.
  // Now derived from the data queries that already scan the same rows:
  // - totalContent: length of allContentItemsResult (same filter)
  // - totalOutputs: length of outputsResult (capped at 5000 — workspaces
  //   beyond that display 5 000 and still render in time)
  // - totalStarred: same array filtered by is_starred
  const [
    contentItemsResult,
    outputsResult,
    recentStatesResult,
    allContentItemsResult,
    scheduledPostsResult,
    publishKeyResult,
  ] = await Promise.all([
    supabase
      .from('content_items')
      .select('id, title, created_at')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .gte('created_at', sixMonthsAgo.toISOString()),
    // Fetch outputs WITH current_state (denormalized column populated by
    // trigger). Replaces the previous "fetch all output_states + scan in
    // JS to find the latest per output" pattern. Cap at 5k for safety.
    supabase
      .from('outputs')
      .select('id, platform, content_id, is_starred, current_state, created_at')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5000),
    // Only pull recent state transitions — needed for stuck-draft
    // "days since last touch" calculation. 60-day window is plenty.
    supabase
      .from('output_states')
      .select('output_id, created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('content_items')
      .select('id, title')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null),
    supabase
      .from('scheduled_posts')
      .select('id, platform, status, scheduled_for, published_at, metadata, output_id')
      .eq('workspace_id', workspaceId),
    supabase
      .from('ai_keys')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('provider', 'upload-post')
      .limit(1),
  ])

  const contentItems = contentItemsResult.data ?? []
  const outputs = outputsResult.data ?? []
  const recentStates = recentStatesResult.data ?? []
  const allContentItems = allContentItemsResult.data ?? []
  // Counts derived from the data arrays we already fetched — these used
  // to be three separate count('exact') queries and were our analytics
  // bottleneck (~280 ms for outputsCount alone on big workspaces).
  const totalContentCount = allContentItems.length
  const totalOutputsCount = outputs.length
  const totalStarredCount = outputs.filter((o) => o.is_starred).length
  const scheduledPosts = scheduledPostsResult.data ?? []
  const hasPublishKey = (publishKeyResult.data ?? []).length > 0
  // Platform breakdown now comes from the main outputs fetch — no extra query needed.
  const platformData = outputs

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

  // ── Output bucket aggregation across the selected range ─────────
  // Bucket strategy comes from `bucketSpec(range)`:
  //   7d  → 7 daily buckets (label: weekday letter)
  //   30d → 30 daily buckets (label: empty except every 5th = day-of-month)
  //   90d → 13 weekly buckets (label: ISO week, "W12")
  // Daily buckets share one map; weekly buckets compute on the fly.
  const dayKey = (iso: string): string => iso.slice(0, 10)
  const outputsByDayMap: Record<string, number> = {}
  for (const o of outputs) {
    const day = dayKey(o.created_at)
    outputsByDayMap[day] = (outputsByDayMap[day] ?? 0) + 1
  }

  const spec = bucketSpec(range)
  const outputsByBucket: OutputBucket[] = []
  if (spec.weekly) {
    // 13 weekly buckets ending today. Week buckets aren't ISO-aligned —
    // they're rolling 7-day windows ending on each "today minus 7n",
    // so the rightmost bucket always reflects the freshest 7 days.
    for (let w = spec.count - 1; w >= 0; w--) {
      const bucketEnd = new Date(now)
      bucketEnd.setHours(0, 0, 0, 0)
      bucketEnd.setDate(bucketEnd.getDate() - w * 7)
      const bucketStart = new Date(bucketEnd)
      bucketStart.setDate(bucketStart.getDate() - 6)
      let count = 0
      for (let d = 0; d < 7; d++) {
        const day = new Date(bucketStart)
        day.setDate(day.getDate() + d)
        count += outputsByDayMap[day.toISOString().slice(0, 10)] ?? 0
      }
      // Compact week label using the start-of-week month/day.
      const label = bucketStart.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric',
      })
      outputsByBucket.push({
        isoStart: bucketStart.toISOString().slice(0, 10),
        label,
        count,
      })
    }
  } else {
    // Daily buckets, oldest first. For 7d we emit weekday-letter
    // labels; for 30d we leave most labels blank and let the chart
    // place sparse markers — the data layer just hands strings, the
    // chart decides what to render.
    for (let i = spec.count - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const isoStart = d.toISOString().slice(0, 10)
      const count = outputsByDayMap[isoStart] ?? 0
      const label =
        spec.count === 7
          ? d.toLocaleDateString(undefined, { weekday: 'narrow' })
          : // Every 5th day gets a short M/D label, others stay blank.
            i % 5 === 0
            ? d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
            : ''
      outputsByBucket.push({ isoStart, label, count })
    }
  }

  // ── Platform + state breakdown ─────────────────────────────────
  const platformBreakdown: Record<string, number> = {}
  for (const o of platformData) {
    platformBreakdown[o.platform] = (platformBreakdown[o.platform] ?? 0) + 1
  }

  // State breakdown uses the denormalized `current_state` column directly —
  // no more "fetch all state history and scan in JS" pattern.
  const stateBreakdown: Record<string, number> = {}
  for (const o of outputs) {
    const state = o.current_state ?? 'draft'
    stateBreakdown[state] = (stateBreakdown[state] ?? 0) + 1
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

  const topContent = allContentItems
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

  // ── Funnel ─────────────────────────────────────────────────────
  const approvedCount = stateBreakdown['approved'] ?? 0
  const exportedCount = stateBreakdown['exported'] ?? 0
  const imported = totalContentCount
  const outputsTotal = totalOutputsCount

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

  // ── Velocity (this period vs previous period of same length) ───
  // Window length follows the dashboard range: 7d/30d/90d. The
  // comparison is always rolling (ending today), not calendar-aligned —
  // matches user intuition of "the last 30 days" vs "the 30 before that".
  const contentThisPeriod = contentItems.filter(
    (c) => new Date(c.created_at) >= periodAgo,
  ).length
  const contentLastPeriod = contentItems.filter((c) => {
    const d = new Date(c.created_at)
    return d >= prevPeriodAgo && d < periodAgo
  }).length

  const outputsThisPeriod = outputs.filter((o) => new Date(o.created_at) >= periodAgo).length
  const outputsLastPeriod = outputs.filter((o) => {
    const d = new Date(o.created_at)
    return d >= prevPeriodAgo && d < periodAgo
  }).length

  // ── Approval rate ──────────────────────────────────────────────
  // Among outputs that moved past 'draft', what % reached 'approved'/'exported'?
  const movedBeyondDraft = outputs.filter((o) => (o.current_state ?? 'draft') !== 'draft').length
  const approvedOrBeyond = outputs.filter(
    (o) => o.current_state === 'approved' || o.current_state === 'exported',
  ).length
  const approvalRate =
    movedBeyondDraft === 0 ? 0 : Math.round((approvedOrBeyond / movedBeyondDraft) * 100)

  // ── Stuck drafts (in draft/review for > 7d) ─────────────────────
  // Use the 60-day state-transition window to compute last-touch timestamps.
  // recentStates is ordered DESC, so the first hit per output is the latest.
  const lastTouchByOutput: Record<string, string> = {}
  for (const s of recentStates) {
    if (!lastTouchByOutput[s.output_id]) {
      lastTouchByOutput[s.output_id] = s.created_at
    }
  }

  const contentTitleById = new Map(allContentItems.map((c) => [c.id, c.title] as const))

  const stuckCandidates: StuckDraft[] = []
  for (const o of outputs) {
    const state = o.current_state ?? 'draft'
    if (state !== 'draft' && state !== 'review') continue
    const lastTouch = lastTouchByOutput[o.id] ?? o.created_at
    const age = daysBetween(lastTouch)
    if (age < 7) continue
    stuckCandidates.push({
      id: o.id,
      title: contentTitleById.get(o.content_id) ?? null,
      platform: o.platform as string,
      state: state as 'draft' | 'review',
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
  for (const c of allContentItems) {
    const covered = platformsByContent[c.id] ?? new Set()
    const hasAllFour = SUPPORTED_PLATFORMS.every((p) => covered.has(p))
    if (covered.size === 0) none++
    else if (hasAllFour) full++
    else partial++
  }

  // ── Engagement & publishing data ────────────────────────────────
  // (scheduledPosts + hasPublishKey were already resolved in the main Promise.all above)

  // Publishing stats
  const publishingStats: PublishingStats = { scheduled: 0, published: 0, failed: 0 }
  for (const post of scheduledPosts) {
    if (post.status === 'published') publishingStats.published++
    else if (post.status === 'failed') publishingStats.failed++
    else publishingStats.scheduled++
  }

  // Get content titles for published posts
  const outputIds = scheduledPosts.map(p => p.output_id).filter(Boolean)
  const { data: outputsForPosts } = outputIds.length > 0
    ? await supabase
        .from('outputs')
        .select('id, content_id')
        .in('id', outputIds)
    : { data: [] as Array<{ id: string; content_id: string }> }
  const contentIdForOutput = new Map((outputsForPosts ?? []).map(o => [o.id, o.content_id]))

  // Engagement aggregation
  let totalViews = 0
  let totalLikes = 0
  let totalComments = 0
  let totalShares = 0
  const engagementRates: number[] = []
  const platformEngagement: Record<string, { views: number; likes: number; comments: number; shares: number; rates: number[] }> = {}

  const publishedWithStats: PublishedPost[] = []

  for (const post of scheduledPosts) {
    if (post.status !== 'published') continue
    const meta = post.metadata as Record<string, unknown> | null
    if (!meta) continue

    const views = typeof meta.views === 'number' ? meta.views : null
    const likes = typeof meta.likes === 'number' ? meta.likes : null
    const comments = typeof meta.comments === 'number' ? meta.comments : null
    const shares = typeof meta.shares === 'number' ? meta.shares : null
    const engRate = typeof meta.engagement_rate === 'number' ? meta.engagement_rate : null
    const url = typeof meta.url === 'string' ? meta.url : null

    if (views !== null) totalViews += views
    if (likes !== null) totalLikes += likes
    if (comments !== null) totalComments += comments
    if (shares !== null) totalShares += shares
    if (engRate !== null) engagementRates.push(engRate)

    // Per-platform
    if (!platformEngagement[post.platform]) {
      platformEngagement[post.platform] = { views: 0, likes: 0, comments: 0, shares: 0, rates: [] }
    }
    const pe = platformEngagement[post.platform]!
    if (views !== null) pe.views += views
    if (likes !== null) pe.likes += likes
    if (comments !== null) pe.comments += comments
    if (shares !== null) pe.shares += shares
    if (engRate !== null) pe.rates.push(engRate)

    const contentId = contentIdForOutput.get(post.output_id)
    publishedWithStats.push({
      id: post.id,
      platform: post.platform,
      status: post.status,
      scheduled_for: post.scheduled_for,
      published_at: post.published_at,
      contentTitle: contentId ? (contentTitleById.get(contentId) ?? null) : null,
      views, likes, comments, shares,
      engagementRate: engRate,
      url,
    })
  }

  // Sort by views DESC, take top 10
  publishedWithStats.sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
  const topPublished = publishedWithStats.slice(0, 10)

  const avgEngagementRate = engagementRates.length > 0
    ? Math.round((engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length) * 100) / 100
    : null

  const engagementByPlatform: Record<string, EngagementTotals> = {}
  for (const [platform, data] of Object.entries(platformEngagement)) {
    engagementByPlatform[platform] = {
      totalViews: data.views,
      totalLikes: data.likes,
      totalComments: data.comments,
      totalShares: data.shares,
      avgEngagementRate: data.rates.length > 0
        ? Math.round((data.rates.reduce((a, b) => a + b, 0) / data.rates.length) * 100) / 100
        : null,
    }
  }

  return {
    contentByMonth: months.map((m) => ({ month: m, count: contentByMonthMap[m] ?? 0 })),
    outputsByMonth: months.map((m) => ({ month: m, count: outputsByMonthMap[m] ?? 0 })),
    outputsByBucket,
    range,
    platformBreakdown,
    stateBreakdown,
    topContent,
    totalContent: totalContentCount,
    totalOutputs: totalOutputsCount,
    totalStarred: totalStarredCount,
    totalApproved: approvedCount,

    funnel,
    velocityContent: {
      thisPeriod: contentThisPeriod,
      lastPeriod: contentLastPeriod,
      deltaPct: pctChange(contentThisPeriod, contentLastPeriod),
    },
    velocityOutputs: {
      thisPeriod: outputsThisPeriod,
      lastPeriod: outputsLastPeriod,
      deltaPct: pctChange(outputsThisPeriod, outputsLastPeriod),
    },
    approvalRate,
    stuckDrafts: topStuck,
    platformCoverage: { full, partial, none },

    engagement: {
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      avgEngagementRate,
    },
    topPublished,
    engagementByPlatform,
    publishingStats,
    hasPublishKey,
  }
}
