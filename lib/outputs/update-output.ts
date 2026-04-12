import 'server-only'

import type { PromptOutput } from '@/lib/ai/generate/types'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'

export interface UpdateOutputInput {
  outputId: string
  workspaceId: string
  body: string
  structured: PromptOutput
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

  const { error } = await supabase
    .from('outputs')
    .update({
      body: input.body,
      metadata: { structured: input.structured as unknown as Json },
    })
    .eq('id', input.outputId)
    .eq('workspace_id', input.workspaceId)

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[updateOutput]', error.message)
    return { ok: false, error: 'Could not save changes.' }
  }

  return { ok: true }
}
