import 'server-only'

import { submitRender, type ShotstackClip } from './shotstack-render'

export interface ClipRange {
  startSeconds: number
  endSeconds: number
  label?: string
}

/**
 * Clips a segment from a longer video using Shotstack.
 * Takes a source video URL + start/end timestamps → renders a trimmed MP4.
 */
export async function clipVideo(params: {
  videoUrl: string
  startSeconds: number
  endSeconds: number
  addCaptions?: Array<{ text: string; start: number; end: number }>
  aspectRatio?: '9:16' | '16:9' | '1:1'
}): Promise<{ ok: true; renderId: string } | { ok: false; error: string }> {
  const { videoUrl, startSeconds, endSeconds, addCaptions, aspectRatio } = params
  const duration = endSeconds - startSeconds

  if (duration <= 0) return { ok: false, error: 'End time must be after start time.' }
  if (duration > 180) return { ok: false, error: 'Clip can be max 3 minutes.' }

  const clips: ShotstackClip[] = [
    {
      type: 'video',
      src: `${videoUrl}#t=${startSeconds}`,
      start: 0,
      length: duration,
      fit: 'cover',
    },
  ]

  // Offset captions relative to clip start
  const subtitles = addCaptions?.map((c) => ({
    text: c.text,
    start: Math.max(c.start - startSeconds, 0),
    length: Math.max(c.end - c.start, 0.5),
  }))

  return submitRender({
    clips,
    subtitles,
    aspectRatio: aspectRatio ?? '9:16',
  })
}

/**
 * Batch clip: takes multiple clip ranges from one video and submits
 * them as separate render jobs. Returns array of render IDs.
 */
export async function batchClipVideo(params: {
  videoUrl: string
  clips: ClipRange[]
  aspectRatio?: '9:16' | '16:9' | '1:1'
}): Promise<Array<{ label: string; renderId?: string; error?: string }>> {
  const results = await Promise.allSettled(
    params.clips.map((clip) =>
      clipVideo({
        videoUrl: params.videoUrl,
        startSeconds: clip.startSeconds,
        endSeconds: clip.endSeconds,
        aspectRatio: params.aspectRatio,
      }),
    ),
  )

  return results.map((r, i) => {
    const clip = params.clips[i]
    if (r.status === 'fulfilled' && r.value.ok) {
      return { label: clip?.label ?? `Clip ${i + 1}`, renderId: r.value.renderId }
    }
    const error = r.status === 'fulfilled' ? r.value.error : 'Render failed'
    return { label: clip?.label ?? `Clip ${i + 1}`, error: error ?? 'Unknown error' }
  })
}
