import 'server-only'

import { submitRender, type CaptionStyle } from '@/lib/video/shotstack-render'
import {
  chunkWordsForCaptions,
  type CaptionChunk,
  type WordTiming,
} from '@/lib/highlights/caption-chunks'

/**
 * A single B-Roll overlay the user dropped into the clip via the
 * Phase A2 B-Roll picker. Shotstack will paint this on a track above
 * the main video clip at the given offset + length with the given
 * opacity (0..1). Typically a Pexels video or photo URL.
 */
export interface BRollOverlay {
  videoUrl: string
  /** Seconds into the CLIP (not source) when the overlay appears. */
  startSeconds: number
  /** How long the overlay stays on screen. */
  lengthSeconds: number
  /** 0..1. 1 = fully opaque (replaces main video), 0 = invisible. */
  opacity: number
  /** 'video' or 'image' — controls which Shotstack asset type to use. */
  kind?: 'video' | 'image'
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
  /**
   * User-edited caption chunks from Phase A2's Caption Chunk Editor.
   * Each entry overrides one line of the auto-chunked karaoke output.
   * When present and non-empty, takes priority over auto-chunking but
   * NOT over customCaptionText (single-line override wins first).
   */
  captionChunks?: CaptionChunk[] | null
  /**
   * Phase A2 B-Roll overlays. Each entry drops a Pexels clip (or
   * photo) on top of the main video at the given offset for the
   * given length, with the given opacity.
   */
  brollOverlays?: BRollOverlay[] | null
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
    captionChunks = null,
    brollOverlays = null,
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
  // Caption-source priority:
  //  1. customCaptionText — single-line override wins always
  //  2. captionChunks (Phase A2) — user hand-edited chunk list
  //  3. wordTimings — auto-chunk from Whisper word timings
  //  4. fallbackSubtitleText — one caption painted across the clip
  let subtitles: Array<{ text: string; start: number; length: number }> = []
  if (customCaptionText?.trim()) {
    subtitles = [
      {
        text: customCaptionText.trim().slice(0, 500),
        start: 0,
        length: duration,
      },
    ]
  } else if (captionChunks && captionChunks.length > 0) {
    subtitles = captionChunks.map((c) => ({
      text: c.text.trim().slice(0, 120),
      start: Math.max(0, c.startSeconds),
      length: Math.max(0.3, c.lengthSeconds),
    }))
  } else if (wordTimings && wordTimings.length > 0) {
    subtitles = chunkWordsForCaptions(wordTimings, clipStartSeconds, clipEndSeconds).map(
      (c) => ({
        text: c.text,
        start: c.startSeconds,
        length: c.lengthSeconds,
      }),
    )
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

  // B-Roll overlays: each becomes a clip on the same video track with
  // its own start offset + length. Shotstack stacks later clips on
  // top, so overlays render above the base video naturally. Opacity
  // is applied via asset-level alpha filter below via ShotstackClip.
  const brollClips =
    brollOverlays && brollOverlays.length > 0
      ? brollOverlays
          .filter(
            (o) =>
              o.videoUrl &&
              o.startSeconds >= 0 &&
              o.startSeconds < duration &&
              o.lengthSeconds > 0.1,
          )
          .map((o) => ({
            type: (o.kind === 'image' ? 'image' : 'video') as 'video' | 'image',
            src: o.videoUrl,
            start: Math.max(0, o.startSeconds),
            length: Math.min(o.lengthSeconds, duration - o.startSeconds),
            fit: 'cover' as const,
            opacity: Math.max(0, Math.min(1, o.opacity)),
          }))
      : []

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
      ...brollClips,
    ],
    subtitles,
    posterCapture,
  })
}
