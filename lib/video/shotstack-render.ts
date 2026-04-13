import 'server-only'

const API_URL = process.env.SHOTSTACK_API_URL ?? 'https://api.shotstack.io/edit/v1'
const API_KEY = process.env.SHOTSTACK_API_KEY

export interface ShotstackClip {
  type: 'video' | 'image' | 'title' | 'audio'
  src?: string
  text?: string
  start: number
  length: number
  fit?: 'cover' | 'contain' | 'none'
  position?: 'center' | 'top' | 'bottom'
  style?: string
  volume?: number
}

export interface ShotstackSubtitle {
  text: string
  start: number
  length: number
}

export interface RenderInput {
  /** Video clips (B-Roll footage) */
  clips: ShotstackClip[]
  /** Subtitle overlays */
  subtitles?: ShotstackSubtitle[]
  /** Voiceover audio URL */
  audioUrl?: string
  /** Output format */
  resolution?: 'sd' | 'hd' | '1080'
  /** Aspect ratio */
  aspectRatio?: '16:9' | '9:16' | '1:1'
}

/**
 * Submits a video render job to Shotstack.
 * Returns the render ID for polling.
 */
export async function submitRender(input: RenderInput): Promise<
  { ok: true; renderId: string } | { ok: false; error: string }
> {
  if (!API_KEY) {
    return { ok: false, error: 'Shotstack API key not configured.' }
  }

  const tracks = []

  // Track 1: Subtitles (top layer)
  if (input.subtitles && input.subtitles.length > 0) {
    tracks.push({
      clips: input.subtitles.map((sub) => ({
        asset: {
          type: 'html',
          html: `<p style="font-family:Arial;font-size:42px;font-weight:bold;color:white;text-shadow:2px 2px 8px rgba(0,0,0,0.9);text-align:center;padding:20px;">${escapeHtml(sub.text)}</p>`,
          width: 1080,
          height: 200,
        },
        start: sub.start,
        length: sub.length,
        position: 'bottom',
        offset: { y: 0.1 },
      })),
    })
  }

  // Track 2: Video clips (B-Roll)
  if (input.clips.length > 0) {
    tracks.push({
      clips: input.clips
        .filter((c) => c.type === 'video' || c.type === 'image')
        .map((clip) => ({
          asset: {
            type: clip.type === 'video' ? 'video' : 'image',
            src: clip.src,
          },
          start: clip.start,
          length: clip.length,
          fit: clip.fit ?? 'cover',
        })),
    })
  }

  // Track 3: Title cards
  const titleClips = input.clips.filter((c) => c.type === 'title')
  if (titleClips.length > 0) {
    tracks.push({
      clips: titleClips.map((clip) => ({
        asset: {
          type: 'html',
          html: `<p style="font-family:Arial;font-size:56px;font-weight:bold;color:white;text-align:center;">${escapeHtml(clip.text ?? '')}</p>`,
          width: 1080,
          height: 1920,
          background: '#0a0a0b',
        },
        start: clip.start,
        length: clip.length,
      })),
    })
  }

  // Audio track (voiceover)
  const soundtrack = input.audioUrl
    ? { src: input.audioUrl, effect: 'fadeOut' }
    : undefined

  // Determine output size
  const outputSize = input.aspectRatio === '9:16'
    ? { width: 1080, height: 1920 }
    : input.aspectRatio === '1:1'
      ? { width: 1080, height: 1080 }
      : { width: 1920, height: 1080 }

  const body = {
    timeline: {
      tracks,
      ...(soundtrack ? { soundtrack } : {}),
      background: '#0a0a0b',
    },
    output: {
      format: 'mp4',
      resolution: input.resolution ?? 'hd',
      size: outputSize,
    },
  }

  try {
    const res = await fetch(`${API_URL}/render`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `Shotstack error ${res.status}: ${err.slice(0, 200)}` }
    }

    const data = await res.json() as { response?: { id?: string } }
    const renderId = data.response?.id
    if (!renderId) return { ok: false, error: 'No render ID returned.' }

    return { ok: true, renderId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Render submission failed' }
  }
}

/**
 * Polls the render status. Returns the video URL when complete.
 */
export async function getRenderStatus(renderId: string): Promise<
  { status: 'rendering' | 'done' | 'failed'; url?: string; error?: string }
> {
  if (!API_KEY) return { status: 'failed', error: 'No API key.' }

  try {
    const res = await fetch(`${API_URL}/render/${renderId}`, {
      headers: { 'x-api-key': API_KEY },
    })

    if (!res.ok) return { status: 'failed', error: `Status check failed (${res.status})` }

    const data = await res.json() as {
      response?: { status?: string; url?: string; error?: string }
    }

    const s = data.response?.status
    if (s === 'done') return { status: 'done', url: data.response?.url }
    if (s === 'failed') return { status: 'failed', error: data.response?.error ?? 'Render failed' }
    return { status: 'rendering' }
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : 'Poll failed' }
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
