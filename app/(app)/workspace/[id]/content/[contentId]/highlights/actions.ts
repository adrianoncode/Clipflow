'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import { getContentItem } from '@/lib/content/get-content-item'
import { getLongLivedSourceUrl } from '@/lib/content/get-signed-url'
import {
  detectViralMoments,
  type WordTiming,
} from '@/lib/highlights/detect-viral-moments'
import { renderHighlightClip } from '@/lib/highlights/render-highlight-clip'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess } from '@/lib/billing/plans'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'

// NOTE: maxDuration lives on the page.tsx for this route — 'use server'
// action files may only export async functions, so module-level config
// has to ride on the consuming page.

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const findSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

const renderSchema = z.object({
  workspace_id: z.string().uuid(),
  highlight_id: z.string().uuid(),
  // Two extra animated styles since the v2 subtitles editor —
  // 'karaoke' and 'beasty'. Existing rows continue to work; the
  // underlying clip-render maps any of these to the right HTML.
  caption_style: z
    .enum(['tiktok-bold', 'minimal', 'neon', 'white-bar', 'karaoke', 'beasty'])
    .optional(),
})

const deleteSchema = z.object({
  workspace_id: z.string().uuid(),
  highlight_id: z.string().uuid(),
})

// ---------------------------------------------------------------------------
// Find viral moments
// ---------------------------------------------------------------------------

export type FindMomentsState =
  | { ok?: undefined; error?: string }
  | { ok: true; count: number }
  | { ok: false; error: string; code?: 'no_key' | 'no_transcript' | 'rate_limit' | 'unknown' }

/**
 * Runs GPT on the content item's transcript + word-timings, then
 * persists each returned moment as a `draft` content_highlight row.
 * Does NOT submit any Shotstack renders — that's the user's explicit
 * next step, so they only spend Shotstack credits on clips they want.
 */
export async function findViralMomentsAction(
  _prev: FindMomentsState,
  formData: FormData,
): Promise<FindMomentsState> {
  const parsed = findSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) {
    return { ok: false, error: 'Invalid request.' }
  }

  const { workspace_id, content_id } = parsed.data

  const check = await requireWorkspaceMember(workspace_id)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only editors and owners can run highlight detection.' }
  }

  // Rate-limit at the user scope — this is an expensive call (~1-3¢
  // per run on gpt-4o-mini for a 1h podcast) and gating it prevents
  // a browser script from burning the workspace's AI budget.
  const rl = await checkRateLimit(
    `ai:highlights:${check.userId}`,
    RATE_LIMITS.generation.limit,
    RATE_LIMITS.generation.windowMs,
  )
  if (!rl.ok) {
    return {
      ok: false,
      error: 'You\u2019re running detection too fast. Wait a minute and try again.',
      code: 'rate_limit',
    }
  }

  const item = await getContentItem(content_id, workspace_id)
  if (!item) return { ok: false, error: 'Content item not found.' }

  if (!item.transcript || item.transcript.trim().length < 200) {
    return {
      ok: false,
      error:
        'This item has no transcript yet. Wait for transcription to finish or re-run it from the content page.',
      code: 'no_transcript',
    }
  }

  // Resolve OpenAI key
  const keyResult = await getDecryptedAiKey(workspace_id, 'openai')
  if (!keyResult.ok) {
    return {
      ok: false,
      error:
        keyResult.code === 'no_key'
          ? 'Connect an OpenAI key in Settings → AI Keys before running highlight detection.'
          : keyResult.message,
      code: 'no_key',
    }
  }

  // Word timings live in two places for back-compat:
  //   1. content_items.transcript_words (new dedicated column)
  //   2. content_items.metadata.word_timestamps (written by the
  //      existing subtitles flow — lots of rows already carry it)
  // Prefer (1), fall back to (2). Falling through to null is also
  // fine — detection + render both degrade gracefully.
  const supabase = createClient()
  const { data: rawRow } = await supabase
    .from('content_items')
    .select('transcript_words, metadata')
    .eq('id', content_id)
    .maybeSingle()
  const wordTimings = extractWordTimings(rawRow)

  const detection = await detectViralMoments({
    apiKey: keyResult.plaintext,
    transcriptText: item.transcript,
    wordTimings,
  })
  if (!detection.ok) {
    return { ok: false, error: detection.error }
  }

  // Insert drafts — use admin client so the batch insert isn't
  // slowed by per-row RLS evaluation. Workspace membership was
  // already enforced above.
  const admin = createAdminClient()
  const rows = detection.moments.map((m) => ({
    content_id,
    workspace_id,
    start_seconds: m.start_seconds,
    end_seconds: m.end_seconds,
    hook_text: m.hook_text,
    reason: m.reason,
    virality_score: m.virality_score,
    status: 'draft' as const,
    created_by: check.userId,
  }))

  const { error: insertError } = await admin.from('content_highlights').insert(rows)
  if (insertError) {
    log.error('findViralMomentsAction insert failed', insertError)
    return { ok: false, error: 'Could not save the detected moments.' }
  }

  revalidatePath(`/workspace/${workspace_id}/content/${content_id}/highlights`)
  return { ok: true, count: rows.length }
}

