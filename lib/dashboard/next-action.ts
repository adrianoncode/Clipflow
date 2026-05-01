import type { AnalyticsData, StuckDraft } from '@/lib/dashboard/get-analytics'

/**
 * Decision tree for the FeaturedCard's "what should the user do next?"
 * recommendation. Replaces the previous Top-Performer vanity tile —
 * largest real-estate on the dashboard now points at a concrete
 * actionable next step instead of a celebratory totals number.
 *
 * Priority ladder, highest first:
 *   1. STUCK    — stuck drafts (>7 days idle). Risk of staleness.
 *   2. REVIEW   — drafts already in 'review' state, waiting on the user.
 *   3. DRAFT    — fresh drafts that need first approval.
 *   4. CONNECT  — no publishing key wired (drafts can never go live).
 *   5. TOP      — fallback to the legacy top-performer celebration.
 *
 * Each level is mutually exclusive at the top — the highest-priority
 * match wins and lower levels never render. Keeps the card focused on
 * one thing instead of fanning into an action list.
 */

export type NextAction =
  | {
      kind: 'stuck'
      stuck: StuckDraft
      othersCount: number // additional stuck drafts beyond the headline one
    }
  | {
      kind: 'review'
      pendingCount: number
    }
  | {
      kind: 'draft'
      draftCount: number
    }
  | {
      kind: 'connect-publish'
    }
  | {
      kind: 'top-performer'
      content: { id: string; title: string | null; total_outputs: number; starred: number }
    }
  | {
      kind: 'fresh-workspace'
      workspaceName: string
    }

interface ComputeArgs {
  analytics: AnalyticsData
  workspaceName: string
}

export function computeNextAction({ analytics, workspaceName }: ComputeArgs): NextAction {
  // 1. Stuck drafts — anything ≥7 days stale is bleeding momentum.
  if (analytics.stuckDrafts.length > 0) {
    const [headline, ...rest] = analytics.stuckDrafts
    return {
      kind: 'stuck',
      stuck: headline!,
      othersCount: rest.length,
    }
  }

  // 2. Outputs sitting in 'review' state — user explicitly queued them
  //    for review but hasn't acted yet. Different from 'stuck' because
  //    these aren't aged-out yet, just on the user's plate today.
  const reviewCount = analytics.stateBreakdown['review'] ?? 0
  if (reviewCount > 0) {
    return { kind: 'review', pendingCount: reviewCount }
  }

  // 3. Outputs in 'draft' state — generated but never reviewed at all.
  const draftCount = analytics.stateBreakdown['draft'] ?? 0
  if (draftCount > 0) {
    return { kind: 'draft', draftCount }
  }

  // 4. Posts can never go live without a publishing key. If there are
  //    approved/exported outputs but no publish key, that's the lock —
  //    surfacing this is more useful than celebrating top performers.
  if (!analytics.hasPublishKey && analytics.totalApproved > 0) {
    return { kind: 'connect-publish' }
  }

  // 5. Top-performer fallback — only when we have something to brag
  //    about. A workspace with zero outputs at all should hit the
  //    "fresh" branch below, not a confused "top performer: nothing".
  const top = analytics.topContent[0]
  if (top && top.total_outputs > 0) {
    return {
      kind: 'top-performer',
      content: {
        id: top.id,
        title: top.title,
        total_outputs: top.total_outputs,
        starred: top.starred,
      },
    }
  }

  // 6. Genuinely empty active state — should be rare since the
  //    progressive empty-state check upstream catches most of these,
  //    but this is the safety net (e.g. all outputs deleted).
  return { kind: 'fresh-workspace', workspaceName }
}
