import 'server-only'

interface YouTubeComment {
  text: string
  likeCount: number
  authorName: string
}

/**
 * Fetches top comments from a YouTube video using the Data API v3.
 * Uses GOOGLE_API_KEY env var or falls back to a user-provided key.
 */
export async function fetchYoutubeComments(
  videoId: string,
  apiKey?: string,
  maxResults: number = 100,
): Promise<{ ok: true; comments: YouTubeComment[] } | { ok: false; error: string }> {
  const key = apiKey || process.env.GOOGLE_API_KEY
  if (!key) {
    return { ok: false, error: 'Google API key not configured. Add GOOGLE_API_KEY to environment variables.' }
  }

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads')
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('videoId', videoId)
    url.searchParams.set('maxResults', String(Math.min(maxResults, 100)))
    url.searchParams.set('order', 'relevance')
    url.searchParams.set('textFormat', 'plainText')
    url.searchParams.set('key', key)

    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `YouTube API error ${res.status}: ${err.slice(0, 200)}` }
    }

    const data = await res.json() as {
      items?: Array<{
        snippet?: {
          topLevelComment?: {
            snippet?: {
              textDisplay?: string
              likeCount?: number
              authorDisplayName?: string
            }
          }
        }
      }>
    }

    const comments: YouTubeComment[] = (data.items ?? [])
      .map((item) => {
        const s = item.snippet?.topLevelComment?.snippet
        return {
          text: s?.textDisplay ?? '',
          likeCount: s?.likeCount ?? 0,
          authorName: s?.authorDisplayName ?? 'Anonymous',
        }
      })
      .filter((c) => c.text.length > 0)

    return { ok: true, comments }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to fetch comments' }
  }
}

/**
 * Extracts video ID from various YouTube URL formats.
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const match = url.match(p)
    if (match?.[1]) return match[1]
  }
  return null
}