// ---------------------------------------------------------------------------
// Render a single highlight
// ---------------------------------------------------------------------------

export type RenderHighlightState =
  | { ok?: undefined; error?: string }
  | { ok: true; renderId: string }
  | { ok: false; error: string }

export async function renderHighlightAction(
  _prev: RenderHighlightState,
  formData: FormData,
): Promise<RenderHighlightState> {
  const parsed = renderSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    highlight_id: formData.get('highlight_id'),
    caption_style: formData.get('caption_style') ?? undefined,
  })
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const { workspace_id, highlight_id, caption_style } = parsed.data

  const check = await requireWorkspaceMember(workspace_id)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only editors and owners can render highlights.' }
  }

  const outcome = await submitHighlightRender({
    workspaceId: workspace_id,
    highlightId: highlight_id,
    captionStyleOverride: caption_style,
  })

  if (!outcome.ok) return outcome
  revalidatePath(`/workspace/${workspace_id}/content/${outcome.contentId}/highlights`)
  return { ok: true, renderId: outcome.renderId }
}

/**
 * Shared submit path used by renderHighlightAction and the batch
 * render-all action. Pulls the highlight row, validates, calls
 * Shotstack via renderHighlightClip, then flips the row to
 * `rendering` or `failed` exactly once.
 *
 * Returns `contentId` on success so callers can revalidate the
 * correct highlights page. Skips items already in `rendering`.
 */
async function submitHighlightRender(params: {
  workspaceId: string
  highlightId: string
  captionStyleOverride?:
    | 'tiktok-bold'
    | 'minimal'
    | 'neon'
    | 'white-bar'
    | 'karaoke'
    | 'beasty'
}): Promise<
  | { ok: true; renderId: string; contentId: string }
  | { ok: false; error: string; skipped?: boolean }
