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
  /**
   * Horizontal crop anchor in -0.5..0.5 (0 = center, -0.5 = far-left,
   * +0.5 = far-right). Shotstack `offset.x` uses the same convention.
   * Null = default center-crop.
   */
  cropX?: number | null
  /**
   * Phase A1 edits — user tweaks from the preview editor. All three
   * are optional; nulls revert to sensible defaults.
   *
   * customCaptionText: overrides the generated karaoke captions with
   * one painted line that runs the full clip. Useful when the AI
   * chunked badly or the user wants a custom pull-quote.
   *
   * audioGainDb: -20..+10 dB. Mapped into Shotstack volume 0..1.
   *
   * thumbnailSeconds: where to capture the poster frame. Null =
   * Shotstack default at 1.5s. User picks any second inside the clip.
   */
  customCaptionText?: string | null
  audioGainDb?: number | null
  thumbnailSeconds?: number | null
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
    cropX = null,
    customCaptionText = null,
    audioGainDb = null,
    thumbnailSeconds = null,
  } = params

  const duration = clipEndSeconds - clipStartSeconds
  if (duration <= 0) {
    return { ok: false, error: 'Clip end must be after start.' }
  }
  if (duration > 180) {
    return { ok: false, error: 'Highlight clips cap at 3 minutes.' }
  }

  // Build captions. Priority:
  //  1. customCaptionText (user override — one line the full clip)
  //  2. word-level karaoke chunks (default, needs word timings)
  //  3. single caption from plaintext transcript (fallback)
  let subtitles: Array<{ text: string; start: number; length: number }> = []
  if (customCaptionText?.trim()) {
    subtitles = [
      {
        text: customCaptionText.trim().slice(0, 500),
        start: 0,
        length: duration,
      },
    ]
  } else if (wordTimings && wordTimings.length > 0) {
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

  // Map gain dB → Shotstack volume 0..1 (their API uses a linear
  // 0-to-1 gain scale, not dB). Silence at -20dB, pass-through at 0,
  // +10dB just clamps to 1 since Shotstack doesn't amplify above
  // source level.
  let volume: number | undefined
  if (typeof audioGainDb === 'number') {
    const db = Math.max(-20, Math.min(10, audioGainDb))
    // dB → linear: 0 dB = 1.0, -20 dB ≈ 0.1, positive dB clamped to 1.0
    volume = db >= 0 ? 1 : Math.pow(10, db / 20)
  }

  // Thumbnail capture time: user picks any second within the clip
  // (0..duration). Shotstack's poster.capture is in CLIP time, which
  // aligns with clipStart=0 after our trim — so we pass it through
  // directly. Fall back to 1.5s if unset.
  const posterCapture =
    typeof thumbnailSeconds === 'number'
      ? Math.max(0, Math.min(duration, thumbnailSeconds))
      : undefined

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
        ...(typeof cropX === 'number' ? { offsetX: cropX } : {}),
        ...(typeof volume === 'number' ? { volume } : {}),
      },
    ],
    subtitles,
    posterCapture,
  })
}
