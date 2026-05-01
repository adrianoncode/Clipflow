import 'server-only'
import { readBoundedText } from '@/lib/security/bounded-fetch'
import { isPublicUrl } from '@/lib/security/is-public-url'

/** 5 MB cap on RSS feed bodies. The largest legitimate podcast feeds
 *  (1000+ episodes with descriptions) sit well below 2 MB; anything
 *  bigger is either misbehaving or hostile. */
const MAX_BYTES = 5 * 1024 * 1024

export interface RssEpisode {
  title: string
  text: string
  audioUrl: string | null
  /** Stable identifier from the feed item — prefers <guid>, falls back
   *  to <pubDate>, else the title. Used by the auto-poll cron to detect
   *  new episodes without re-importing old ones. */
  guid: string
  pubDate: string | null
}

export type RssFetchResult =
  | {
      ok: true
      title: string
      text: string
      episodeTitle: string
      audioUrl: string | null
    }
  | { ok: false; error: string }

export type RssFetchAllResult =
  | { ok: true; channelTitle: string; episodes: RssEpisode[] }
  | { ok: false; error: string }

/**
 * Fetches a podcast RSS feed and extracts the latest episode's
 * title + description/summary as text content.
 * If an audio enclosure URL is found it is returned for optional transcription.
 */
export async function fetchRssFeed(url: string): Promise<RssFetchResult> {
  // SSRF guard — block loopback, private IPs, cloud metadata endpoints.
  const check = await isPublicUrl(url)
  if (!check.ok) return { ok: false, error: check.reason }

  let res: Response
  try {
    res = await fetch(check.url.toString(), {
      headers: { 'User-Agent': 'Clipflow/1.0 (+https://clipflow.to)' },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return { ok: false, error: 'Could not fetch the RSS feed. Check the URL and try again.' }
  }

  if (!res.ok) {
    return { ok: false, error: `RSS feed returned HTTP ${res.status}.` }
  }

  const bounded = await readBoundedText(res, MAX_BYTES)
  if (!bounded.ok) return { ok: false, error: bounded.error }
  const xml = bounded.text

  // Extract channel title
  const channelTitle =
    xml
      .match(/<channel[^>]*>[\s\S]*?<title[^>]*>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*<\/title>/)?.[1]
      ?.trim() ?? 'Podcast'

  // Find first <item>
  const itemMatch = xml.match(/<item[\s\S]*?<\/item>/)
  if (!itemMatch) {
    return { ok: false, error: 'No episodes found in this RSS feed.' }
  }
  const item = itemMatch[0]

  const episodeTitle =
    item
      .match(/<title[^>]*>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*<\/title>/)?.[1]
      ?.trim() ?? 'Episode'

  // Audio URL from enclosure tag
  const audioUrl = item.match(/<enclosure[^>]+url=["']([^"']+)["']/)?.[1] ?? null

  // Description / summary
  const desc =
    item.match(/<description[^>]*>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/description>/)?.[1] ??
    item.match(/<itunes:summary[^>]*>([\s\S]*?)<\/itunes:summary>/)?.[1] ??
    ''

  // Strip HTML tags
  const text = desc
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50_000)

  if (text.length < 50 && !audioUrl) {
    return { ok: false, error: 'Episode has no usable text content and no audio file.' }
  }

  return {
    ok: true,
    title: channelTitle,
    episodeTitle,
    text:
      text.length > 0
        ? text
        : `[Audio episode: ${episodeTitle}. No transcript in feed — add an OpenAI key to transcribe.]`,
    audioUrl,
  }
}

/**
 * Same fetch + parse path as `fetchRssFeed`, but returns every episode
 * in the feed (newest first) instead of just the latest. Used by the
 * auto-poll cron to diff against the last-seen guid and import only
 * genuinely new episodes.
 */
export async function fetchRssFeedAll(url: string): Promise<RssFetchAllResult> {
  const check = await isPublicUrl(url)
  if (!check.ok) return { ok: false, error: check.reason }

  let res: Response
  try {
    res = await fetch(check.url.toString(), {
      headers: { 'User-Agent': 'Clipflow/1.0 (+https://clipflow.to)' },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return { ok: false, error: 'Could not fetch the RSS feed.' }
  }

  if (!res.ok) return { ok: false, error: `RSS feed returned HTTP ${res.status}.` }

  const bounded = await readBoundedText(res, MAX_BYTES)
  if (!bounded.ok) return { ok: false, error: bounded.error }
  const xml = bounded.text

  const channelTitle =
    xml
      .match(/<channel[^>]*>[\s\S]*?<title[^>]*>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*<\/title>/)?.[1]
      ?.trim() ?? 'Podcast'

  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/g) ?? []
  const episodes: RssEpisode[] = itemMatches.map((item) => {
    const title =
      item
        .match(/<title[^>]*>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*<\/title>/)?.[1]
        ?.trim() ?? 'Episode'
    const audioUrl = item.match(/<enclosure[^>]+url=["']([^"']+)["']/)?.[1] ?? null
    const guidRaw =
      item.match(/<guid[^>]*>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*<\/guid>/)?.[1]?.trim() ?? ''
    const pubDate =
      item.match(/<pubDate[^>]*>\s*(.*?)\s*<\/pubDate>/)?.[1]?.trim() ?? null
    const guid = guidRaw || pubDate || title
    const desc =
      item.match(/<description[^>]*>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/description>/)?.[1] ??
      item.match(/<itunes:summary[^>]*>([\s\S]*?)<\/itunes:summary>/)?.[1] ??
      ''
    const text = desc
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50_000)
    return {
      title,
      text:
        text.length > 0
          ? text
          : `[Audio episode: ${title}. No transcript in feed.]`,
      audioUrl,
      guid,
      pubDate,
    }
  })

  if (episodes.length === 0) {
    return { ok: false, error: 'No episodes found in this RSS feed.' }
  }

  return { ok: true, channelTitle, episodes }
}
