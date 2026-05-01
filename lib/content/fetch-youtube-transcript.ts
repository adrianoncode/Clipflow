import 'server-only'

import { YoutubeTranscript } from 'youtube-transcript'

export type FetchYoutubeTranscriptResult =
  | { ok: true; transcript: string; title: string }
  | { ok: false; error: string }

/**
 * Extracts the video ID from common YouTube URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 */
// Whitelist of hostnames YouTube actually serves from. The previous
// `.includes('youtube.com')` matched `youtube.com.attacker.tld` and
// other lookalikes — not an SSRF (the transcript library still hits
// the real YouTube), but it would persist `source_url` as a tampered
// link and confuse audit/dedupe logic.
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
])

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('?')[0] ?? null
    }
    if (YOUTUBE_HOSTS.has(u.hostname)) {
      const v = u.searchParams.get('v')
      if (v) return v
      // Shorts: /shorts/VIDEO_ID
      const parts = u.pathname.split('/')
      const shortsIdx = parts.indexOf('shorts')
      if (shortsIdx !== -1) return parts[shortsIdx + 1] ?? null
    }
  } catch {
    // Not a valid URL — try bare video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
  }
  return null
}

/**
 * Fetches the transcript (captions) for a YouTube video.
 * Works with videos that have auto-generated or manual captions.
 * No API key required — uses YouTube's public timedtext endpoint.
 */
export async function fetchYoutubeTranscript(
  url: string,
): Promise<FetchYoutubeTranscriptResult> {
  const videoId = extractVideoId(url.trim())
  if (!videoId) {
    return { ok: false, error: 'Could not extract a video ID from this URL.' }
  }

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId)
    if (!segments || segments.length === 0) {
      return {
        ok: false,
        error: 'No captions found for this video. Make sure captions are enabled.',
      }
    }

    const transcript = segments
      .map((s) => s.text.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Use the video ID as a fallback title; the action will clean this up.
    const title = `YouTube — ${videoId}`
    return { ok: true, transcript, title }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('disabled') || msg.includes('No transcripts')) {
      return {
        ok: false,
        error: 'Captions are disabled for this video. Try a video with captions enabled.',
      }
    }
    return { ok: false, error: 'Could not fetch transcript. Check the URL and try again.' }
  }
}
