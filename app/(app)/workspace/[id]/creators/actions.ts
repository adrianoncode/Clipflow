'use server'

import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { searchYouTubeCreators } from '@/lib/creators/search-youtube'
import { lookupCreator, searchTikTok, type Platform } from '@/lib/creators/scrapecreators'
import { scrapeTikTokProfile } from '@/lib/creators/scrape-tiktok'
import { scrapeInstagramProfile } from '@/lib/creators/scrape-instagram'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

type SearchResult =
  | { ok?: undefined }
  | { ok: true; results: { platform: string; creators: Array<Record<string, unknown>> } }
  | { ok: false; error: string }

const HAS_SCRAPECREATORS = !!process.env.SCRAPECREATORS_API_KEY

export async function searchCreatorsAction(
  _prev: SearchResult,
  formData: FormData,
): Promise<SearchResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const query = formData.get('query')?.toString()?.trim() ?? ''
  const platform = formData.get('platform')?.toString() ?? 'youtube'

  if (!query) return { ok: false, error: 'Enter a search term or username.' }

  // Creators searches hit external scrapers (ScrapeCreators) + YouTube API —
  // rate-limit per user since this is not strictly workspace-scoped.
  const rlResult = await checkRateLimit(
    `creators:user:${user.id}`,
    RATE_LIMITS.research.limit,
    RATE_LIMITS.research.windowMs,
  )
  if (!rlResult.ok) {
    return { ok: false, error: 'Search rate limit reached. Please wait and try again.' }
  }

  // YouTube: always official API
  if (platform === 'youtube') {
    const res = await searchYouTubeCreators({ query, maxResults: 15 })
    if (!res.ok) return { ok: false, error: res.error }
    return { ok: true, results: { platform, creators: res.creators as unknown as Array<Record<string, unknown>> } }
  }

  // ScrapeCreators API available → use it
  if (HAS_SCRAPECREATORS) {
    // TikTok keyword search
    if (platform === 'tiktok' && !query.startsWith('@')) {
      const res = await searchTikTok(query)
      if (res.ok) {
        const users = ((res.data as unknown as Record<string, unknown>).users ?? []) as Array<Record<string, unknown>>
        return { ok: true, results: { platform, creators: users } }
      }
    }

    // Single profile lookup
    const res = await lookupCreator(platform as Platform, query)
    if (res.ok) {
      return { ok: true, results: { platform, creators: [res.creator as unknown as Record<string, unknown>] } }
    }
  }

  // Fallback: our own scrapers
  if (platform === 'tiktok') {
    const res = await scrapeTikTokProfile(query)
    if (!res.ok) return { ok: false, error: res.error }
    return { ok: true, results: { platform, creators: [res.profile as unknown as Record<string, unknown>] } }
  }

  if (platform === 'instagram') {
    const res = await scrapeInstagramProfile(query)
    if (!res.ok) return { ok: false, error: res.error }
    return { ok: true, results: { platform, creators: [res.profile as unknown as Record<string, unknown>] } }
  }

  if (platform === 'twitter' || platform === 'linkedin') {
    return { ok: false, error: `${platform} search requires ScrapeCreators API key. Add SCRAPECREATORS_API_KEY to env.` }
  }

  return { ok: false, error: 'Unsupported platform.' }
}
