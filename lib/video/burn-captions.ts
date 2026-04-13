import 'server-only'

import { submitRender, type ShotstackSubtitle } from './shotstack-render'

export interface CaptionStyle {
  fontFamily?: string
  fontSize?: number
  fontColor?: string
  backgroundColor?: string
  position?: 'bottom' | 'center' | 'top'
  style?: 'classic' | 'karaoke' | 'outline' | 'boxed'
}

/**
 * Burns captions onto a video using Shotstack.
 * Takes a video URL + subtitle cues → returns a render ID.
 */
export async function burnCaptions(params: {
  videoUrl: string
  subtitles: Array<{ text: string; start: number; end: number }>
  captionStyle?: CaptionStyle
  aspectRatio?: '16:9' | '9:16' | '1:1'
}): Promise<{ ok: true; renderId: string } | { ok: false; error: string }> {
  const { videoUrl, subtitles, aspectRatio } = params

  // Calculate total duration from last subtitle end
  const totalDuration = Math.max(...subtitles.map((s) => s.end), 10)

  const shotstackSubtitles: ShotstackSubtitle[] = subtitles.map((sub) => ({
    text: sub.text,
    start: sub.start,
    length: Math.max(sub.end - sub.start, 0.5),
  }))

  return submitRender({
    clips: [
      {
        type: 'video',
        src: videoUrl,
        start: 0,
        length: totalDuration,
        fit: 'cover',
      },
    ],
    subtitles: shotstackSubtitles,
    aspectRatio: aspectRatio ?? '9:16',
  })
}
