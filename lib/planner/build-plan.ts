import 'server-only'

import {
  BEST_TIMES_BY_PLATFORM,
  DEFAULT_CADENCE_PER_WEEK,
  type BestTimeSlot,
} from '@/lib/planner/best-time-defaults'
import type { OutputPlatform } from '@/lib/platforms'

/**
 * Plan builder — turns approved drafts + brand context (+ optional
 * history later in slice B) into a one-week post schedule.
 *
 * The first pass picks slots from the per-platform best-time
 * defaults, capped by each platform's cadence. The second pass — an
 * LLM call — re-orders + re-explains the slots given the user's
 * niche, tone, and brand context. The shape returned to the UI is
 * the LLM's output, validated against a Zod schema and merged with
 * the original draft id so the schedule action knows what to commit.
 */

export interface ApprovedDraftPreview {
  id: string
  platform: OutputPlatform
  hook: string
  caption_preview: string
  tags: string[]
  created_at: string
}

export interface BrandContext {
  niche: string | null
  tone: string | null
  /** Per-platform cadence overrides (posts per week). Optional. */
  cadence?: Partial<Record<OutputPlatform, number>>
  /** Workspace timezone string ("Europe/Berlin"). UTC fallback. */
  timezone: string
}

export interface PlanSlot {
  /** ISO date in workspace TZ (YYYY-MM-DD). */
  date: string
  /** 24h time, HH:MM. */
  time: string
  platform: OutputPlatform
  draftId: string | null
  /** Display title, derived from the matched draft's hook. */
  draftTitle: string | null
  /** Why this slot — used for the tooltip + reason chip in the UI. */
  reason: string
  /** True when this slot is from cold-start defaults rather than the
   *  user's measured performance. UI shows a different chip color. */
  fromDefaults: boolean
}

export interface BuildPlanInput {
  weekStarting: Date
  drafts: ApprovedDraftPreview[]
  brand: BrandContext
}

export interface BuildPlanResult {
  slots: PlanSlot[]
  generatedAt: string
}

/**
 * Compute the candidate slots for the upcoming week. Picks from the
 * per-platform best-time defaults and stops when each platform hits
 * its cadence cap. Never schedules two slots within 90 minutes of
 * each other to avoid bursty calendars.
 */
export function pickCandidateSlots(
  weekStarting: Date,
  brand: BrandContext,
  drafts: ApprovedDraftPreview[],
): Array<{
  date: string
  time: string
  platform: OutputPlatform
  rationale: string
}> {
  // Group drafts by platform to know which platforms are even worth
  // pulling slots for — no point suggesting Reels slots if the user
  // has zero approved Reels drafts.
  const draftsByPlatform = new Map<OutputPlatform, ApprovedDraftPreview[]>()
  for (const d of drafts) {
    const arr = draftsByPlatform.get(d.platform) ?? []
    arr.push(d)
    draftsByPlatform.set(d.platform, arr)
  }

  const slots: Array<{
    date: string
    time: string
    platform: OutputPlatform
    rationale: string
    timestamp: number
  }> = []

  for (const [platform, list] of draftsByPlatform.entries()) {
    if (list.length === 0) continue
    const cadenceCap = brand.cadence?.[platform] ?? DEFAULT_CADENCE_PER_WEEK[platform]
    const cap = Math.min(cadenceCap, list.length)
    if (cap <= 0) continue

    const candidates = BEST_TIMES_BY_PLATFORM[platform] ?? []
    const taken: BestTimeSlot[] = []
    for (const c of candidates) {
      if (taken.length >= cap) break
      // Skip if a slot less than 90 min away already taken on the
      // same day/platform — keeps a single platform from carpet-
      // bombing one window.
      const tooClose = taken.some(
        (t) =>
          t.dayOfWeek === c.dayOfWeek &&
          Math.abs(t.hour * 60 + t.minute - (c.hour * 60 + c.minute)) < 90,
      )
      if (tooClose) continue
      taken.push(c)
    }

    for (const t of taken) {
      const slotDate = nextDayOfWeek(weekStarting, t.dayOfWeek)
      slots.push({
        date: formatDate(slotDate),
        time: `${pad2(t.hour)}:${pad2(t.minute)}`,
        platform,
        rationale: t.rationale,
        timestamp: combinedTimestamp(slotDate, t.hour, t.minute),
      })
    }
  }

  // Sort chronologically so the UI can render in week-order.
  slots.sort((a, b) => a.timestamp - b.timestamp)
  return slots.map(({ timestamp: _, ...rest }) => rest)
}

/**
 * Match each candidate slot to a specific approved draft. First-pass
 * heuristic: round-robin through the drafts of the matching platform.
 * The LLM call refines this with brand-fit reasoning.
 */
export function attachDraftsToSlots(
  candidates: ReturnType<typeof pickCandidateSlots>,
  drafts: ApprovedDraftPreview[],
): PlanSlot[] {
  const draftsByPlatform = new Map<OutputPlatform, ApprovedDraftPreview[]>()
  for (const d of drafts) {
    const arr = draftsByPlatform.get(d.platform) ?? []
    arr.push(d)
    draftsByPlatform.set(d.platform, arr)
  }
  const cursors = new Map<OutputPlatform, number>()

  return candidates.map((c) => {
    const list = draftsByPlatform.get(c.platform) ?? []
    if (list.length === 0) {
      return {
        date: c.date,
        time: c.time,
        platform: c.platform,
        draftId: null,
        draftTitle: null,
        reason: c.rationale,
        fromDefaults: true,
      }
    }
    const cursor = cursors.get(c.platform) ?? 0
    const draft = list[cursor % list.length]!
    cursors.set(c.platform, cursor + 1)
    return {
      date: c.date,
      time: c.time,
      platform: c.platform,
      draftId: draft.id,
      draftTitle: draft.hook,
      reason: c.rationale,
      fromDefaults: true,
    }
  })
}

// ─── Helpers ───────────────────────────────────────────────────────────

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function nextDayOfWeek(weekStarting: Date, dayOfWeek: number): Date {
  // weekStarting is a Monday-anchored start of week. JS getDay()
  // returns 0=Sunday so we map: Sun(0)→6, Mon(1)→0, ..., Sat(6)→5.
  const startMondayBased = (weekStarting.getDay() + 6) % 7
  const targetMondayBased = (dayOfWeek + 6) % 7
  const offset = (targetMondayBased - startMondayBased + 7) % 7
  const out = new Date(weekStarting)
  out.setDate(out.getDate() + offset)
  return out
}

function combinedTimestamp(date: Date, hour: number, minute: number): number {
  const d = new Date(date)
  d.setHours(hour, minute, 0, 0)
  return d.getTime()
}
