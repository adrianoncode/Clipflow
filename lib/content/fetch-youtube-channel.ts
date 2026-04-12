import 'server-only'

export interface YoutubeChannelVideo {
  videoId: string
  title: string
  publishedAt: string
  url: string
}

export type FetchChannelResult =
  | { ok: true; channelName: string; videos: YoutubeChannelVideo[] }
  | { ok: false; error: string }

/**
 * Extracts the YouTube channel ID from various URL formats:
 * - https://www.youtube.com/channel/UCxxxxxx
 * - https://www.youtube.com/@handle
 * - https://www.youtube.com/c/channelname
 * - https://www.youtube.com/user/username
 */
export function extractChannelId(url: string): string | null {
  const channelMatch = url.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/)
  if (channelMatch?.[1]) return channelMatch[1]
  return null
}

/**
 * Resolves a YouTube handle/custom URL to a channel ID via the RSS feed.
 * YouTube exposes an RSS feed for any channel at:
 * https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxx
 *
 * For handles (@name) and custom URLs, we first load the channel page to
 * extract the channel ID from the page source.
 */
async function resolveChannelId(url: string): Promise<string | null> {
  // Direct channel ID in URL
  const direct = extractChannelId(url)
  if (direct) return direct

  // For @handles, /c/, /user/ — scrape the channel page for the ID
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Clipflow/1.0)' },
    })
    if (!res.ok) return null
    const html = await res.text()
    // YouTube embeds the channel ID in multiple places
    const match =
      html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/) ??
      html.match(/channel\/(UC[a-zA-Z0-9_-]+)/)
    return match?.[1] ?? null

  } catch {
    return null
  }
}

/**
 * Fetches the latest videos from a YouTube channel via the public RSS feed.
 * Returns up to 15 most recent videos.
 */
export async function fetchYoutubeChannel(url: string): Promise<FetchChannelResult> {
  const channelId = await resolveChannelId(url)
  if (!channelId) {
    return {
      ok: false,
      error: 'Could not find a YouTube channel at this URL. Try using the /channel/UCxxxxxxx format.',
    }
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

  let res: Response
  try {
    res = await fetch(feedUrl, { next: { revalidate: 0 } })
  } catch {
    return { ok: false, error: 'Could not fetch the YouTube channel feed.' }
  }

  if (!res.ok) {
    return { ok: false, error: `YouTube feed returned HTTP ${res.status}.` }
  }

  const xml = await res.text()

  const channelName =
    xml.match(/<title>(.*?)<\/title>/)?.[1]?.trim() ?? 'YouTube Channel'

  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]

  const videos: YoutubeChannelVideo[] = entries.slice(0, 15).map((m) => {
    const entry = m[1] ?? ''
    const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? ''
    const title = entry.match(/<title>(.*?)<\/title>/)?.[1]?.trim() ?? 'Untitled'
    const publishedAt = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? ''
    return {
      videoId,
      title,
      publishedAt,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    }
  })

  return { ok: true, channelName, videos }
}
