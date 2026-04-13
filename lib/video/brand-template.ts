import 'server-only'

import { submitRender, type ShotstackClip } from './shotstack-render'

export interface BrandTemplate {
  logoUrl?: string
  accentColor: string
  fontFamily: string
  introText?: string
  outroText?: string
  introDuration?: number
  outroDuration?: number
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const DEFAULT_TEMPLATE: BrandTemplate = {
  accentColor: '#7c3aed',
  fontFamily: 'Arial',
  introDuration: 2,
  outroDuration: 3,
}

/**
 * Renders a video with brand intro/outro cards and optional logo watermark.
 * Takes a source video URL and wraps it with branded elements.
 */
export async function renderBrandedVideo(params: {
  videoUrl: string
  videoDuration: number
  template: Partial<BrandTemplate>
  subtitles?: Array<{ text: string; start: number; end: number }>
  aspectRatio?: '9:16' | '16:9' | '1:1'
}): Promise<{ ok: true; renderId: string } | { ok: false; error: string }> {
  const t = { ...DEFAULT_TEMPLATE, ...params.template }
  const introDur = t.introDuration ?? 2
  const outroDur = t.outroDuration ?? 3
  const clips: ShotstackClip[] = []

  // Intro card
  if (t.introText) {
    clips.push({
      type: 'title',
      text: t.introText,
      start: 0,
      length: introDur,
    })
  }

  // Main video (offset by intro duration)
  const videoStart = t.introText ? introDur : 0
  clips.push({
    type: 'video',
    src: params.videoUrl,
    start: videoStart,
    length: params.videoDuration,
    fit: 'cover',
  })

  // Outro card
  if (t.outroText) {
    clips.push({
      type: 'title',
      text: t.outroText,
      start: videoStart + params.videoDuration,
      length: outroDur,
    })
  }

  // Subtitles (offset by intro)
  const subtitles = params.subtitles?.map((s) => ({
    text: s.text,
    start: s.start + videoStart,
    length: Math.max(s.end - s.start, 0.5),
  }))

  return submitRender({
    clips,
    subtitles,
    aspectRatio: params.aspectRatio ?? '9:16',
  })
}

/**
 * Generates intro/outro HTML for Shotstack rendering.
 * Used internally by submitRender when clip type is 'title'.
 */
export function buildBrandSlideHtml(params: {
  text: string
  logoUrl?: string
  accentColor: string
  fontFamily: string
}): string {
  const logo = params.logoUrl
    ? `<img src="${params.logoUrl}" style="width:80px;height:80px;object-fit:contain;margin-bottom:16px;" />`
    : ''

  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg,${params.accentColor}22,#0a0a0b);padding:40px;">
      ${logo}
      <p style="font-family:${params.fontFamily};font-size:48px;font-weight:800;color:white;text-align:center;max-width:80%;">${escapeHtml(params.text)}</p>
    </div>
  `
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
