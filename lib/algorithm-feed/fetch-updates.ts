import 'server-only'

import { ALGORITHM_FEED_SOURCES } from './sources'
import { isPublicUrl } from '@/lib/security/is-public-url'

export interface RawFeedItem {
  source: string
  title: string
  url: string
  description: string
  platforms: string[]
  publishedAt: string | null
}

/**
 * Fetches RSS feeds from all algorithm update sources.
 * Parses XML manually (same pattern as Google Trends fetcher).
 */
export async function fetchAlgorithmUpdates(): Promise<RawFeedItem[]> {
  const items: RawFeedItem[] = []

  for (const source of ALGORITHM_FEED_SOURCES) {
    try {
      // SSRF guard — our own feed sources are trusted, but we still
      // validate in case an admin later adds a user-supplied source.
      const check = await isPublicUrl(source.url)
      if (!check.ok) continue
      const res = await fetch(check.url.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10000) })
      if (!res.ok) continue

      const xml = await res.text()

      // Simple XML item extraction (no external parser needed)
      const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ?? []

      for (const itemXml of itemMatches.slice(0, 5)) {
        const title = extractTag(itemXml, 'title')
        const link = extractTag(itemXml, 'link')
        const description = extractTag(itemXml, 'description')
        const pubDate = extractTag(itemXml, 'pubDate')

        if (!title || !link) continue

        // Filter: only include items that mention algorithm/platform keywords
        const lower = (title + ' ' + description).toLowerCase()
        const isRelevant = [
          'algorithm', 'update', 'change', 'ranking', 'reach', 'engagement',
          'tiktok', 'instagram', 'reels', 'shorts', 'linkedin', 'youtube',
          'content strategy', 'feed', 'recommendation',
        ].some((kw) => lower.includes(kw))

        if (!isRelevant) continue

        items.push({
          source: source.name,
          title: cleanHtml(title),
          url: link,
          description: cleanHtml(description ?? '').slice(0, 500),
          platforms: [...source.platforms],
          publishedAt: pubDate ?? null,
        })
      }
    } catch {
      // Skip failed feeds silently
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'))
  return match?.[1] ?? match?.[2] ?? null
}

function cleanHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
}
