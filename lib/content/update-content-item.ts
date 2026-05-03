import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { ContentStatus, Json } from '@/lib/supabase/types'
import { wakeRunsWaitingOn } from '@/lib/agent/state'
import { log } from '@/lib/log'

export interface UpdateContentItemPatch {
  status?: ContentStatus
  source_url?: string | null
  transcript?: string | null
  title?: string | null
  metadata?: Json
  /** Sub-phase shown in the Recent-Imports-Strip + per-video status banner.
   *  Free-form text (queued | uploading | detect | transcribe | index | …).
   *  Reset to null when status flips to ready/failed. */
  processing_phase?: string | null
  /** 0-100 progress hint within the current phase. Optional. */
  processing_progress?: number | null
}

export type UpdateContentItemResult =
  | { ok: true }
  | { ok: false; error: string; notFound?: boolean }

/**
 * Scoped update keyed on (id, workspace_id) to prevent accidental
 * cross-workspace writes. Optional predicate parameters let the caller
 * enforce state-machine invariants (e.g. "only transition to processing
 * if the row is currently uploading") as an optimistic lock.
 */
export async function updateContentItem(
  id: string,
  workspaceId: string,
  patch: UpdateContentItemPatch,
  predicate?: { status?: ContentStatus },
): Promise<UpdateContentItemResult> {
  const supabase = createClient()

  let query = supabase
    .from('content_items')
    .update(patch)
    .eq('id', id)
    .eq('workspace_id', workspaceId)

  if (predicate?.status) {
    query = query.eq('status', predicate.status)
  }

  const { data, error } = await query.select('id').maybeSingle()

  if (error) {
    log.error('updateContentItem failed', error)
    return { ok: false, error: 'Could not update content item.' }
  }

  if (!data) {
    return { ok: false, error: 'Content item not found or state changed.', notFound: true }
  }

  // Wake any parked agent runs that were waiting on this content item's
  // transition to a terminal status (`ready` or `failed`). Best-effort —
  // if the wake call fails the cron sweep at /api/cron/agent-tick picks
  // it up later. Async-firing without await would risk an
  // already-cleaned-up runtime; we await but tolerate errors.
  if (patch.status === 'ready' || patch.status === 'failed') {
    try {
      await wakeRunsWaitingOn({
        kind: 'content_item_status',
        id,
        expected: patch.status,
      })
    } catch (err) {
      log.warn('updateContentItem wake-runs failed', {
        contentId: id,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { ok: true }
}
