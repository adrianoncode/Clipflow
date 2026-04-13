import 'server-only'

export interface YouTubeCreator {
  channelId: string
  name: string
  description: string
  thumbnail: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  customUrl: string | null
}

/**
 * Search YouTube channels by keyword using the YouTube Data API v3.
 */
export async function searchYouTubeCreators(params: {
  query: string
  maxResults?: number
  apiKey?: string
}): Promise<{ ok: true; creators: YouTubeCreator[] } | { ok: false; error: string }> {
  const key = params.apiKey || process.env.GOOGLE_API_KEY
  if (!key) return { ok: false, error: 'Google API key not configured.' }

  try {
    // Step 1: Search for channels
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('type', 'channel')
    searchUrl.searchParams.set('q', params.query)
    searchUrl.searchParams.set('maxResults', String(params.maxResults ?? 20))
    searchUrl.searchParams.set('key', key)

    const searchRes = await fetch(searchUrl.toString(), { cache: 'no-store' })
    if (!searchRes.ok) return { ok: false, error: `YouTube search error ${searchRes.status}` }

    const searchData = await searchRes.json() as {
      items?: Array<{ snippet?: { channelId?: string; title?: string; description?: string; thumbnails?: { medium?: { url?: string } } } }>
    }

    const channelIds = (searchData.items ?? [])
      .map((i) => i.snippet?.channelId)
      .filter(Boolean) as string[]

    if (channelIds.length === 0) return { ok: true, creators: [] }

    // Step 2: Get channel statistics
    const statsUrl = new URL('https://www.googleapis.com/youtube/v3/channels')
    statsUrl.searchParams.set('part', 'snippet,statistics')
    statsUrl.searchParams.set('id', channelIds.join(','))
    statsUrl.searchParams.set('key', key)

    const statsRes = await fetch(statsUrl.toString(), { cache: 'no-store' })
    if (!statsRes.ok) return { ok: false, error: `YouTube stats error ${statsRes.status}` }

    const statsData = await statsRes.json() as {
      items?: Array<{
        id?: string
        snippet?: { title?: string; description?: string; customUrl?: string; thumbnails?: { medium?: { url?: string } } }
        statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string }
      }>
    }

    const creators: YouTubeCreator[] = (statsData.items ?? []).map((ch) => ({
      channelId: ch.id ?? '',
      name: ch.snippet?.title ?? '',
      description: (ch.snippet?.description ?? '').slice(0, 200),
      thumbnail: ch.snippet?.thumbnails?.medium?.url ?? '',
      subscriberCount: parseInt(ch.statistics?.subscriberCount ?? '0', 10),
      videoCount: parseInt(ch.statistics?.videoCount ?? '0', 10),
      viewCount: parseInt(ch.statistics?.viewCount ?? '0', 10),
      customUrl: ch.snippet?.customUrl ?? null,
    }))

    // Sort by subscriber count descending
    creators.sort((a, b) => b.subscriberCount - a.subscriberCount)

    return { ok: true, creators }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Search failed' }
  }
}