> {
  const { workspaceId, highlightId, captionStyleOverride } = params
  const supabase = createClient()

  const { data: row } = await supabase
    .from('content_highlights')
    .select(
      'id, content_id, workspace_id, start_seconds, end_seconds, hook_text, status, caption_style, aspect_ratio, crop_x, metadata',
    )
    .eq('id', highlightId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!row) return { ok: false, error: 'Highlight not found.' }
  if (row.status === 'rendering') {
    return { ok: false, error: 'Already rendering.', skipped: true }
  }

  const item = await getContentItem(row.content_id as string, workspaceId)
  if (!item) return { ok: false, error: 'Parent content item missing.' }
  if (!item.source_url) {
    return { ok: false, error: 'Source video missing — cannot render.' }
  }

  const sourceVideoUrl = await getLongLivedSourceUrl(item.source_url)
  if (!sourceVideoUrl) {
    return { ok: false, error: 'Could not resolve source video URL.' }
  }

  const { data: wordsRow } = await supabase
    .from('content_items')
    .select('transcript_words, metadata')
    .eq('id', row.content_id as string)
    .maybeSingle()
  const wordTimings = extractWordTimings(wordsRow)

  const plan = await getWorkspacePlan(workspaceId)
  const priority = checkPlanAccess(plan, 'priorityRenders') ? 'high' : 'normal'

  const captionStyle = (captionStyleOverride ??
    (row.caption_style as string)) as
    | 'tiktok-bold'
    | 'minimal'
    | 'neon'
    | 'white-bar'

  const cropX = (row as { crop_x: unknown }).crop_x
  const cropXNum = typeof cropX === 'number' ? cropX : cropX != null ? Number(cropX) : null

  // Pull Phase A1 edits (metadata.edits) if the user tuned anything
  // in the preview editor. Null/missing = use defaults.
  const meta =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {}
  const edits =
    meta.edits && typeof meta.edits === 'object' && !Array.isArray(meta.edits)
      ? (meta.edits as Record<string, unknown>)
      : {}
  const customCaptionText =
    typeof edits.customCaptionText === 'string' && edits.customCaptionText.trim()
      ? edits.customCaptionText.trim()
      : null
  const audioGainDb =
    typeof edits.audioGainDb === 'number' ? edits.audioGainDb : null
  const thumbnailSeconds =
    typeof edits.thumbnailSeconds === 'number' ? edits.thumbnailSeconds : null
  // Phase A2 — validate shape before forwarding to renderer so bad
  // client data never makes it to Shotstack.
  const captionChunks = Array.isArray(edits.captionChunks)
    ? (edits.captionChunks as unknown[])
        .filter(
          (c): c is {
            text: string
            startSeconds: number
            lengthSeconds: number
          } =>
            typeof c === 'object' &&
            c !== null &&
            typeof (c as { text?: unknown }).text === 'string' &&
            typeof (c as { startSeconds?: unknown }).startSeconds === 'number' &&
            typeof (c as { lengthSeconds?: unknown }).lengthSeconds === 'number',
        )
        .map((c) => ({
          text: c.text.trim().slice(0, 120),
          startSeconds: c.startSeconds,
          lengthSeconds: c.lengthSeconds,
        }))
    : null
  const brollOverlays = Array.isArray(edits.brollOverlays)
    ? (edits.brollOverlays as unknown[])
        .filter(
          (o): o is {
            videoUrl: string
            startSeconds: number
            lengthSeconds: number
            opacity: number
            kind?: string
          } =>
            typeof o === 'object' &&
            o !== null &&
            typeof (o as { videoUrl?: unknown }).videoUrl === 'string' &&
            typeof (o as { startSeconds?: unknown }).startSeconds === 'number' &&
            typeof (o as { lengthSeconds?: unknown }).lengthSeconds === 'number' &&
            typeof (o as { opacity?: unknown }).opacity === 'number',
        )
        .map((o) => ({
          videoUrl: o.videoUrl,
          startSeconds: o.startSeconds,
          lengthSeconds: o.lengthSeconds,
          opacity: Math.max(0, Math.min(1, o.opacity)),
          kind:
            o.kind === 'image' || o.kind === 'video'
              ? (o.kind as 'image' | 'video')
              : ('video' as const),
        }))
    : null

  const result = await renderHighlightClip({
    workspaceId,
    sourceVideoUrl,
    clipStartSeconds: Number(row.start_seconds),
    clipEndSeconds: Number(row.end_seconds),
    hookText: (row.hook_text as string | null) ?? undefined,
    wordTimings,
    fallbackSubtitleText: item.transcript,
    captionStyle,
    // Pinterest pins are 2:3 vertical (1000×1500), every other
    // platform short-form is 9:16. The DB column allows arbitrary
    // strings so we narrow defensively here — invalid values fall
    // back to 9:16 rather than tripping Shotstack.
    aspectRatio: ((row.aspect_ratio as string) === '2:3' ? '2:3' : '9:16') as
      | '9:16'
      | '2:3',
    priority,
    cropX: cropXNum,
    customCaptionText,
    audioGainDb,
    thumbnailSeconds,
    captionChunks,
    brollOverlays,
  })

  if (!result.ok) {
    await supabase
      .from('content_highlights')
      .update({ status: 'failed', render_error: result.error })
      .eq('id', highlightId)
    return { ok: false, error: result.error }
  }

  await supabase
    .from('content_highlights')
    .update({
      status: 'rendering',
      render_id: result.renderId,
      render_error: null,
      ...(captionStyleOverride ? { caption_style: captionStyleOverride } : {}),
    })
    .eq('id', highlightId)

  return {
    ok: true,
    renderId: result.renderId,
    contentId: row.content_id as string,
  }
}

