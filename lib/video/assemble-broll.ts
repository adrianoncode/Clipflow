import 'server-only'

import { submitRender, type ShotstackClip, type ShotstackSubtitle } from './shotstack-render'

export interface BRollSegment {
  videoUrl: string
  startSecond: number
  durationSeconds: number
}

/**
 * Assembles a video from B-Roll clips + voiceover audio + subtitles.
 * This is the core of the Faceless Video pipeline — takes the storyboard
 * and renders it into an actual MP4 via Shotstack.
 */
export async function assembleBRollVideo(params: {
  /** B-Roll video clips in order */
  brollClips: BRollSegment[]
  /** Voiceover audio URL (from ElevenLabs TTS) */
  audioUrl?: string
  /** Subtitle cues to burn onto the video */
  subtitles?: Array<{ text: string; start: number; end: number }>
  /** Output aspect ratio */
  aspectRatio?: '9:16' | '16:9' | '1:1'
}): Promise<{ ok: true; renderId: string } | { ok: false; error: string }> {
  const { brollClips, audioUrl, subtitles, aspectRatio } = params

  if (brollClips.length === 0) {
    return { ok: false, error: 'No B-Roll clips provided.' }
  }

  const clips: ShotstackClip[] = brollClips.map((clip) => ({
    type: 'video' as const,
    src: clip.videoUrl,
    start: clip.startSecond,
    length: clip.durationSeconds,
    fit: 'cover' as const,
  }))

  const shotstackSubtitles: ShotstackSubtitle[] = (subtitles ?? []).map((sub) => ({
    text: sub.text,
    start: sub.start,
    length: Math.max(sub.end - sub.start, 0.5),
  }))

  return submitRender({
    clips,
    subtitles: shotstackSubtitles.length > 0 ? shotstackSubtitles : undefined,
    audioUrl,
    aspectRatio: aspectRatio ?? '9:16',
  })
}

/**
 * Quick helper: assemble a faceless video from our Storyboard type.
 */
export async function renderFacelessVideo(params: {
  storyboardClips: Array<{ videoUrl: string; startSecond: number; endSecond: number }>
  audioUrl: string | null
  subtitleCues: Array<{ text: string; start: number; end: number }>
  aspectRatio?: '9:16' | '16:9' | '1:1'
}): Promise<{ ok: true; renderId: string } | { ok: false; error: string }> {
  return assembleBRollVideo({
    brollClips: params.storyboardClips.map((c) => ({
      videoUrl: c.videoUrl,
      startSecond: c.startSecond,
      durationSeconds: c.endSecond - c.startSecond,
    })),
    audioUrl: params.audioUrl ?? undefined,
    subtitles: params.subtitleCues,
    aspectRatio: params.aspectRatio,
  })
}
