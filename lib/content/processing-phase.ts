import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

/**
 * Allowed sub-phases inside status=uploading|processing. The UI maps
 * each one to a friendly label + ETA hint (see processing-phase-label
 * on the client).
 *
 * `text` in the DB so we can add new phases without a migration. The
 * type narrows the writer side; readers should accept any string and
 * fall back to the generic label when an unknown phase shows up.
 */
export type ProcessingPhase =
  | 'queued'
  | 'uploading'
  | 'detect'
  | 'transcribe'
  | 'index'

/**
 * Lightweight phase update — does not touch status. Use this from the
 * Whisper pipeline at known boundaries (e.g. just before downloading,
 * just before calling Whisper, just after persisting the transcript).
 *
 * Failures are swallowed: phase updates are advisory hints, never load-
 * bearing. The pipeline must keep running even if the phase write fails
 * (network blip, RLS conflict, etc.).
 */
export async function setProcessingPhase(
  contentId: string,
  workspaceId: string,
  phase: ProcessingPhase | null,
  progress: number | null = null,
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('content_items')
    .update({ processing_phase: phase, processing_progress: progress })
    .eq('id', contentId)
    .eq('workspace_id', workspaceId)
  if (error) {
    log.warn('setProcessingPhase failed (advisory only)', {
      contentId,
      phase,
      error: error.message,
    })
  }
}
