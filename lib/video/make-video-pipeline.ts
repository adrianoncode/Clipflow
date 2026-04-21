import 'server-only'

import { getBrandKit } from '@/lib/brand-kit/get-brand-kit'
import { getRenderPriorityForWorkspace } from '@/lib/billing/get-render-priority'
import { getContentItem } from '@/lib/content/get-content-item'
import { getSignedUrl } from '@/lib/content/get-signed-url'
import {
  submitRender,
  type ShotstackClip,
  type ShotstackSubtitle,
  type CaptionStyle,
} from '@/lib/video/shotstack-render'
import { insertRender } from '@/lib/video/renders/insert-render'

export interface MakeVideoInput {
  workspaceId: string
  contentId: string
  /** 9:16 by default — vertical for TikTok/Reels/Shorts. */
  aspectRatio?: '9:16' | '16:9' | '1:1'
  /** Optional seconds [start, end] — if not provided, uses full transcript. */
  clipRange?: { start: number; end: number } | null
  /** Optional background music URL (from trending sounds or Pexels Audio). */
  musicUrl?: string | null
  /** Visual style for captions — defaults to tiktok-bold */
  captionStyle?: CaptionStyle
  /** Optional hook text shown at the start of the video */
  hookText?: string | null
}

export type MakeVideoResult =
  | { ok: true; renderId: string; renderRowId: string | null }
  | { ok: false; error: string }

/**
 * The one-click "Make Video" pipeline. Orchestrates the rendering
 * primitives we already have (transcript → subtitles → Shotstack
 * compose → MP4). Quota-gated by the caller via checkRenderQuota.
 *
 * Happy path:
 *   1. Load content item, get signed source URL
 *   2. Generate evenly-spaced subtitles from the transcript
 *   3. Build a Shotstack timeline with: video track, caption track,
 *      optional background-music soundtrack
 *   4. Submit to Shotstack, persist the render row, return the ids
 *
 * The caller polls /api/video/render-status (or watches the renders
 * table) for the final MP4 URL.
 */
export async function makeVideoPipeline(
  input: MakeVideoInput,
): Promise<MakeVideoResult> {
  const item = await getContentItem(input.contentId, input.workspaceId)
  if (!item) return { ok: false, error: 'Content item not found.' }
  if (!item.transcript || item.transcript.length === 0) {
    return {
      ok: false,
      error: 'No transcript yet — wait for processing to finish or add one.',
    }
  }

  // Source video URL — either a signed Supabase storage URL or an
  // external http(s) URL.
  let sourceUrl: string | null = null
  if (item.source_url) {
    sourceUrl = item.source_url.startsWith('http')
      ? item.source_url
      : await getSignedUrl(item.source_url)
  }
  if (!sourceUrl) {
    return {
      ok: false,
      error: 'No playable video source — upload a video first.',
    }
  }

  // Compute clip length. If no explicit range is given we estimate from
  // transcript word count at ~2.5 words/second (natural speech).
  const wordCount = item.transcript.trim().split(/\s+/).length
  const estimatedTotal = Math.max(30, Math.ceil(wordCount / 2.5))
  const clipStart = input.clipRange?.start ?? 0
  const clipLength = input.clipRange
    ? input.clipRange.end - input.clipRange.start
    : estimatedTotal

  // Brand kit — optional intro/outro slides prepended / appended to every
  // render. Loading is best-effort; if the branding JSON is missing or
  // malformed we skip silently and render the clip unbranded.
  const brandKit = await getBrandKit(input.workspaceId)
  const introDuration = brandKit?.introText ? 2 : 0
  const outroDuration = brandKit?.outroText ? 3 : 0
  const videoStart = introDuration

  const subtitles = buildEvenlySpacedSubtitles(item.transcript, clipLength).map((s) => ({
    ...s,
    // Captions sit over the body only — shift past the intro.
    start: s.start + videoStart,
  }))

  const clips: ShotstackClip[] = []

  if (brandKit?.introText) {
    clips.push({
      type: 'title',
      text: brandKit.introText,
      start: 0,
      length: introDuration,
    })
  }

  clips.push({
    type: 'video',
    src: sourceUrl,
    start: videoStart,
    length: clipLength,
    fit: 'cover',
  })

  if (brandKit?.outroText) {
    clips.push({
      type: 'title',
      text: brandKit.outroText,
      start: videoStart + clipLength,
      length: outroDuration,
    })
  }

  const totalTimeline = introDuration + clipLength + outroDuration

  // Studio (agency) gets 'high' — both passed to Shotstack as a hint
  // and recorded on the renders row so the client can poll faster.
  const priority = await getRenderPriorityForWorkspace(input.workspaceId)

  const renderResult = await submitRender({
    clips,
    subtitles,
    audioUrl: input.musicUrl ?? undefined,
    aspectRatio: input.aspectRatio ?? '9:16',
    captionStyle: input.captionStyle ?? 'tiktok-bold',
    hookText: input.hookText ?? undefined,
    resolution: '1080',
    workspaceId: input.workspaceId,
    priority,
    brandKit: brandKit
      ? {
          accentColor: brandKit.accentColor,
          fontFamily: brandKit.fontFamily,
          logoUrl: brandKit.logoUrl,
          watermarkPosition: brandKit.watermarkPosition,
          timelineDuration: totalTimeline,
        }
      : undefined,
  })

  if (!renderResult.ok) return { ok: false, error: renderResult.error }

  const renderRowId = await insertRender({
    workspaceId: input.workspaceId,
    contentId: input.contentId,
    kind: 'branded_video',
    provider: 'shotstack',
    providerRenderId: renderResult.renderId,
    priority,
    metadata: {
      aspectRatio: input.aspectRatio ?? '9:16',
      captionStyle: input.captionStyle ?? 'tiktok-bold',
      hookText: input.hookText ?? null,
      clipStart,
      clipLength,
      hasMusic: Boolean(input.musicUrl),
      brandKit: brandKit
        ? {
            intro: Boolean(brandKit.introText),
            outro: Boolean(brandKit.outroText),
            watermark: Boolean(brandKit.logoUrl),
          }
        : null,
      pipeline: 'one-click',
    },
  })

  return { ok: true, renderId: renderResult.renderId, renderRowId }
}

/**
 * Even-chunk subtitle generator — splits transcript into groups of
 * ~6 words, distributes them uniformly over `totalSeconds`. Not
 * word-timed (the precise /subtitles page does that) but good enough
 * for the one-click pipeline.
 */
function buildEvenlySpacedSubtitles(
  transcript: string,
  totalSeconds: number,
): ShotstackSubtitle[] {
  const words = transcript.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const chunkSize = 6
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
  }
  const perChunk = totalSeconds / chunks.length

  return chunks.map((text, i) => ({
    text,
    start: i * perChunk,
    length: perChunk,
  }))
}
