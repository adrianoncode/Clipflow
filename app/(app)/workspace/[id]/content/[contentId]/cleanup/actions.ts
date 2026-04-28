'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { checkRenderQuota } from '@/lib/billing/check-feature'
import {
  buildKeepRanges,
  detectFillers,
  type FillerLanguage,
} from '@/lib/cleanup/detect-fillers'
import { getContentItem } from '@/lib/content/get-content-item'
import { getLongLivedSourceUrl } from '@/lib/content/get-signed-url'
import { createClient } from '@/lib/supabase/server'

/**
 * Audio-cleanup actions.
 *
 * Two server actions live here:
 *
 *   1. analyzeFillersAction — re-runs detection over the transcript
 *      with a user-chosen language. Returns the hits + savings so the
 *      browser editor can render its toggle list. Stateless.
 *
 *   2. submitCleanupRenderAction — accepts a list of cut indices the
 *      user toggled, produces a Shotstack edit timeline that splices
 *      the kept ranges, and submits the render. Persists the choice
 *      in content_items.metadata so the Cleanup tab can recover state
 *      on reload.
 *
 * Both actions verify workspace membership and (for the renderer) the
 * monthly render quota — same gate as the highlights pipeline.
 */

// ─── Shared helpers ────────────────────────────────────────────────────

const LANGUAGES: ReadonlyArray<FillerLanguage> = ['en', 'de', 'es', 'auto']

function pickLanguage(raw: string | null | undefined): FillerLanguage {
  if (!raw) return 'auto'
  return LANGUAGES.includes(raw as FillerLanguage)
    ? (raw as FillerLanguage)
    : 'auto'
}

interface WordTimingsRow {
  word: string
  start: number
  end: number
}

async function loadWordTimings(
  contentId: string,
): Promise<WordTimingsRow[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('content_items')
    .select('transcript_words, metadata')
    .eq('id', contentId)
    .maybeSingle()
  if (!data) return []
  const direct = (data as { transcript_words?: unknown }).transcript_words
  const fromColumn = normalizeWords(direct)
  if (fromColumn) return fromColumn
  const meta = (data as { metadata?: unknown }).metadata
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    const fromMeta = normalizeWords(
      (meta as Record<string, unknown>).word_timestamps,
    )
    if (fromMeta) return fromMeta
  }
  return []
}

function normalizeWords(raw: unknown): WordTimingsRow[] | null {
  if (!Array.isArray(raw)) return null
  const out: WordTimingsRow[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as Record<string, unknown>
    const word = typeof e.word === 'string' ? e.word : null
    const start = typeof e.start === 'number' ? e.start : null
    const end = typeof e.end === 'number' ? e.end : null
    if (!word || start === null || end === null) continue
    out.push({ word, start, end })
  }
  return out.length > 0 ? out : null
}

// ─── analyzeFillersAction ──────────────────────────────────────────────

export type AnalyzeFillersState =
  | { ok?: undefined }
  | {
      ok: true
      language: Exclude<FillerLanguage, 'auto'>
      totalSavingsSeconds: number
      byMatch: Record<string, number>
      hits: Array<{
        index: number
        match: string
        phraseStart: boolean
        phraseLength: number
      }>
    }
  | { ok: false; error: string }

const analyzeSchema = z.object({
  workspaceId: z.string().uuid(),
  contentId: z.string().uuid(),
  language: z.string().optional(),
})

export async function analyzeFillersAction(
  _prev: AnalyzeFillersState,
  formData: FormData,
): Promise<AnalyzeFillersState> {
  const parsed = analyzeSchema.safeParse({
    workspaceId: formData.get('workspace_id'),
    contentId: formData.get('content_id'),
    language: formData.get('language'),
  })
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input.' }
  }

  const member = await requireWorkspaceMember(parsed.data.workspaceId)
  if (!member.ok) return { ok: false, error: 'Not a member.' }

  const item = await getContentItem(parsed.data.contentId, parsed.data.workspaceId)
  if (!item) return { ok: false, error: 'Content not found.' }

  const words = await loadWordTimings(parsed.data.contentId)
  if (words.length === 0) {
    return {
      ok: false,
      error:
        'Word-level timings are missing for this video. Re-transcribe to enable cleanup.',
    }
  }

  const result = detectFillers(words, pickLanguage(parsed.data.language))
  return {
    ok: true,
    language: result.resolvedLanguage,
    totalSavingsSeconds: result.totalSavingsSeconds,
    byMatch: result.byMatch,
    hits: result.hits,
  }
}

