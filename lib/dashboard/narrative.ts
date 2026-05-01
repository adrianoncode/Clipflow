import type { AnalyticsData } from '@/lib/dashboard/get-analytics'
import type { DashboardRange } from '@/lib/dashboard/range'

/**
 * One-line narrative summary of the dashboard's current state.
 *
 * Why a function and not just inline JSX: the priority logic (which
 * fact wins when several are true) lives in one place. Without this,
 * five different "if velocity… then…" branches end up scattered across
 * the bento and the dashboard reads as a wall of numbers without a
 * point of view.
 *
 * Priority ladder, highest first:
 *   1. Critical: stuck drafts piling up (>3 are stale)
 *   2. Negative: outputs trending down significantly
 *   3. Positive: imports OR outputs up >25%
 *   4. Achievement: high approval rate at meaningful volume
 *   5. Quiet: no activity in the period
 *   6. Neutral: nothing notable, fall through
 *
 * Every branch returns absolute numbers, never vague language. Per
 * Vercel WIG content rules: "8 deployments" not "several deployments".
 */

export type NarrativeTone = 'positive' | 'neutral' | 'caution' | 'critical'

export interface DashboardNarrative {
  tone: NarrativeTone
  /** Plain text — no JSX, callers wrap in their own components. */
  text: string
}

const RANGE_PHRASE: Record<DashboardRange, string> = {
  '7d': 'this week',
  '30d': 'this month',
  '90d': 'this quarter',
}

const PRIOR_PHRASE: Record<DashboardRange, string> = {
  '7d': 'last week',
  '30d': 'last month',
  '90d': 'last quarter',
}

export function buildNarrative(
  data: AnalyticsData,
  range: DashboardRange,
): DashboardNarrative {
  const periodPhrase = RANGE_PHRASE[range]
  const priorPhrase = PRIOR_PHRASE[range]
  const stuck = data.stuckDrafts.length
  const importsDelta = data.velocityContent.deltaPct
  const outputsDelta = data.velocityOutputs.deltaPct
  const approval = data.approvalRate
  const importsThisPeriod = data.velocityContent.thisPeriod
  const outputsThisPeriod = data.velocityOutputs.thisPeriod
  const movedPastDraft = data.totalApproved // close enough proxy

  // 1. Stuck-drafts emergency takes precedence over everything —
  //    nothing else matters if work is rotting in the queue.
  if (stuck >= 3) {
    return {
      tone: 'critical',
      text: `${stuck} drafts have been stuck for over 7 days — review them before they stale out.`,
    }
  }

  // 2. Outputs collapsing relative to last period. Threshold is −25%
  //    AND a non-trivial volume — small absolute drops on tiny weeks
  //    triggering an alarm would be noise.
  if (
    outputsDelta !== null &&
    outputsDelta <= -25 &&
    data.velocityOutputs.lastPeriod >= 5
  ) {
    return {
      tone: 'caution',
      text: `Output volume dropped ${Math.abs(outputsDelta)}% vs ${priorPhrase} — only ${outputsThisPeriod} ${periodPhrase}.`,
    }
  }

  // 3. Strong positive momentum on either input or output side.
  if (outputsDelta !== null && outputsDelta >= 25 && outputsThisPeriod >= 5) {
    return {
      tone: 'positive',
      text: `Outputs up ${outputsDelta}% vs ${priorPhrase} — ${outputsThisPeriod} drafts ${periodPhrase}.`,
    }
  }
  if (importsDelta !== null && importsDelta >= 25 && importsThisPeriod >= 2) {
    return {
      tone: 'positive',
      text: `Imports up ${importsDelta}% vs ${priorPhrase} — ${importsThisPeriod} new ${importsThisPeriod === 1 ? 'recording' : 'recordings'} ${periodPhrase}.`,
    }
  }

  // 4. Approval-rate achievement. ≥80% with at least 10 reviewed
  //    drafts is the threshold where the rate is statistically
  //    interesting rather than "1 of 1 = 100%".
  if (approval >= 80 && movedPastDraft >= 10) {
    return {
      tone: 'positive',
      text: `${approval}% approval rate across ${movedPastDraft} reviewed drafts — quality is on track.`,
    }
  }

  // 5. Quiet period: no imports AND no outputs in the selected range.
  if (importsThisPeriod === 0 && outputsThisPeriod === 0) {
    return {
      tone: 'neutral',
      text: `No new activity ${periodPhrase} — drop a recording in to keep the pipeline moving.`,
    }
  }

  // 6. Neutral default. Surface whatever's true, no value judgement.
  const parts: string[] = []
  if (importsThisPeriod > 0) {
    parts.push(`${importsThisPeriod} ${importsThisPeriod === 1 ? 'recording' : 'recordings'} imported`)
  }
  if (outputsThisPeriod > 0) {
    parts.push(`${outputsThisPeriod} ${outputsThisPeriod === 1 ? 'draft' : 'drafts'} generated`)
  }
  if (parts.length === 0) {
    return { tone: 'neutral', text: `Steady ${periodPhrase}.` }
  }
  return { tone: 'neutral', text: `${parts.join(' · ')} ${periodPhrase}.` }
}
