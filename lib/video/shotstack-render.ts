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
  /**
   * Horizontal crop anchor for cover-fit on mismatched aspect ratios.
   * Shotstack semantics: -0.5 pushes the visible window to the left
   * of the source frame, +0.5 pushes it to the right, 0 = center.
   * Only applied when explicitly set — otherwise Shotstack's default
   * center-crop stays in play.
   */
  offsetX?: number
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

export interface RenderBrandKit {
  /** Hex colour used as the gradient tint on intro/outro title cards. */
  accentColor?: string
  /** Font family string applied to title cards + hook HTML. */
  fontFamily?: string
  /** HTTPS logo URL — gets overlaid on every frame as a watermark. */
  logoUrl?: string
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** Total timeline duration in seconds — the watermark runs edge-to-edge. */
  timelineDuration?: number
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
  /**
   * Optional per-workspace brand overrides. When provided, title cards
   * pick up the accent colour + font, and a persistent logo watermark
   * is stamped into the requested corner for the whole timeline.
   */
  brandKit?: RenderBrandKit
  /**
   * Dispatch priority — Studio tier submits with 'high'. We pass this
   * through to Shotstack as a hint; if Shotstack ignores it (free tier),
   * no harm done. The real enforcement is on our polling side (faster
   * status checks for high-priority renders, see `pollIntervalMs` on
   * the client components).
   */
  priority?: 'normal' | 'high'
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
          // Only attach `offset` when the caller explicitly asked for
          // a horizontal shift — Shotstack's default crop is already
          // center-anchored and adding offset:{x:0} would prevent the
          // engine from using its faster default path.
          ...(typeof clip.offsetX === 'number' && clip.offsetX !== 0
            ? { offset: { x: clip.offsetX } }
            : {}),
        })),
    })
  }

  // Track 3: Title cards — respect the workspace brand kit when set.
  const titleClips = input.clips.filter((c) => c.type === 'title')
  if (titleClips.length > 0) {
    const accent = input.brandKit?.accentColor ?? '#2A1A3D'
    const font = input.brandKit?.fontFamily ?? 'Arial'
    tracks.push({
      clips: titleClips.map((clip) => ({
        asset: {
          type: 'html',
          html: `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:linear-gradient(135deg,${accent}CC,${accent}22),#0a0a0b;padding:48px;box-sizing:border-box;"><p style="font-family:'${font}',Arial,sans-serif;font-size:64px;font-weight:800;color:#FFFFFF;text-align:center;line-height:1.15;letter-spacing:-1px;max-width:92%;">${escapeHtml(clip.text ?? '')}</p></div>`,
          width: 1080,
          height: 1920,
          background: '#0a0a0b',
        },
        start: clip.start,
        length: clip.length,
      })),
    })
  }

  // Track 4: Persistent logo watermark — runs the full timeline so it's
  // always on top of video + subtitles. Positioned via Shotstack's
  // normalized offset coordinates (x/y -0.5..0.5 from center).
  if (input.brandKit?.logoUrl && input.brandKit?.timelineDuration && input.brandKit.timelineDuration > 0) {
    const pos = input.brandKit.watermarkPosition ?? 'bottom-right'
    // Rough safe-zone anchors so the logo sits in the corner with a
    // 40-60 px margin from the edges on a 1080×1920 canvas.
    const offset =
      pos === 'top-left'
        ? { x: -0.42, y: 0.45 }
        : pos === 'top-right'
          ? { x: 0.42, y: 0.45 }
          : pos === 'bottom-left'
            ? { x: -0.42, y: -0.45 }
            : { x: 0.42, y: -0.45 }
    tracks.push({
      clips: [
        {
          asset: { type: 'image', src: input.brandKit.logoUrl },
          start: 0,
          length: input.brandKit.timelineDuration,
          fit: 'none',
          scale: 0.12,
          offset,
        },
      ],
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
  //
  // Known limit: Shotstack's callback API accepts only a plain URL, no
  // custom headers or HMAC. The secret therefore has to travel in the
  // query string, which exposes it to Vercel access logs and CDN edges.
  // Mitigation is operational — rotate SHOTSTACK_WEBHOOK_SECRET on a
  // schedule or when rotating infra. The webhook handler itself still
  // accepts an `x-webhook-secret` header as the primary check, so any
  // renderer we swap to later can move off the query-string path.
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
      // Ask Shotstack to emit a poster JPG at 1.5s — far enough in to
      // skip any fade-in but before most hook overlays fade out, so
      // the thumbnail captures the moment's hook instead of a black
      // frame. The URL comes back on the render-complete callback
      // under `response.poster`.
      poster: { capture: 1.5 },
      ...(callbackUrl ? { callback: callbackUrl } : {}),
    },
    // Optional top-level priority hint. Shotstack accepts `priority`
    // on higher-tier accounts; on free/dev accounts it's silently
    // ignored. We always include it for Studio renders so the moment
    // they upgrade their Shotstack plan the queue advantage kicks in.
    ...(input.priority === 'high' ? { priority: 'high' } : {}),
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
