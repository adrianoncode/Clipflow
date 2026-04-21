import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { OUTPUT_PLATFORMS, PLATFORM_LONG_LABELS } from '@/lib/platforms'

export interface Suggestion {
  id: string
  type:
    | 'posting_gap'
    | 'platform_neglected'
    | 'content_stale'
    | 'pipeline_stuck'
    | 'recycle'
    | 'milestone'
    | 'streak'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionLabel: string
  actionHref: string
  icon: string
}

const PRIORITY_ORDER: Record<Suggestion['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const PLATFORM_LABELS = PLATFORM_LONG_LABELS
const ALL_PLATFORMS = OUTPUT_PLATFORMS

export async function getSuggestions(workspaceId: string): Promise<Suggestion[]> {
  const supabase = await createClient()

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

  // Three-week window for streak detection (each week = 7 days)
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString()

  const [
    latestContentResult,
    outputsLast30Result,
    readyNoOutputsResult,
    stuckDraftsResult,
    recyclableResult,
    totalOutputsResult,
    streakContentResult,
  ] = await Promise.all([
    // Most recent content item creation date
    supabase
      .from('content_items')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1),

    // Outputs in last 30 days by platform
    supabase
      .from('outputs')
      .select('platform')
      .eq('workspace_id', workspaceId)
      .gte('created_at', thirtyDaysAgo),

    // Content items with status='ready' that have zero outputs
    // We fetch ready items then check for outputs
    supabase
      .from('content_items')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ready'),

    // Stuck drafts — outputs currently in 'draft' state whose last
    // activity is 7+ days ago. Previously we scanned every row in
    // output_states for the workspace (no date bound, no limit) and
    // picked the latest per output_id in JS. Now we read the
    // denormalized outputs.current_state column (maintained by the
    // same trigger the analytics page relies on) and rely on the
    // (workspace_id, current_state) lookup + updated_at index. Same
    // answer, single indexed query, ~100–400 ms saved on mature
    // workspaces.
    supabase
      .from('outputs')
      .select('id, updated_at')
      .eq('workspace_id', workspaceId)
      .eq('current_state', 'draft')
      .is('deleted_at', null)
      .lte('updated_at', sevenDaysAgo),

    // Content older than 60 days that has approved/exported outputs
    supabase
      .from('content_items')
      .select('id')
      .eq('workspace_id', workspaceId)
      .lte('created_at', sixtyDaysAgo),

    // Total outputs for milestone
    supabase
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),

    // Content created in last 3 weeks for streak detection
    supabase
      .from('content_items')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .gte('created_at', threeWeeksAgo),
  ])

  const suggestions: Suggestion[] = []

  // ── posting_gap ─────────────────────────────────────────────
  const latestContent = latestContentResult.data?.[0]
  if (latestContent) {
    const daysSince = Math.floor(
      (now.getTime() - new Date(latestContent.created_at).getTime()) / (24 * 60 * 60 * 1000),
    )
    if (daysSince >= 7) {
      suggestions.push({
        id: 'posting_gap',
        type: 'posting_gap',
        priority: 'high',
        title: `No new content in ${daysSince} days`,
        description:
          'Consistency is key for audience growth. Import a video or paste a YouTube link to keep creating.',
        actionLabel: 'Add content',
        actionHref: `/workspace/${workspaceId}/content/new`,
        icon: 'CalendarX2',
      })
    }
  }

  // ── platform_neglected ──────────────────────────────────────
  const platformCounts: Record<string, number> = {}
  for (const row of outputsLast30Result.data ?? []) {
    platformCounts[row.platform] = (platformCounts[row.platform] ?? 0) + 1
  }
  // Only flag neglected platforms if the user has outputs at all
  const hasAnyOutputs = (totalOutputsResult.count ?? 0) > 0
  if (hasAnyOutputs) {
    for (const platform of ALL_PLATFORMS) {
      if ((platformCounts[platform] ?? 0) === 0) {
        const label = PLATFORM_LABELS[platform] ?? platform
        suggestions.push({
          id: `platform_neglected_${platform}`,
          type: 'platform_neglected',
          priority: 'medium',
          title: `${label} has been quiet`,
          description: `You haven't generated any ${label} content in the last 30 days. Diversifying platforms increases your reach.`,
          actionLabel: `Create for ${label}`,
          actionHref: `/workspace/${workspaceId}`,
          icon: 'Radio',
        })
        break // Only show one neglected platform
      }
    }
  }

  // ── content_stale + recycle (parallelized) ─────────────────
  //
  // Both branches depend on the initial Promise.all results but are
  // independent of each other. Previously they ran back-to-back,
  // meaning every dashboard render spent an extra round-trip of
  // latency for no reason. Kick them off together and wait once.
  const readyIds =
    (readyNoOutputsResult.data ?? []).map((r) => r.id)
  const oldIds = (recyclableResult.data ?? []).map((r) => r.id)

  const [outputsForReadyRes, oldOutputStatesRes, oldOutputsRes] = await Promise.all([
    readyIds.length > 0
      ? supabase
          .from('outputs')
          .select('content_id')
          .eq('workspace_id', workspaceId)
          .in('content_id', readyIds)
      : Promise.resolve({ data: [] as { content_id: string }[] }),
    oldIds.length > 0
      ? supabase
          .from('output_states')
          .select('output_id, state')
          .eq('workspace_id', workspaceId)
          .in('state', ['approved', 'exported'])
      : Promise.resolve({ data: [] as { output_id: string; state: string }[] }),
    oldIds.length > 0
      ? supabase
          .from('outputs')
          .select('id, content_id')
          .eq('workspace_id', workspaceId)
          .in('content_id', oldIds)
      : Promise.resolve({ data: [] as { id: string; content_id: string }[] }),
  ])

  if (readyIds.length > 0) {
    const idsWithOutputs = new Set(
      (outputsForReadyRes.data ?? []).map((o) => o.content_id),
    )
    const staleCount = readyIds.filter((id) => !idsWithOutputs.has(id)).length

    if (staleCount > 0) {
      suggestions.push({
        id: 'content_stale',
        type: 'content_stale',
        priority: 'high',
        title: `${staleCount} content item${staleCount !== 1 ? 's' : ''} waiting for outputs`,
        description:
          'These are transcribed and ready to go. Generate TikTok, Reels, or LinkedIn drafts in one click.',
        actionLabel: 'View content',
        actionHref: `/workspace/${workspaceId}`,
        icon: 'PackageOpen',
      })
    }
  }

  // ── pipeline_stuck ──────────────────────────────────────────
  // Query already filtered by current_state='draft' + updated_at ≤ 7d
  // so the count is just the row count — no per-output latest-state
  // reconstruction needed.
  const stuckCount = stuckDraftsResult.data?.length ?? 0
  if (stuckCount > 0) {
    suggestions.push({
      id: 'pipeline_stuck',
      type: 'pipeline_stuck',
      priority: 'medium',
      title: `${stuckCount} draft${stuckCount !== 1 ? 's' : ''} sitting for over a week`,
      description:
        'You have old drafts sitting around. Review them, approve the good ones, or discard the rest.',
      actionLabel: 'Review drafts',
      actionHref: `/workspace/${workspaceId}/pipeline`,
      icon: 'Timer',
    })
  }

  // ── recycle (uses the parallelized results from above) ─────
  if (oldIds.length > 0) {
    const outputIdsWithApproval = new Set(
      (oldOutputStatesRes.data ?? []).map((s) => s.output_id),
    )
    const contentIdsWithApproved = new Set(
      (oldOutputsRes.data ?? [])
        .filter((o) => outputIdsWithApproval.has(o.id))
        .map((o) => o.content_id),
    )

    const recycleCount = contentIdsWithApproved.size
    if (recycleCount > 0) {
      suggestions.push({
        id: 'recycle',
        type: 'recycle',
        priority: 'low',
        title: `${recycleCount} piece${recycleCount !== 1 ? 's' : ''} ready to recycle`,
        description:
          'Content older than 60 days with proven outputs. Repurpose them for a new audience — most won\'t remember.',
        actionLabel: 'View recyclable',
        actionHref: `/workspace/${workspaceId}`,
        icon: 'Recycle',
      })
    }
  }

  // ── milestone ───────────────────────────────────────────────
  const totalOutputs = totalOutputsResult.count ?? 0
  const milestones = [500, 100, 50, 10] // check highest first
  for (const m of milestones) {
    if (totalOutputs >= m) {
      suggestions.push({
        id: `milestone_${m}`,
        type: 'milestone',
        priority: 'low',
        title: `You've crossed ${m} outputs`,
        description:
          m >= 100
            ? 'That\'s serious volume. Your content machine is running strong.'
            : 'Great momentum. Keep generating and refining your content strategy.',
        actionLabel: 'View analytics',
        actionHref: '/analytics',
        icon: 'Trophy',
      })
      break // Only show highest milestone
    }
  }

  // ── streak ──────────────────────────────────────────────────
  const streakDates = (streakContentResult.data ?? []).map(
    (r) => new Date(r.created_at),
  )
  if (streakDates.length > 0) {
    // Check if content was created in at least 3 distinct calendar weeks
    const weekSet = new Set<string>()
    for (const d of streakDates) {
      // Use ISO week: year + week number
      const jan1 = new Date(d.getFullYear(), 0, 1)
      const weekNum = Math.ceil(
        ((d.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000) + jan1.getDay() + 1) / 7,
      )
      weekSet.add(`${d.getFullYear()}-W${weekNum}`)
    }
    if (weekSet.size >= 3) {
      suggestions.push({
        id: 'streak',
        type: 'streak',
        priority: 'low',
        title: `${weekSet.size}-week content streak`,
        description:
          'You\'ve been consistent for weeks. That kind of discipline compounds — keep it going.',
        actionLabel: 'Keep it up',
        actionHref: `/workspace/${workspaceId}/content/new`,
        icon: 'Flame',
      })
    }
  }

  // Sort by priority, cap at 5
  suggestions.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  return suggestions.slice(0, 5)
}
