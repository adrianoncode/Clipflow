import 'server-only'

import type { PromptOutput } from '@/lib/ai/generate/types'
import { recordOutputVersion } from '@/lib/outputs/record-version'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { log } from '@/lib/log'

export interface UpdateOutputInput {
  outputId: string
  workspaceId: string
  body: string
  structured: PromptOutput
  /** Auth user editing the body — recorded on the new version row. */
  userId?: string | null
}

export type UpdateOutputResult = { ok: true } | { ok: false; error: string }

/**
 * Updates an existing output's body (rendered markdown) and structured
 * metadata. Does NOT create a new output_states row — editing content
 * does not advance the workflow state.
 *
 * Scoped by both id and workspace_id for defense in depth.
 */
export async function updateOutput(input: UpdateOutputInput): Promise<UpdateOutputResult> {
  const supabase = createClient()
  const metadata: Json = { structured: input.structured as unknown as Json }

  const { error } = await supabase
    .from('outputs')
    .update({
      body: input.body,
      metadata,
    })
    .eq('id', input.outputId)
    .eq('workspace_id', input.workspaceId)

  if (error) {
    log.error('updateOutput failed', error)
    return { ok: false, error: 'Could not save changes.' }
  }

  // Slice 16 — record the user's edit as the next version. Fire-and-
  // forget so a versioning hiccup never blocks the live edit save.
  void recordOutputVersion({
    outputId: input.outputId,
    workspaceId: input.workspaceId,
    body: input.body,
    source: 'edit',
    metadata,
    createdBy: input.userId ?? null,
  })

  return { ok: true }
}
