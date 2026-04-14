import 'server-only'

import { getContentItem } from '@/lib/content/get-content-item'
import { getSignedUrl } from '@/lib/content/get-signed-url'
import {
  submitRender,
  type ShotstackClip,
  type ShotstackSubtitle,
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

  const subtitles = buildEvenlySpacedSubtitles(item.transcript, clipLength)

  const clips: ShotstackClip[] = [
    {
      type: 'video',
      src: sourceUrl,
      start: 0,
      length: clipLength,
      fit: 'cover',
    },
  ]

  const renderResult = await submitRender({
    clips,
    subtitles,
    audioUrl: input.musicUrl ?? undefined,
    aspectRatio: input.aspectRatio ?? '9:16',
    resolution: '1080',
  })

  if (!renderResult.ok) return { ok: false, error: renderResult.error }

  const renderRowId = await insertRender({
    workspaceId: input.workspaceId,
    contentId: input.contentId,
    kind: 'branded_video',
    provider: 'shotstack',
    providerRenderId: renderResult.renderId,
    metadata: {
      aspectRatio: input.aspectRatio ?? '9:16',
      clipStart,
      clipLength,
      hasMusic: Boolean(input.musicUrl),
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
