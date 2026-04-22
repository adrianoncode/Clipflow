import 'server-only'

import { submitRender, type CaptionStyle } from '@/lib/video/shotstack-render'
import type { WordTiming } from '@/lib/highlights/detect-viral-moments'

/**
 * Groups Whisper word-timings into 2-3 word caption "chunks" that flip
 * in sync with speech. TikTok/Reels-style karaoke captions show 1-3
 * words at a time — never a whole sentence — so the viewer's eye can
 * catch up at reading speed.
 *
 * Chunking rule:
 *  - up to 3 words per chunk
 *  - force a break on sentence-ending punctuation (. ? !)
 *  - force a break if the gap between words >= 0.6 s (natural pause)
 *  - never emit a chunk longer than 2.0 s
 */
function chunkWordsForCaptions(
  words: WordTiming[],
  clipStartSeconds: number,
  clipEndSeconds: number,
): Array<{ text: string; start: number; length: number }> {
  // Filter to words inside the clip window + a tiny head/tail slop
  const inClip = words.filter(
    (w) => w.end > clipStartSeconds - 0.05 && w.start < clipEndSeconds + 0.05,
  )

  const chunks: Array<{ text: string; start: number; length: number }> = []
  let buffer: WordTiming[] = []

  function flush() {
    if (buffer.length === 0) return
    const first = buffer[0]!
    const last = buffer[buffer.length - 1]!
    // Offset relative to clip start — Shotstack timeline is 0-based.
    const start = Math.max(first.start - clipStartSeconds, 0)
    const end = Math.min(last.end - clipStartSeconds, clipEndSeconds - clipStartSeconds)
    const length = Math.max(end - start, 0.3)
    const text = buffer
      .map((w) => w.word)
      .join(' ')
      .replace(/\s+([.,!?;:])/g, '$1') // tighten punctuation spacing
      .trim()
    if (text) chunks.push({ text, start, length })
    buffer = []
  }

  for (let i = 0; i < inClip.length; i++) {
    const w = inClip[i]!
    const prev = buffer[buffer.length - 1]
    const bufferDuration = prev ? w.end - buffer[0]!.start : 0
    const gapFromPrev = prev ? w.start - prev.end : 0

    // Flush before appending if adding this word would break a rule
    if (
      buffer.length >= 3 ||
      bufferDuration > 2.0 ||
      (prev && gapFromPrev >= 0.6)
    ) {
      flush()
    }

    buffer.push(w)

    // Flush after if punctuation closes a sentence.
    if (/[.?!]$/.test(w.word.trim())) {
      flush()
    }
  }
  flush()

  return chunks
}

/**
 * Builds and submits a Shotstack render for a single highlight clip.
 *
 * Render anatomy (bottom → top in Shotstack track order):
 *   Track 1: trimmed source video, cropped/fit to 9:16
 *   Track 2: karaoke captions (word-chunk burn-ins)
 *   Track 3: hook overlay (first 2.5s only)
 *
 * The source video is trimmed via the `#t=` fragment the way
 * clipVideo() already does — Shotstack honours it for HTTP-streamed
 * sources. We compute `length` as (end - start).
 */
export async function renderHighlightClip(params: {
  workspaceId: string
  sourceVideoUrl: string
  clipStartSeconds: number
  clipEndSeconds: number
  hookText?: string | null
  wordTimings?: WordTiming[] | null
  fallbackSubtitleText?: string | null
  captionStyle?: CaptionStyle
  aspectRatio?: '9:16' | '16:9' | '1:1'
  priority?: 'normal' | 'high'
}): Promise<{ ok: true; renderId: string } | { ok: false; error: string }> {
  const {
    workspaceId,
    sourceVideoUrl,
    clipStartSeconds,
    clipEndSeconds,
    hookText,
    wordTimings,
    fallbackSubtitleText,
    captionStyle = 'tiktok-bold',
    aspectRatio = '9:16',
    priority = 'normal',
  } = params

  const duration = clipEndSeconds - clipStartSeconds
  if (duration <= 0) {
    return { ok: false, error: 'Clip end must be after start.' }
  }
  if (duration > 180) {
    return { ok: false, error: 'Highlight clips cap at 3 minutes.' }
  }

  // Build karaoke captions if we have word timings. If not, fall back
  // to a single caption painted across the clip (better than silent).
  let subtitles: Array<{ text: string; start: number; length: number }> = []
  if (wordTimings && wordTimings.length > 0) {
    subtitles = chunkWordsForCaptions(wordTimings, clipStartSeconds, clipEndSeconds)
  } else if (fallbackSubtitleText?.trim()) {
    subtitles = [
      {
        text: fallbackSubtitleText.trim().slice(0, 120),
        start: 0,
        length: duration,
      },
    ]
  }

  // Source video — trimmed in place via #t= fragment. Shotstack reads
  // the start offset from there and we dictate output length via
  // `length`. `fit: 'cover'` + 9:16 output gives us a center-crop
  // automatically (no explicit position needed for most podcast
  // framings where the speaker sits near center).
  return submitRender({
    workspaceId,
    aspectRatio,
    captionStyle,
    priority,
    resolution: '1080',
    hookText: hookText?.trim() || undefined,
    clips: [
      {
        type: 'video',
        src: `${sourceVideoUrl}#t=${clipStartSeconds.toFixed(2)}`,
        start: 0,
        length: duration,
        fit: 'cover',
      },
    ],
    subtitles,
  })
}
