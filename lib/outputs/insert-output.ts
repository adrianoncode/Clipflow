import 'server-only'

import type { PromptOutput } from '@/lib/ai/generate/types'
import type { AiProvider } from '@/lib/ai/providers/types'
import { createClient } from '@/lib/supabase/server'
import type { Json, OutputPlatform } from '@/lib/supabase/types'

export interface InsertOutputInput {
  workspaceId: string
  contentId: string
  platform: OutputPlatform
  body: string
  structured: PromptOutput
  provider: AiProvider
  model: string
  userId: string
}

export type InsertOutputResult =
  | { ok: true; outputId: string }
  | { ok: false; error: string }

/**
 * Inserts an outputs row and its initial output_states(draft) row in
 * two sequential calls.
 *
 * Orphan-tolerant: if step 1 (outputs insert) succeeds but step 2
 * (output_states insert) fails, we still return ok=true with a warning
 * log. The output itself is visible; M5 can backfill the state row
 * later. We do NOT attempt to roll back the outputs insert — a
 * non-transactional DELETE-after-INSERT pair is its own race hazard.
 *
 * workspace_id is denormalized on both tables (the M1 design) — MUST
 * be passed explicitly, no trigger populates it.
 */
export async function insertOutputWithDraftState(
  input: InsertOutputInput,
): Promise<InsertOutputResult> {
  const supabase = createClient()

  // `PromptOutput` is a plain interface without an index signature, so
  // TypeScript doesn't recognize it as structurally assignable to `Json`.
  // We know the runtime value is JSON-serialisable, so we cast at the
  // boundary rather than widen PromptOutput globally.
  const metadata: Json = {
    structured: input.structured as unknown as Json,
    provider: input.provider,
    model: input.model,
  }

  const { data: output, error: insertError } = await supabase
    .from('outputs')
    .insert({
      workspace_id: input.workspaceId,
      content_id: input.contentId,
      platform: input.platform,
      body: input.body,
      metadata,
    })
    .select('id')
    .single()

  if (insertError || !output) {
    // eslint-disable-next-line no-console
    console.error(
      '[insertOutputWithDraftState.outputs]',
      insertError?.message ?? 'unknown error',
    )
    return { ok: false, error: 'Could not save generated output.' }
  }

  const { error: stateError } = await supabase.from('output_states').insert({
    output_id: output.id,
    workspace_id: input.workspaceId,
    state: 'draft',
    changed_by: input.userId,
  })

  if (stateError) {
    // Orphan-tolerant: the output is stored, the state row is missing.
    // Log and keep going — M5's state backfill will make this whole.
    // eslint-disable-next-line no-console
    console.error(
      '[insertOutputWithDraftState.output_states]',
      stateError.message,
      `output_id=${output.id}`,
    )
  }

  return { ok: true, outputId: output.id }
}
