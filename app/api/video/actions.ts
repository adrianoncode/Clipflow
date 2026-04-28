'use server'

import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { burnCaptions, type SubtitleUiStyle } from '@/lib/video/burn-captions'
import { assembleBRollVideo } from '@/lib/video/assemble-broll'
import { renderBrandedVideo } from '@/lib/video/brand-template'
import { clipVideo, batchClipVideo } from '@/lib/video/clip-video'
import { insertRender } from '@/lib/video/renders/insert-render'
import { checkRenderQuota, type QuotaKey } from '@/lib/billing/check-feature'
import type { RenderKind } from '@/lib/supabase/types'

/**
 * Shared pre-submit gate. Does two things:
 *
 *   1. Verifies the caller is a member of `workspaceId`. Previously
 *      these actions trusted the workspace_id from formData and only
 *      ran `checkRenderQuota` — meaning an attacker could pass a
 *      victim's workspace_id and (a) burn that workspace's render
 *      quota, and (b) attribute Shotstack spend to that workspace.
 *
 *   2. If the caller is a member, ensures the workspace hasn't hit
 *      its monthly render cap for this quota bucket. Gate runs
 *      BEFORE any provider API call so rejected requests don't burn
 *      Shotstack / Replicate credits.
 *
 * Returns null to mean "proceed", or an error-shaped result the
 * action can return as-is.
 */
async function gateOrReturn(
  workspaceId: string | null,
  quota: QuotaKey,
): Promise<{ ok: false; error: string } | null> {
  if (!workspaceId) {
    return { ok: false, error: 'Workspace required.' }
  }
  const member = await requireWorkspaceMember(workspaceId)
  if (!member.ok) {
    return { ok: false, error: member.message }
  }
  const check = await checkRenderQuota(workspaceId, quota)
  if (check.ok) return null
  return { ok: false, error: check.message ?? 'Plan limit reached.' }
}

type VideoActionResult =
  | { ok?: undefined }
  | { ok: true; renderId: string; renderRowId?: string | null }
  | { ok: false; error: string }

type BatchResult =
  | { ok?: undefined }
  | {
      ok: true
      renders: Array<{
        label: string
        renderId?: string
        renderRowId?: string | null
        error?: string
      }>
    }
  | { ok: false; error: string }

/**
 * Every successful Shotstack submit drops a row in `public.renders` so
 * the user gets a durable history card. workspace_id + content_id must
 * be passed in via formData — we don't infer them from the route.
 */
async function persistRender(params: {
  kind: RenderKind
  renderId: string
  workspaceId: string | null
  contentId: string | null
  metadata?: Record<string, unknown>
}): Promise<string | null> {
  if (!params.workspaceId) return null
  return insertRender({
    workspaceId: params.workspaceId,
    contentId: params.contentId,
    kind: params.kind,
    provider: 'shotstack',
    providerRenderId: params.renderId,
    metadata: params.metadata,
  })
}

/* ═══ 1. Burn Captions onto Video ═══════════════════════════════ */

export async function burnCaptionsAction(
  _prev: VideoActionResult,
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() || null
  const contentId = formData.get('content_id')?.toString() || null
  const videoUrl = formData.get('video_url')?.toString() ?? ''
  const subtitlesJson = formData.get('subtitles')?.toString() ?? '[]'
  const wordsJson = formData.get('word_timings')?.toString() ?? ''
  const uiStyleRaw = formData.get('caption_style')?.toString() ?? 'classic'
  const uiStyle = ([
    'classic',
    'bold-yellow',
    'minimal',
    'karaoke',
    'tiktok-bold',
    'beasty',
  ] as const).includes(uiStyleRaw as SubtitleUiStyle)
    ? (uiStyleRaw as SubtitleUiStyle)
    : 'classic'
  const aspectRatio = (formData.get('aspect_ratio')?.toString() ?? '9:16') as
    | '9:16'
    | '16:9'
    | '1:1'

  if (!videoUrl) return { ok: false, error: 'No video URL.' }

  let subtitles: Array<{ text: string; start: number; end: number }>
  try {
    subtitles = JSON.parse(subtitlesJson)
  } catch {
    return { ok: false, error: 'Invalid subtitle data.' }
  }

  // Word timings are optional — only required when an animated style
  // is picked. We accept the same JSON-array shape as `subtitles`.
  let wordTimings: Array<{ word: string; start: number; end: number }> | undefined
  if (wordsJson) {
    try {
      const parsed = JSON.parse(wordsJson)
      if (Array.isArray(parsed)) wordTimings = parsed
    } catch {
      // Bad JSON falls through to undefined → animated styles will
      // gracefully fall back to cue-mode rendering.
    }
  }

  if (subtitles.length === 0)
    return { ok: false, error: 'No subtitles provided.' }

  const gated = await gateOrReturn(workspaceId, 'video_render')
  if (gated) return gated

  const result = await burnCaptions({
    videoUrl,
    subtitles,
    wordTimings,
    uiStyle,
    aspectRatio,
  })

  if (!result.ok) return result
  const renderRowId = await persistRender({
    kind: 'burn_captions',
    renderId: result.renderId,
    workspaceId,
    contentId,
    metadata: { style: uiStyle, aspectRatio, subtitleCount: subtitles.length },
  })
  return { ok: true, renderId: result.renderId, renderRowId }
}

/* ═══ 2. Assemble B-Roll Video ══════════════════════════════════ */

