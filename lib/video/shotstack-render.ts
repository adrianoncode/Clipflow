import 'server-only'

import { resolveServiceKey } from '@/lib/ai/get-service-key'

const API_URL = process.env.SHOTSTACK_API_URL ?? 'https://api.shotstack.io/edit/v1'

/**
 * Resolves the Shotstack API key for a render. BYOK-first: if the
 * workspace has a connected key we use theirs, otherwise we fall back
 * to the platform key (env var). Returns null when neither is set so
 * callers can surface a "Connect Shotstack" nudge instead of 500ing.
 */
async function getShotstackApiKey(workspaceId?: string | null): Promise<string | null> {
  if (workspaceId) {
    const key = await resolveServiceKey(workspaceId, 'shotstack')
    if (key) return key
  }
  return process.env.SHOTSTACK_API_KEY ?? null
}

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

/**
 * Visual style presets for captions.
 * - tiktok-bold  : Huge white text, fat black stroke — the viral TikTok look
 * - minimal      : Clean small white text, no stroke
 * - neon         : Yellow glow, high contrast
 * - white-bar    : Text on a semi-transparent black pill — Instagram Reels style
 */
export type CaptionStyle = 'tiktok-bold' | 'minimal' | 'neon' | 'white-bar'

function buildCaptionHtml(text: string, style: CaptionStyle): string {
  const escaped = escapeHtml(text)
  switch (style) {
    case 'tiktok-bold':
      return `<p style="font-family:'Arial Black',Arial;font-size:68px;font-weight:900;color:#FFFFFF;-webkit-text-stroke:4px #000000;text-align:center;padding:16px 24px;line-height:1.1;letter-spacing:-1px;">${escaped}</p>`
    case 'minimal':
      return `<p style="font-family:Arial;font-size:38px;font-weight:500;color:#FFFFFF;text-align:center;padding:12px 24px;opacity:0.95;letter-spacing:-0.3px;">${escaped}</p>`
    case 'neon':
      return `<p style="font-family:'Arial Black',Arial;font-size:58px;font-weight:800;color:#FFE600;text-shadow:0 0 12px rgba(255,230,0,0.9),0 0 30px rgba(255,230,0,0.5),2px 2px 0 #000;text-align:center;padding:16px 24px;">${escaped}</p>`
    case 'white-bar':
      return `<div style="display:inline-block;background:rgba(0,0,0,0.72);border-radius:12px;padding:10px 28px;"><p style="font-family:Arial;font-size:44px;font-weight:700;color:#FFFFFF;text-align:center;margin:0;">${escaped}</p></div>`
    default:
      return `<p style="font-family:Arial;font-size:48px;font-weight:bold;color:white;text-shadow:2px 2px 10px rgba(0,0,0,0.9);text-align:center;padding:20px;">${escaped}</p>`
  }
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
  /** Caption visual style — defaults to tiktok-bold */
  captionStyle?: CaptionStyle
  /** Optional hook text shown at the very start (0–2.5 s) */
  hookText?: string
  /**
   * Workspace doing the render — lets us pick up the user's BYOK
   * Shotstack key. Optional for backward compatibility; omitting it
   * falls back to the platform key.
   */
  workspaceId?: string
}

/**
 * Submits a video render job to Shotstack.
 * Returns the render ID for polling.
 */
export async function submitRender(input: RenderInput): Promise<
  { ok: true; renderId: string } | { ok: false; error: string }
> {
  const apiKey = await getShotstackApiKey(input.workspaceId ?? null)
  if (!apiKey) {
    return {
      ok: false,
      error:
        'Shotstack key not connected. Add one in Settings → AI Connections to render videos.',
    }
  }

  const tracks = []

  const captionStyle: CaptionStyle = input.captionStyle ?? 'tiktok-bold'

  // Track 1: Hook text (shown at very start, 2.5 s)
  if (input.hookText) {
    tracks.push({
      clips: [
        {
          asset: {
            type: 'html',
            html: `<p style="font-family:'Arial Black',Arial;font-size:54px;font-weight:900;color:#FFE600;text-shadow:0 0 12px rgba(255,230,0,0.8),2px 2px 0 #000;text-align:center;padding:20px 32px;line-height:1.15;">${escapeHtml(input.hookText)}</p>`,
            width: 1080,
            height: 320,
          },
          start: 0,
          length: 2.5,
          position: 'center',
        },
      ],
    })
  }

  // Track 2: Subtitles (styled captions)
  if (input.subtitles && input.subtitles.length > 0) {
    tracks.push({
      clips: input.subtitles.map((sub) => ({
        asset: {
          type: 'html',
          html: buildCaptionHtml(sub.text, captionStyle),
          width: 1080,
          height: 220,
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

  // Shotstack webhook callback — only set when the app URL + secret are
  // both configured in the environment (i.e. production deployments).
  const webhookSecret = process.env.SHOTSTACK_WEBHOOK_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const callbackUrl =
    appUrl && webhookSecret
      ? `${appUrl}/api/webhooks/shotstack?secret=${webhookSecret}`
      : undefined

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
      ...(callbackUrl ? { callback: callbackUrl } : {}),
    },
  }

  try {
    const res = await fetch(`${API_URL}/render`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
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
 *
 * `workspaceId` lets us read the user's BYOK key — needed because the
 * render was submitted against their account. Omitting it falls back
 * to the platform key for legacy render-ids.
 */
export async function getRenderStatus(
  renderId: string,
  workspaceId?: string | null,
): Promise<
  { status: 'rendering' | 'done' | 'failed'; url?: string; error?: string }
> {
  const apiKey = await getShotstackApiKey(workspaceId ?? null)
  if (!apiKey)
    return {
      status: 'failed',
      error: 'No Shotstack key — connect one in Settings → AI Connections.',
    }

  try {
    const res = await fetch(`${API_URL}/render/${renderId}`, {
      headers: { 'x-api-key': apiKey },
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
