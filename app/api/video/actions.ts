'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { burnCaptions, type CaptionStyle } from '@/lib/video/burn-captions'
import { assembleBRollVideo } from '@/lib/video/assemble-broll'
import { renderBrandedVideo, type BrandTemplate } from '@/lib/video/brand-template'
import { clipVideo, batchClipVideo } from '@/lib/video/clip-video'

type VideoActionResult =
  | { ok?: undefined }
  | { ok: true; renderId: string }
  | { ok: false; error: string }

type BatchResult =
  | { ok?: undefined }
  | { ok: true; renders: Array<{ label: string; renderId?: string; error?: string }> }
  | { ok: false; error: string }

/* ═══ 1. Burn Captions onto Video ═══════════════════════════════ */

export async function burnCaptionsAction(
  _prev: VideoActionResult,
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const videoUrl = formData.get('video_url')?.toString() ?? ''
  const subtitlesJson = formData.get('subtitles')?.toString() ?? '[]'
  const style = formData.get('caption_style')?.toString() ?? 'boxed'
  const aspectRatio = (formData.get('aspect_ratio')?.toString() ?? '9:16') as '9:16' | '16:9' | '1:1'

  if (!videoUrl) return { ok: false, error: 'No video URL.' }

  let subtitles: Array<{ text: string; start: number; end: number }>
  try {
    subtitles = JSON.parse(subtitlesJson)
  } catch {
    return { ok: false, error: 'Invalid subtitle data.' }
  }

  if (subtitles.length === 0) return { ok: false, error: 'No subtitles provided.' }

  const result = await burnCaptions({
    videoUrl,
    subtitles,
    captionStyle: { style: style as CaptionStyle['style'] },
    aspectRatio,
  })

  return result
}

/* ═══ 2. Assemble B-Roll Video ══════════════════════════════════ */

export async function assembleBRollAction(
  _prev: VideoActionResult,
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const clipsJson = formData.get('clips')?.toString() ?? '[]'
  const audioUrl = formData.get('audio_url')?.toString() || undefined
  const subtitlesJson = formData.get('subtitles')?.toString() ?? '[]'
  const aspectRatio = (formData.get('aspect_ratio')?.toString() ?? '9:16') as '9:16' | '16:9' | '1:1'

  let clips: Array<{ videoUrl: string; startSecond: number; durationSeconds: number }>
  let subtitles: Array<{ text: string; start: number; end: number }>

  try {
    clips = JSON.parse(clipsJson)
    subtitles = JSON.parse(subtitlesJson)
  } catch {
    return { ok: false, error: 'Invalid clip/subtitle data.' }
  }

  if (clips.length === 0) return { ok: false, error: 'No B-Roll clips.' }

  const result = await assembleBRollVideo({
    brollClips: clips,
    audioUrl,
    subtitles: subtitles.length > 0 ? subtitles : undefined,
    aspectRatio,
  })

  return result
}

/* ═══ 3. Render Branded Video ═══════════════════════════════════ */

export async function renderBrandedAction(
  _prev: VideoActionResult,
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const videoUrl = formData.get('video_url')?.toString() ?? ''
  const duration = parseFloat(formData.get('duration')?.toString() ?? '30')
  const introText = formData.get('intro_text')?.toString() || undefined
  const outroText = formData.get('outro_text')?.toString() || undefined
  const accentColor = formData.get('accent_color')?.toString() ?? '#7c3aed'
  const logoUrl = formData.get('logo_url')?.toString() || undefined
  const aspectRatio = (formData.get('aspect_ratio')?.toString() ?? '9:16') as '9:16' | '16:9' | '1:1'

  if (!videoUrl) return { ok: false, error: 'No video URL.' }

  const result = await renderBrandedVideo({
    videoUrl,
    videoDuration: duration,
    template: { introText, outroText, accentColor, logoUrl },
    aspectRatio,
  })

  return result
}

/* ═══ 4. Clip Video ═════════════════════════════════════════════ */

export async function clipVideoAction(
  _prev: VideoActionResult,
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const videoUrl = formData.get('video_url')?.toString() ?? ''
  const startSeconds = parseFloat(formData.get('start_seconds')?.toString() ?? '0')
  const endSeconds = parseFloat(formData.get('end_seconds')?.toString() ?? '60')
  const aspectRatio = (formData.get('aspect_ratio')?.toString() ?? '9:16') as '9:16' | '16:9' | '1:1'

  if (!videoUrl) return { ok: false, error: 'No video URL.' }

  const result = await clipVideo({
    videoUrl,
    startSeconds,
    endSeconds,
    aspectRatio,
  })

  return result
}

/* ═══ 5. Batch Clip Video ═══════════════════════════════════════ */

export async function batchClipAction(
  _prev: BatchResult,
  formData: FormData,
): Promise<BatchResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const videoUrl = formData.get('video_url')?.toString() ?? ''
  const clipsJson = formData.get('clips')?.toString() ?? '[]'
  const aspectRatio = (formData.get('aspect_ratio')?.toString() ?? '9:16') as '9:16' | '16:9' | '1:1'

  if (!videoUrl) return { ok: false, error: 'No video URL.' }

  let clips: Array<{ startSeconds: number; endSeconds: number; label?: string }>
  try {
    clips = JSON.parse(clipsJson)
  } catch {
    return { ok: false, error: 'Invalid clips data.' }
  }

  if (clips.length === 0) return { ok: false, error: 'No clips defined.' }

  const renders = await batchClipVideo({ videoUrl, clips, aspectRatio })
  return { ok: true, renders }
}
