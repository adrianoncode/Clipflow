import 'server-only'

import {
  detectViralMoments,
  type WordTiming,
} from '@/lib/highlights/detect-viral-moments'
import { getContentItem } from '@/lib/content/get-content-item'
import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import { matchTrending, transcriptSnippetFor } from '@/lib/trends/match-trending'
import { parseNicheId } from '@/lib/niche/presets'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

export interface FindAndPersistHighlightsInput {
  workspaceId: string
  contentId: string
  /** auth.users.id of the actor; required for content_highlights.created_by. */
  userId: string
}

export type FindAndPersistHighlightsResult =
  | {
      ok: true
      count: number
      highlights: Array<{
        id: string
        start_seconds: number
        end_seconds: number
        hook_text: string | null
        virality_score: number | null
        selected_for_drafts: boolean
      }>
    }
  | {
      ok: false
      error: string
      code: 'no_key' | 'no_transcript' | 'detection_failed' | 'insert_failed' | 'not_found'
    }

/**
 * Lib version of `findViralMomentsAction` minus the FormData unwrap and
 * Next-only revalidatePath. Used by the agent's `find_highlights` tool
 * AND (later) the existing server action — we keep the action calling
 * site intact for now to avoid touching the M3 review surface.
 *
 * Returns the persisted rows so the caller (model in the agent's case)
 * can decide what to do next (render? immediately generate drafts?).
 */
export async function findAndPersistHighlights(
  input: FindAndPersistHighlightsInput,
): Promise<FindAndPersistHighlightsResult> {
  const { workspaceId, contentId, userId } = input

  const item = await getContentItem(contentId, workspaceId)
  if (!item) {
    return { ok: false, code: 'not_found', error: 'Content item not found.' }
  }
  if (!item.transcript || item.transcript.trim().length < 200) {
    return {
      ok: false,
      code: 'no_transcript',
      error:
        'Item has no transcript yet — wait for transcription to finish or import again.',
    }
  }

  const keyResult = await getDecryptedAiKey(workspaceId, 'openai')
  if (!keyResult.ok) {
    return {
      ok: false,
      code: 'no_key',
      error:
        keyResult.code === 'no_key'
          ? 'Connect an OpenAI key in Settings → AI Keys before running highlight detection.'
          : keyResult.message,
    }
  }

  // Word timings — prefer the dedicated column, fall back to legacy
  // metadata.word_timestamps. Mirrors findViralMomentsAction.
  const supabase = createClient()
  const { data: rawRow } = await supabase
    .from('content_items')
    .select('transcript_words, metadata')
    .eq('id', contentId)
    .maybeSingle()
  const wordTimings = extractWordTimings(rawRow)

  const detection = await detectViralMoments({
    apiKey: keyResult.plaintext,
    transcriptText: item.transcript,
    wordTimings,
  })
  if (!detection.ok) {
    return { ok: false, code: 'detection_failed', error: detection.error }
  }

  // Auto-selection knobs (per workspace).
  const { data: workspaceConfig } = await supabase
    .from('workspaces')
    .select('highlight_top_n, highlight_min_score, active_niche')
    .eq('id', workspaceId)
    .maybeSingle()
  const topN = workspaceConfig?.highlight_top_n ?? 3
  const minScore = workspaceConfig?.highlight_min_score ?? 0
  const nicheId = parseNicheId(workspaceConfig?.active_niche)

  // Trend-bonus matching (best-effort — falls through silently if no niche).
  let trendingKeywords: string[] = []
  if (nicheId) {
    const { data: latestFetch } = await supabase
      .from('trending_keywords')
      .select('fetched_at')
      .eq('niche_id', nicheId)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const latestFetchedAt = latestFetch?.fetched_at as string | undefined
    if (latestFetchedAt) {
      const { data: rows } = await supabase
        .from('trending_keywords')
        .select('keyword')
        .eq('niche_id', nicheId)
        .eq('fetched_at', latestFetchedAt)
      trendingKeywords = (rows ?? [])
        .map((r) => (r.keyword as string | null) ?? '')
        .filter((k) => k.length > 0)
    }
  }

  const sourceDuration =
    (item as { duration_seconds?: number | null }).duration_seconds ?? null
  const trendMatches = detection.moments.map((m) => {
    if (trendingKeywords.length === 0) return { matched: [] as string[], bonus: 0 }
    const snippet = transcriptSnippetFor(
      item.transcript ?? '',
      m.start_seconds,
      m.end_seconds,
      sourceDuration,
    )
    return matchTrending({
      hookText: m.hook_text,
      transcriptSnippet: snippet,
      trendingKeywords,
    })
  })

  const eligible = detection.moments
    .map((m, idx) => ({
      idx,
      score: Math.min(100, (m.virality_score ?? 0) + trendMatches[idx]!.bonus),
    }))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score || a.idx - b.idx)
  const topIndices = new Set(eligible.slice(0, topN).map((s) => s.idx))

  const rows = detection.moments.map((m, idx) => ({
    content_id: contentId,
    workspace_id: workspaceId,
    start_seconds: m.start_seconds,
    end_seconds: m.end_seconds,
    hook_text: m.hook_text,
    reason: m.reason,
    virality_score: m.virality_score,
    trending_keywords: trendMatches[idx]!.matched,
    trend_bonus: trendMatches[idx]!.bonus,
    status: 'draft' as const,
    selected_for_drafts: topIndices.has(idx),
    created_by: userId,
  }))

  const admin = createAdminClient()
  const { data: inserted, error: insertError } = await admin
    .from('content_highlights')
    .insert(rows)
    .select(
      'id, start_seconds, end_seconds, hook_text, virality_score, selected_for_drafts',
    )

  if (insertError || !inserted) {
    log.error('findAndPersistHighlights insert failed', insertError)
    return {
      ok: false,
      code: 'insert_failed',
      error: 'Could not save the detected moments.',
    }
  }

  return {
    ok: true,
    count: inserted.length,
    highlights: inserted.map((r: {
      id: string
      start_seconds: number | string
      end_seconds: number | string
      hook_text: string | null
      virality_score: number | string | null
      selected_for_drafts: boolean
    }) => ({
      id: r.id,
      start_seconds: Number(r.start_seconds),
      end_seconds: Number(r.end_seconds),
      hook_text: r.hook_text,
      virality_score: r.virality_score == null ? null : Number(r.virality_score),
      selected_for_drafts: r.selected_for_drafts,
    })),
  }
}

// ── helpers (mirrors findViralMomentsAction) ────────────────────────

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