// ─── submitCleanupRenderAction ─────────────────────────────────────────

export type CleanupRenderState =
  | { ok?: undefined }
  | { ok: true; renderId: string; rangeCount: number }
  | { ok: false; error: string }

const renderSchema = z.object({
  workspaceId: z.string().uuid(),
  contentId: z.string().uuid(),
  /** Cut indices as a comma-separated list (form-friendly). */
  cutIndices: z.string().optional(),
  language: z.string().optional(),
})

export async function submitCleanupRenderAction(
  _prev: CleanupRenderState,
  formData: FormData,
): Promise<CleanupRenderState> {
  const parsed = renderSchema.safeParse({
    workspaceId: formData.get('workspace_id'),
    contentId: formData.get('content_id'),
    cutIndices: formData.get('cut_indices'),
    language: formData.get('language'),
  })
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input.' }
  }

  const member = await requireWorkspaceMember(parsed.data.workspaceId)
  if (!member.ok) return { ok: false, error: 'Not a member.' }
  if (member.role !== 'owner' && member.role !== 'editor') {
    return { ok: false, error: 'Only owners and editors can render.' }
  }

  // Same monthly-render gate the highlights / video tools use. Drops
  // the request before we burn any Shotstack credit.
  const quota = await checkRenderQuota(parsed.data.workspaceId, 'video_render')
  if (!quota.ok) {
    return { ok: false, error: quota.message ?? 'Render quota exceeded.' }
  }

  const item = await getContentItem(parsed.data.contentId, parsed.data.workspaceId)
  if (!item) return { ok: false, error: 'Content not found.' }

  const sourceUrl = item.source_url
    ? await getLongLivedSourceUrl(item.source_url)
    : null
  if (!sourceUrl) {
    return { ok: false, error: 'Source video URL is not available.' }
  }

  const words = await loadWordTimings(parsed.data.contentId)
  if (words.length === 0) {
    return { ok: false, error: 'Word-level timings missing — cannot cut.' }
  }

  // Parse the cut-indices form field. Empty → "no cuts" → renders the
  // original timeline; the user gets a render anyway because it's a
  // useful "render with current settings" affordance.
  const cutIndexSet = new Set<number>()
  if (parsed.data.cutIndices) {
    for (const raw of parsed.data.cutIndices.split(',')) {
      const n = Number.parseInt(raw.trim(), 10)
      if (Number.isFinite(n) && n >= 0 && n < words.length) {
        cutIndexSet.add(n)
      }
    }
  }

  const ranges = buildKeepRanges(words, cutIndexSet)
  if (ranges.length === 0) {
    return { ok: false, error: 'Nothing to render — every word is cut.' }
  }

  // Lazy-load the renderer so build/dev-server don't warm Shotstack
  // until someone actually submits a cleanup render.
  const { submitCutTimelineRender } = await import('@/lib/cleanup/render-cuts')
  const submitted = await submitCutTimelineRender({
    workspaceId: parsed.data.workspaceId,
    sourceVideoUrl: sourceUrl,
    keepRanges: ranges,
    aspectRatio: '9:16',
  })
  if (!submitted.ok) return submitted

  // Persist the cut decisions so the editor can recover state on
  // reload. We store the indices + language in a top-level
  // `cleanup` key on metadata to keep the column shape stable.
  try {
    const supabase = createClient()
    const { data: row } = await supabase
      .from('content_items')
      .select('metadata')
      .eq('id', parsed.data.contentId)
      .maybeSingle()
    const meta = (row?.metadata ?? {}) as Record<string, unknown>
    meta.cleanup = {
      cutIndices: Array.from(cutIndexSet),
      language: pickLanguage(parsed.data.language),
      lastRenderId: submitted.renderId,
      lastRenderAt: new Date().toISOString(),
    }
    // Cast through unknown — the metadata column is typed as Json but
    // the cleanup object is JSON-shaped (numbers + strings) so the
    // round-trip is safe.
    await supabase
      .from('content_items')
      .update({ metadata: meta as unknown as Record<string, never> })
      .eq('id', parsed.data.contentId)
  } catch {
    // Non-fatal — the render still went out.
  }

  revalidatePath(
    `/workspace/${parsed.data.workspaceId}/content/${parsed.data.contentId}/cleanup`,
  )
  return {
    ok: true,
    renderId: submitted.renderId,
    rangeCount: ranges.length,
  }
}