// ---------------------------------------------------------------------------
// Adjust (bounds + crop_x + caption_style) — called by the preview editor
// ---------------------------------------------------------------------------

const adjustSchema = z.object({
  workspace_id: z.string().uuid(),
  highlight_id: z.string().uuid(),
  start_seconds: z.coerce.number().nonnegative(),
  end_seconds: z.coerce.number().positive(),
  crop_x: z
    .union([z.coerce.number().min(-0.5).max(0.5), z.literal('')])
    .optional(),
  caption_style: z
    .enum(['tiktok-bold', 'minimal', 'neon', 'white-bar', 'karaoke', 'beasty'])
    .optional(),
  hook_text: z.string().max(120).optional(),

  // ── Phase A1 edits — stored in metadata.edits jsonb so we don't
  //    need new columns per knob. Shotstack render reads from here.
  /** User-typed override for the caption text. Empty/null = use
   *  auto-generated karaoke captions from word timings. */
  custom_caption_text: z
    .union([z.string().max(500), z.literal('')])
    .optional(),
  /** Audio gain in dB relative to the source (-20 .. +10). 0 = no
   *  change. Shotstack supports volume 0..1, we map linearly. */
  audio_gain_db: z
    .union([z.coerce.number().min(-20).max(10), z.literal('')])
    .optional(),
  /** Seconds into the CLIP (not the source) where the poster frame
   *  should be captured. Null = Shotstack default at 1.5s. */
  thumbnail_seconds: z
    .union([z.coerce.number().min(0).max(180), z.literal('')])
    .optional(),

  // ── Phase A2: caption chunks + B-Roll overlays ──
  /** JSON-encoded array of user-edited caption chunks. Empty / null
   *  string means "don't override, use auto-chunks at render time."
   *  Shape per item: { text, startSeconds, lengthSeconds } */
  caption_chunks: z
    .union([z.string().max(20_000), z.literal('')])
    .optional(),
  /** JSON-encoded array of B-Roll overlay entries.
   *  Shape per item: { videoUrl, startSeconds, lengthSeconds, opacity, kind } */
  broll_overlays: z
    .union([z.string().max(20_000), z.literal('')])
    .optional(),
})

export type AdjustHighlightState =
  | { ok?: undefined; error?: string }
  | { ok: true }
  | { ok: false; error: string }

/**
 * Applies user edits from the clip-preview editor to a draft highlight.
 * Blocks edits to rendering/ready clips — once credits are spent the
 * bounds are locked (users should delete + regenerate instead).
 */