export async function assembleBRollAction(
  _prev: VideoActionResult,
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() || null
  const contentId = formData.get('content_id')?.toString() || null
  const clipsJson = formData.get('clips')?.toString() ?? '[]'
  const audioUrl = formData.get('audio_url')?.toString() || undefined
  const subtitlesJson = formData.get('subtitles')?.toString() ?? '[]'
  const aspectRatio = (formData.get('aspect_ratio')?.toString() ?? '9:16') as
    | '9:16'
    | '16:9'
    | '1:1'

  let clips: Array<{
    videoUrl: string
    startSecond: number
    durationSeconds: number
  }>
  let subtitles: Array<{ text: string; start: number; end: number }>

  try {
    clips = JSON.parse(clipsJson)
    subtitles = JSON.parse(subtitlesJson)
  } catch {
    return { ok: false, error: 'Invalid clip/subtitle data.' }
  }

  if (clips.length === 0) return { ok: false, error: 'No B-Roll clips.' }

  const gated = await gateOrReturn(workspaceId, 'video_render')
  if (gated) return gated

  const result = await assembleBRollVideo({
    brollClips: clips,
    audioUrl,
    subtitles: subtitles.length > 0 ? subtitles : undefined,
    aspectRatio,
  })

  if (!result.ok) return result
  const renderRowId = await persistRender({
    kind: 'assemble_broll',
    renderId: result.renderId,
    workspaceId,
    contentId,
    metadata: {
      aspectRatio,
      clipCount: clips.length,
      hasAudio: Boolean(audioUrl),
    },
  })
  return { ok: true, renderId: result.renderId, renderRowId }
}

/* ═══ 3. Render Branded Video ═══════════════════════════════════ */

export async function renderBrandedAction(
  _prev: VideoActionResult,
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() || null
  const contentId = formData.get('content_id')?.toString() || null
  const videoUrl = formData.get('video_url')?.toString() ?? ''
  const duration = parseFloat(formData.get('duration')?.toString() ?? '30')
  const introText = formData.get('intro_text')?.toString() || undefined
  const outroText = formData.get('outro_text')?.toString() || undefined
  const accentColor = formData.get('accent_color')?.toString() ?? '#7c3aed'
  const logoUrl = formData.get('logo_url')?.toString() || undefined
  const aspectRatio = (formData.get('aspect_ratio')?.toString() ?? '9:16') as
    | '9:16'
    | '16:9'
    | '1:1'

  if (!videoUrl) return { ok: false, error: 'No video URL.' }

  const gated = await gateOrReturn(workspaceId, 'video_render')
  if (gated) return gated

  const result = await renderBrandedVideo({
    videoUrl,
    videoDuration: duration,
    template: { introText, outroText, accentColor, logoUrl },
    aspectRatio,
  })

  if (!result.ok) return result
  const renderRowId = await persistRender({
    kind: 'branded_video',
    renderId: result.renderId,
    workspaceId,
    contentId,
    metadata: {
      aspectRatio,
      introText: introText ?? null,
      outroText: outroText ?? null,
      accentColor,
    },
  })
  return { ok: true, renderId: result.renderId, renderRowId }
}

/* ═══ 4. Clip Video ═════════════════════════════════════════════ */

export async function clipVideoAction(
  _prev: VideoActionResult,
  formData: FormData,
): Promise<VideoActionResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() || null
  const contentId = formData.get('content_id')?.toString() || null
  const videoUrl = formData.get('video_url')?.toString() ?? ''
  const startSeconds = parseFloat(formData.get('start_seconds')?.toString() ?? '0')
  const endSeconds = parseFloat(formData.get('end_seconds')?.toString() ?? '60')
  const aspectRatio = (formData.get('aspect_ratio')?.toString() ?? '9:16') as
    | '9:16'
    | '16:9'
    | '1:1'

  if (!videoUrl) return { ok: false, error: 'No video URL.' }

  const gated = await gateOrReturn(workspaceId, 'video_render')
  if (gated) return gated

  const result = await clipVideo({
    videoUrl,
    startSeconds,
    endSeconds,
    aspectRatio,
  })

  if (!result.ok) return result
  const renderRowId = await persistRender({
    kind: 'clip',
    renderId: result.renderId,
    workspaceId,
    contentId,
    metadata: { aspectRatio, startSeconds, endSeconds },
  })
  return { ok: true, renderId: result.renderId, renderRowId }
}

/* ═══ 5. Batch Clip Video ═══════════════════════════════════════ */

export async function batchClipAction(
  _prev: BatchResult,
  formData: FormData,
): Promise<BatchResult> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() || null
  const contentId = formData.get('content_id')?.toString() || null
  const videoUrl = formData.get('video_url')?.toString() ?? ''
  const clipsJson = formData.get('clips')?.toString() ?? '[]'
  const aspectRatio = (formData.get('aspect_ratio')?.toString() ?? '9:16') as
    | '9:16'
    | '16:9'
    | '1:1'

  if (!videoUrl) return { ok: false, error: 'No video URL.' }

  let clips: Array<{ startSeconds: number; endSeconds: number; label?: string }>
  try {
    clips = JSON.parse(clipsJson)
  } catch {
    return { ok: false, error: 'Invalid clips data.' }
  }

  if (clips.length === 0) return { ok: false, error: 'No clips defined.' }

  const gated = await gateOrReturn(workspaceId, 'video_render')
  if (gated) return gated

  const renders = await batchClipVideo({ videoUrl, clips, aspectRatio })

  // Persist every successful submit in parallel.
  const withRowIds = await Promise.all(
    renders.map(async (r) => {
      if (!r.renderId) return r
      const renderRowId = await persistRender({
        kind: 'clip',
        renderId: r.renderId,
        workspaceId,
        contentId,
        metadata: { aspectRatio, label: r.label ?? null, batch: true },
      })
      return { ...r, renderRowId }
    }),
  )
  return { ok: true, renders: withRowIds }
}
