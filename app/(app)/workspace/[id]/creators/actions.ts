'use server'

import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { searchYouTubeCreators } from '@/lib/creators/search-youtube'
import { scrapeTikTokProfile } from '@/lib/creators/scrape-tiktok'
import { scrapeInstagramProfile } from '@/lib/creators/scrape-instagram'

type SearchResult =
  | { ok?: undefined }
  | { ok: true; results: unknown }
  | { ok: false; error: string }

/**
 * Search creators across platforms.
 */
export async function searchCreatorsAction(
  _prev: SearchResult,
  formData: FormData,
): Promise<SearchResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const query = formData.get('query')?.toString()?.trim() ?? ''
  const platform = formData.get('platform')?.toString() ?? 'youtube'

  if (!query) return { ok: false, error: 'Enter a search term or username.' }

  switch (platform) {
    case 'youtube': {
      const res = await searchYouTubeCreators({ query, maxResults: 15 })
      if (!res.ok) return { ok: false, error: res.error }
      return { ok: true, results: { platform: 'youtube', creators: res.creators } }
    }

    case 'tiktok': {
      const res = await scrapeTikTokProfile(query)
      if (!res.ok) return { ok: false, error: res.error }
      return { ok: true, results: { platform: 'tiktok', creators: [res.profile] } }
    }

    case 'instagram': {
      const res = await scrapeInstagramProfile(query)
      if (!res.ok) return { ok: false, error: res.error }
      return { ok: true, results: { platform: 'instagram', creators: [res.profile] } }
    }

    default:
      return { ok: false, error: 'Unsupported platform.' }
  }
}
