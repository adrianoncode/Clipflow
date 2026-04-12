import 'server-only'

/**
 * Takes an array of content items (with id, title, source_url)
 * Returns a Set of content item IDs that are likely duplicates.
 *
 * Algorithm:
 * 1. Group by source_url (if source_url matches and is not null → duplicates)
 * 2. Normalize titles (lowercase, strip punctuation, trim)
 * 3. If normalized titles are identical → duplicate
 */
export function findDuplicateIds(
  items: Array<{ id: string; title: string | null; source_url?: string | null }>,
): Set<string> {
  const duplicateIds = new Set<string>()

  // URL-based duplicates
  const urlGroups: Record<string, string[]> = {}
  for (const item of items) {
    if (item.source_url) {
      if (!urlGroups[item.source_url]) urlGroups[item.source_url] = []
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      urlGroups[item.source_url]!.push(item.id)
    }
  }
  for (const ids of Object.values(urlGroups)) {
    if (ids.length > 1) ids.forEach((id) => duplicateIds.add(id))
  }

  // Title-based duplicates
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  const titleGroups: Record<string, string[]> = {}
  for (const item of items) {
    if (item.title) {
      const key = normalize(item.title)
      if (key.length > 5) {
        if (!titleGroups[key]) titleGroups[key] = []
        titleGroups[key].push(item.id)
      }
    }
  }
  for (const ids of Object.values(titleGroups)) {
    if (ids.length > 1) ids.forEach((id) => duplicateIds.add(id))
  }

  return duplicateIds
}
