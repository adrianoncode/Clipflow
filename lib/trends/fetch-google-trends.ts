import 'server-only'

export interface TrendItem {
  title: string
  description: string | null
  url: string | null
  source: 'google_trends' | 'youtube'
}

export async function fetchGoogleTrends(geo = 'US'): Promise<TrendItem[]> {
  try {
    const res = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
      { next: { revalidate: 3600 } } // cache for 1 hour
    )
    if (!res.ok) return []
    const xml = await res.text()

    // Parse RSS XML manually (no xml parser library needed)
    const items: TrendItem[] = []
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

    for (const match of itemMatches) {
      const itemXml = match[1] ?? ''
      const title =
        itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        itemXml.match(/<title>(.*?)<\/title>/)?.[1] ||
        null
      const desc =
        itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
        itemXml.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/)?.[1] ||
        null
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || null

      if (title) {
        items.push({
          title: title.trim(),
          description: desc?.trim() || null,
          url: link,
          source: 'google_trends',
        })
      }
      if (items.length >= 20) break
    }

    return items
  } catch {
    return []
  }
}
