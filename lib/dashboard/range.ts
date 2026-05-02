/**
 * Dashboard time-range vocabulary.
 *
 * Three windows that match what users mentally bucket:
 *   • "this week"     → 7d
 *   • "this month"    → 30d
 *   • "this quarter"  → 90d
 *
 * The values double as URL query params (`?range=30d`) so the
 * selection survives reload, share-link, and browser back/forward —
 * canonical state lives in the URL, not in client memory.
 */

export type DashboardRange = '7d' | '30d' | '90d'

export const ALL_RANGES: readonly DashboardRange[] = ['7d', '30d', '90d'] as const

const VALID_RANGES = new Set<DashboardRange>(ALL_RANGES)

/**
 * Parse a query-param value into a valid range, defaulting to 7d.
 * Anything unrecognised silently falls through — never throw, never
 * 404 a dashboard view because of a typo'd param.
 */
export function parseRange(input: string | string[] | undefined): DashboardRange {
  const v = Array.isArray(input) ? input[0] : input
  if (v && VALID_RANGES.has(v as DashboardRange)) return v as DashboardRange
  return '7d'
}

export function rangeToDays(range: DashboardRange): number {
  switch (range) {
    case '7d':
      return 7
    case '30d':
      return 30
    case '90d':
      return 90
  }
}

/**
 * Bucket strategy per range.
 *
 *   7d  → 7 daily bars (one per day, day-letter label)
 *   30d → 30 daily bars (no per-bar label, sparse marker every 5)
 *   90d → 13 weekly bars (one per ISO week, "W12" label)
 *
 * Returns whether to aggregate by week and how many buckets to expect.
 * Centralised here so both the analytics layer and the chart use the
 * same definitions — no drift between server-side bucketing and
 * client-side rendering.
 */
export interface BucketSpec {
  /** True when each bucket spans 7 days; false when each is 1 day. */
  weekly: boolean
  /** Total number of buckets, oldest first. */
  count: number
}

export function bucketSpec(range: DashboardRange): BucketSpec {
  if (range === '90d') return { weekly: true, count: 13 }
  return { weekly: false, count: rangeToDays(range) }
}

export const RANGE_LABELS: Record<DashboardRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
}

export const RANGE_SHORT_LABELS: Record<DashboardRange, string> = {
  '7d': '7d',
  '30d': '30d',
  '90d': '90d',
}
