import type { ContentStatus } from '@/lib/supabase/types'
import type { ContentItemListRow } from '@/lib/content/get-content-items'

/**
 * Predicate: this item is currently in flight (upload running or
 * transcription happening). Show it on the Recent-Imports-Strip
 * regardless of age.
 */
export function isActiveImport(status: ContentStatus): boolean {
  return status === 'uploading' || status === 'processing'
}

/**
 * Predicate: this terminal item (ready/failed) just finished within
 * the last `freshWindowMs` and should still be shown on the strip
 * as a "just landed" badge so the user sees the result. After the
 * window the strip drops it (the regular Library list still has it).
 */
const FRESH_WINDOW_MS = 30 * 60 * 1000 // 30 minutes

export function isFreshTerminal(
  item: Pick<ContentItemListRow, 'status' | 'created_at'>,
  now = Date.now(),
): boolean {
  if (item.status !== 'ready' && item.status !== 'failed') return false
  const created = new Date(item.created_at).getTime()
  if (Number.isNaN(created)) return false
  return now - created < FRESH_WINDOW_MS
}

export interface RecentImportsBucket {
  active: ContentItemListRow[]
  freshTerminal: ContentItemListRow[]
}

/**
 * Splits an items list into the two buckets the strip cares about.
 * Active items are unbounded — if 8 are processing in parallel, all
 * 8 should be visible. Fresh terminals are capped because we only
 * want a glimpse of what just landed, not a full history.
 */
export function bucketRecentImports(
  items: ContentItemListRow[],
  options: { freshTerminalLimit?: number } = {},
): RecentImportsBucket {
  const freshTerminalLimit = options.freshTerminalLimit ?? 2
  const now = Date.now()
  const active: ContentItemListRow[] = []
  const freshTerminal: ContentItemListRow[] = []
  for (const item of items) {
    if (isActiveImport(item.status)) {
      active.push(item)
    } else if (isFreshTerminal(item, now) && freshTerminal.length < freshTerminalLimit) {
      freshTerminal.push(item)
    }
  }
  return { active, freshTerminal }
}
