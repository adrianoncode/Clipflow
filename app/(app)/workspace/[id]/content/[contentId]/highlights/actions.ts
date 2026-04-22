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

/**
 * Longer window than most actions because detection + multiple
 * Shotstack render submissions can run back-to-back when the user
 * clicks "find + render all".
 */
export const maxDuration = 120

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
  caption_style: z
    .enum(['tiktok-bold', 'minimal', 'neon', 'white-bar'])
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

  const supabase = createClient()
  const { data: row } = await supabase
    .from('content_highlights')
    .select(
      'id, content_id, workspace_id, start_seconds, end_seconds, hook_text, status, caption_style, aspect_ratio',
    )
    .eq('id', highlight_id)
    .eq('workspace_id', workspace_id)
    .maybeSingle()

  if (!row) return { ok: false, error: 'Highlight not found.' }
  if (row.status === 'rendering') {
    return { ok: false, error: 'This clip is already rendering.' }
  }

  const item = await getContentItem(row.content_id as string, workspace_id)
  if (!item) return { ok: false, error: 'Parent content item missing.' }
  if (!item.source_url) {
    return { ok: false, error: 'Source video missing — cannot render.' }
  }

  const sourceVideoUrl = await getLongLivedSourceUrl(item.source_url)
  if (!sourceVideoUrl) {
    return { ok: false, error: 'Could not resolve source video URL.' }
  }

  // Word timings come off the parent content item (see comment in
  // findViralMomentsAction — same two-source fallback).
  const { data: wordsRow } = await supabase
    .from('content_items')
    .select('transcript_words, metadata')
    .eq('id', row.content_id as string)
    .maybeSingle()
  const wordTimings = extractWordTimings(wordsRow)

  // Studio-plan workspaces get priority queue — same flag used by
  // render_priority and outputs.
  const plan = await getWorkspacePlan(workspace_id)
  const priority = checkPlanAccess(plan, 'priorityRenders') ? 'high' : 'normal'

  const result = await renderHighlightClip({
    workspaceId: workspace_id,
    sourceVideoUrl,
    clipStartSeconds: Number(row.start_seconds),
    clipEndSeconds: Number(row.end_seconds),
    hookText: (row.hook_text as string | null) ?? undefined,
    wordTimings,
    fallbackSubtitleText: item.transcript,
    captionStyle: (caption_style ?? (row.caption_style as string)) as
      | 'tiktok-bold'
      | 'minimal'
      | 'neon'
      | 'white-bar',
    aspectRatio: ((row.aspect_ratio as string) ?? '9:16') as '9:16',
    priority,
  })

  if (!result.ok) {
    // Mark failed so the UI can surface the error without a fresh retry.
    await supabase
      .from('content_highlights')
      .update({ status: 'failed', render_error: result.error })
      .eq('id', highlight_id)
    return { ok: false, error: result.error }
  }

  await supabase
    .from('content_highlights')
    .update({
      status: 'rendering',
      render_id: result.renderId,
      render_error: null,
      ...(caption_style ? { caption_style } : {}),
    })
    .eq('id', highlight_id)

  revalidatePath(`/workspace/${workspace_id}/content/${row.content_id}/highlights`)
  return { ok: true, renderId: result.renderId }
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