export async function adjustHighlightAction(
  _prev: AdjustHighlightState,
  formData: FormData,
): Promise<AdjustHighlightState> {
  const parsed = adjustSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    highlight_id: formData.get('highlight_id'),
    start_seconds: formData.get('start_seconds'),
    end_seconds: formData.get('end_seconds'),
    crop_x: formData.get('crop_x') ?? undefined,
    caption_style: formData.get('caption_style') ?? undefined,
    hook_text: formData.get('hook_text') ?? undefined,
    custom_caption_text: formData.get('custom_caption_text') ?? undefined,
    audio_gain_db: formData.get('audio_gain_db') ?? undefined,
    thumbnail_seconds: formData.get('thumbnail_seconds') ?? undefined,
    caption_chunks: formData.get('caption_chunks') ?? undefined,
    broll_overlays: formData.get('broll_overlays') ?? undefined,
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid request.',
    }
  }

  const {
    workspace_id,
    highlight_id,
    start_seconds,
    end_seconds,
    crop_x,
    caption_style,
    hook_text,
    custom_caption_text,
    audio_gain_db,
    thumbnail_seconds,
    caption_chunks,
    broll_overlays,
  } = parsed.data

  if (end_seconds <= start_seconds) {
    return { ok: false, error: 'End must be after start.' }
  }
  if (end_seconds - start_seconds > 180) {
    return { ok: false, error: 'Clip can be at most 3 minutes.' }
  }

  const check = await requireWorkspaceMember(workspace_id)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only editors and owners can adjust highlights.' }
  }

  const supabase = createClient()
  const { data: row } = await supabase
    .from('content_highlights')
    .select('id, content_id, status, metadata')
    .eq('id', highlight_id)
    .eq('workspace_id', workspace_id)
    .maybeSingle()

  if (!row) return { ok: false, error: 'Highlight not found.' }
  if (row.status === 'rendering' || row.status === 'ready') {
    return {
      ok: false,
      error: 'This clip has already been rendered. Delete it and regenerate to adjust.',
    }
  }

  // Merge Phase A1 edits into metadata.edits without wiping other
  // metadata the row might carry (e.g. regenerate_count, hook_overrides).
  const existingMeta =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {}
  const existingEdits =
    existingMeta.edits &&
    typeof existingMeta.edits === 'object' &&
    !Array.isArray(existingMeta.edits)
      ? (existingMeta.edits as Record<string, unknown>)
      : {}

  const nextEdits: Record<string, unknown> = { ...existingEdits }
  if (custom_caption_text !== undefined) {
    nextEdits.customCaptionText =
      custom_caption_text === '' ? null : custom_caption_text
  }
  if (audio_gain_db !== undefined) {
    nextEdits.audioGainDb = audio_gain_db === '' ? null : audio_gain_db
  }
  if (thumbnail_seconds !== undefined) {
    nextEdits.thumbnailSeconds =
      thumbnail_seconds === '' ? null : thumbnail_seconds
  }
  // Parse the JSON-encoded arrays from the form. On malformed JSON we
  // drop the field and log — it's safer to lose an edit than to write
  // garbage that breaks the renderer.
  if (caption_chunks !== undefined) {
    if (caption_chunks === '') {
      nextEdits.captionChunks = null
    } else {
      try {
        const parsedChunks = JSON.parse(caption_chunks)
        if (Array.isArray(parsedChunks)) {
          nextEdits.captionChunks = parsedChunks
        }
      } catch (err) {
        log.warn('adjustHighlightAction: malformed caption_chunks JSON', {
          highlightId: highlight_id,
          err: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }
  if (broll_overlays !== undefined) {
    if (broll_overlays === '') {
      nextEdits.brollOverlays = null
    } else {
      try {
        const parsedOverlays = JSON.parse(broll_overlays)
        if (Array.isArray(parsedOverlays)) {
          nextEdits.brollOverlays = parsedOverlays
        }
      } catch (err) {
        log.warn('adjustHighlightAction: malformed broll_overlays JSON', {
          highlightId: highlight_id,
          err: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  const { error } = await supabase
    .from('content_highlights')
    .update({
      start_seconds,
      end_seconds,
      crop_x: crop_x === '' || crop_x == null ? null : crop_x,
      ...(caption_style ? { caption_style } : {}),
      ...(hook_text !== undefined ? { hook_text: hook_text || null } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Json-typed jsonb column from Supabase types
      metadata: { ...existingMeta, edits: nextEdits } as any,
    })
    .eq('id', highlight_id)

  if (error) {
    log.error('adjustHighlightAction failed', error)
    return { ok: false, error: 'Could not save your edits.' }
  }

  revalidatePath(`/workspace/${workspace_id}/content/${row.content_id}/highlights`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Batch render — submit every remaining draft in one click
// ---------------------------------------------------------------------------

const renderAllSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export type RenderAllState =
  | { ok?: undefined; error?: string }
  | { ok: true; submitted: number; failed: number }
  | { ok: false; error: string }

export async function renderAllHighlightsAction(
  _prev: RenderAllState,
  formData: FormData,
): Promise<RenderAllState> {
  const parsed = renderAllSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const { workspace_id, content_id } = parsed.data

  const check = await requireWorkspaceMember(workspace_id)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only editors and owners can render highlights.' }
  }

  const supabase = createClient()
  // Only consider `draft` and previously-`failed` rows — rendering
  // items are already in-flight, ready items have a final URL.
  const { data: rows, error: listError } = await supabase
    .from('content_highlights')
    .select('id, status')
    .eq('content_id', content_id)
    .eq('workspace_id', workspace_id)
    .in('status', ['draft', 'failed'])

  if (listError) {
    log.error('renderAllHighlightsAction listing failed', listError)
    return { ok: false, error: 'Could not list your draft highlights.' }
  }
  if (!rows || rows.length === 0) {
    return { ok: false, error: 'No draft highlights to render.' }
  }

  // Run in small batches so we don't open 8 Shotstack sockets at once
  // on a free/dev tier. Sequential keeps us well under any rate limit.
  let submitted = 0
  let failed = 0
  for (const r of rows) {
    const outcome = await submitHighlightRender({
      workspaceId: workspace_id,
      highlightId: r.id as string,
    })
    if (outcome.ok) submitted += 1
    else if (!outcome.skipped) failed += 1
  }

  revalidatePath(`/workspace/${workspace_id}/content/${content_id}/highlights`)
  return { ok: true, submitted, failed }
}

// ---------------------------------------------------------------------------
// Publish a ready highlight directly to social platforms via Upload-Post
// ---------------------------------------------------------------------------

const publishSchema = z.object({
  workspace_id: z.string().uuid(),
  highlight_id: z.string().uuid(),
  platforms: z.string().optional(), // comma-separated
  caption: z.string().max(2200).optional(),
})

export type PublishHighlightState =
  | { ok?: undefined; error?: string }
  | { ok: true; postIds: Record<string, string> }
  | { ok: false; error: string; code?: 'missing_key' | 'api_error' | 'network' }

export async function publishHighlightAction(
  _prev: PublishHighlightState,
  formData: FormData,
): Promise<PublishHighlightState> {
  const parsed = publishSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    highlight_id: formData.get('highlight_id'),
    platforms: formData.get('platforms') ?? undefined,
    caption: formData.get('caption') ?? undefined,
  })
  if (!parsed.success) return { ok: false, error: 'Invalid request.' }

  const { workspace_id, highlight_id, platforms, caption } = parsed.data

  const check = await requireWorkspaceMember(workspace_id)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only editors and owners can publish.' }
  }

  const supabase = createClient()
  const { data: row } = await supabase
    .from('content_highlights')
    .select('id, content_id, status, video_url, hook_text, reason')
    .eq('id', highlight_id)
    .eq('workspace_id', workspace_id)
    .maybeSingle()

  if (!row) return { ok: false, error: 'Highlight not found.' }
  if (row.status !== 'ready' || !row.video_url) {
    return { ok: false, error: 'This clip has not finished rendering yet.' }
  }

  // Lazy-load the publish router so the action file doesn't pull it
  // (and its deps) into the generation code-path.
  const { publishToSocial } = await import('@/lib/publish/route')

  const ALL_PLATFORMS = [
    'tiktok', 'instagram', 'youtube', 'linkedin', 'facebook', 'x',
  ] as const
  type P = (typeof ALL_PLATFORMS)[number]

  const platformList = platforms
    ?.split(',')
    .map((p) => p.trim())
    .filter((p): p is P => (ALL_PLATFORMS as readonly string[]).includes(p))

  // Default publish set: the Upload-Post bundle (4 platforms) plus
  // whatever Composio channels are connected. Router will skip any
  // platform that isn't wired up.
  const selected: P[] =
    platformList && platformList.length > 0
      ? platformList
      : ['tiktok', 'instagram', 'youtube', 'linkedin']

  const body = (caption || row.hook_text || row.reason || '').trim() || 'New clip'

  const results = await publishToSocial(workspace_id, selected, {
    videoUrl: row.video_url as string,
    caption: body,
  })

  const postIds: Record<string, string> = {}
  for (const r of results) {
    if (r.ok && r.postId) postIds[r.platform] = r.postId
  }

  if (Object.keys(postIds).length === 0) {
    const firstFail = results.find((r) => !r.ok)
    return {
      ok: false,
      error: firstFail?.error ?? 'Publish failed on all selected platforms.',
      code: 'api_error',
    }
  }

  revalidatePath(`/workspace/${workspace_id}/content/${row.content_id}/highlights`)
  return { ok: true, postIds }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteHighlightAction(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  const parsed = deleteSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    highlight_id: formData.get('highlight_id'),
  })
  if (!parsed.success) return { error: 'Invalid request.' }

  const { workspace_id, highlight_id } = parsed.data

  const check = await requireWorkspaceMember(workspace_id)
  if (!check.ok) return { error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { error: 'Only editors and owners can delete highlights.' }
  }

  const supabase = createClient()
  const { data: row } = await supabase
    .from('content_highlights')
    .select('content_id')
    .eq('id', highlight_id)
    .eq('workspace_id', workspace_id)
    .maybeSingle()

  const { error } = await supabase
    .from('content_highlights')
    .delete()
    .eq('id', highlight_id)
    .eq('workspace_id', workspace_id)

  if (error) {
    log.error('deleteHighlightAction failed', error)
    return { error: 'Could not delete this highlight.' }
  }

  if (row?.content_id) {
    revalidatePath(`/workspace/${workspace_id}/content/${row.content_id}/highlights`)
  }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pulls word-timings from a content_items row, checking the dedicated
 * `transcript_words` column first and then falling back to the
 * `metadata.word_timestamps` shape written by the subtitles flow.
 */
function extractWordTimings(
  row: { transcript_words?: unknown; metadata?: unknown } | null,
): WordTiming[] | null {
  if (!row) return null
  const direct = asWordTimings(row.transcript_words)
  if (direct) return direct
  if (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)) {
    const meta = row.metadata as Record<string, unknown>
    const fromMeta = asWordTimings(meta.word_timestamps)
    if (fromMeta) return fromMeta
  }
  return null
}

/**
 * Validates the shape of the transcript_words jsonb so a stale row
 * from a pre-highlights content item can't crash the pipeline.
 */
function asWordTimings(raw: unknown): WordTiming[] | null {
  if (!Array.isArray(raw)) return null
  const out: WordTiming[] = []
  for (const entry of raw) {
    if (
      entry &&
      typeof entry === 'object' &&
      typeof (entry as { word?: unknown }).word === 'string' &&
      typeof (entry as { start?: unknown }).start === 'number' &&
      typeof (entry as { end?: unknown }).end === 'number'
    ) {
      const e = entry as { word: string; start: number; end: number }
      out.push({ word: e.word, start: e.start, end: e.end })
    }
  }
  return out.length > 0 ? out : null
}
