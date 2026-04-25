'use client'

/**
 * Per-user reading progress for Playbook guides. Local-storage only —
 * no account or server round-trip. The sidebar shows checkmarks for
 * read guides; the guide page marks itself read after the user
 * scrolls past 80%.
 *
 * Storage shape: { ids: string[] } under the key below. Cross-tab
 * sync is via the `storage` event; in-tab sync is via a custom
 * window event so pages don't have to re-render on a poll.
 */

const STORAGE_KEY = 'clipflow.playbook.read'
const EVENT = 'clipflow:playbook-progress'

export function getReadGuides(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { ids?: unknown }
    if (!Array.isArray(parsed.ids)) return new Set()
    return new Set(parsed.ids.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

export function markGuideRead(guideId: string): void {
  if (typeof window === 'undefined') return
  const ids = getReadGuides()
  if (ids.has(guideId)) return
  ids.add(guideId)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: Array.from(ids) }))
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch { /* quota / disabled — silent */ }
}

export function clearReadGuides(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(EVENT))
  } catch { /* ignore */ }
}
