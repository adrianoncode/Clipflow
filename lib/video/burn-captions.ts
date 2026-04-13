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

const DEFAULT_STYLE: CaptionStyle = {
  fontFamily: 'Arial',
  fontSize: 42,
  fontColor: '#ffffff',
  backgroundColor: 'rgba(0,0,0,0.7)',
  position: 'bottom',
  style: 'boxed',
}

function buildCaptionHtml(text: string, style: CaptionStyle): string {
  const s = { ...DEFAULT_STYLE, ...style }

  switch (s.style) {
    case 'karaoke':
      return `<p style="font-family:${s.fontFamily};font-size:${s.fontSize}px;font-weight:900;color:${s.fontColor};text-align:center;padding:12px 24px;text-shadow:0 0 20px rgba(124,58,237,0.8),0 0 40px rgba(124,58,237,0.4);">${escapeHtml(text)}</p>`
    case 'outline':
      return `<p style="font-family:${s.fontFamily};font-size:${s.fontSize}px;font-weight:800;color:${s.fontColor};text-align:center;padding:12px 24px;-webkit-text-stroke:2px #000;text-shadow:3px 3px 6px rgba(0,0,0,0.9);">${escapeHtml(text)}</p>`
    case 'boxed':
      return `<p style="font-family:${s.fontFamily};font-size:${s.fontSize}px;font-weight:700;color:${s.fontColor};text-align:center;padding:8px 20px;background:${s.backgroundColor};border-radius:8px;display:inline-block;">${escapeHtml(text)}</p>`
    case 'classic':
    default:
      return `<p style="font-family:${s.fontFamily};font-size:${s.fontSize}px;font-weight:700;color:${s.fontColor};text-align:center;padding:12px 24px;text-shadow:2px 2px 8px rgba(0,0,0,0.9);">${escapeHtml(text)}</p>`
  }
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
  const { videoUrl, subtitles, captionStyle, aspectRatio } = params

  // Calculate total duration from last subtitle end
  const totalDuration = Math.max(...subtitles.map((s) => s.end), 10)

  const shotstackSubtitles: ShotstackSubtitle[] = subtitles.map((sub) => ({
    text: sub.text,
    start: sub.start,
    length: Math.max(sub.end - sub.start, 0.5),
  }))

  // Override the default subtitle HTML with our styled version
  const style = { ...DEFAULT_STYLE, ...captionStyle }

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

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
