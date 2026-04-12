import 'server-only'

export type RssFetchResult =
  | {
      ok: true
      title: string
      text: string
      episodeTitle: string
      audioUrl: string | null
    }
  | { ok: false; error: string }

/**
 * Fetches a podcast RSS feed and extracts the latest episode's
 * title + description/summary as text content.
 * If an audio enclosure URL is found it is returned for optional transcription.
 */
export async function fetchRssFeed(url: string): Promise<RssFetchResult> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'Clipflow/1.0 (+https://clipflow.io)' },
      next: { revalidate: 0 },
    })
  } catch {
    return { ok: false, error: 'Could not fetch the RSS feed. Check the URL and try again.' }
  }

  if (!res.ok) {
    return { ok: false, error: `RSS feed returned HTTP ${res.status}.` }
  }

  const xml = await res.text()

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
