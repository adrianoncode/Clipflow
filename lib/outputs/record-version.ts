import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import { log } from '@/lib/log'

export type VersionSource = 'ai' | 'edit' | 'reject_regen'

export interface RecordOutputVersionInput {
  outputId: string
  workspaceId: string
  body: string
  source: VersionSource
  /** Same shape as outputs.metadata — the structured payload. Stored
   *  verbatim so a version can be re-rendered without the live row. */
  metadata?: Json
  /** Auth user that triggered the write. Null for system-only paths. */
  createdBy?: string | null
}

/**
 * Append a new version row for an output. Slice 16 — feeds the version
 * badge ("v3") and the future "Keep edits, regenerate as v4" UX.
 *
 * Fire-and-forget: failures are logged but never thrown. Versioning is
 * audit-grade nice-to-have, never load-bearing — the live `outputs`
 * row is the source of truth for rendering.
 *
 * Version numbers monotonically increase per output_id (uniqueness
 * enforced at the DB layer). On race we get a duplicate-key error,
 * which is logged and ignored — the next write picks up the correct
 * number naturally.
 */
export async function recordOutputVersion(
  input: RecordOutputVersionInput,
): Promise<void> {
  const supabase = createClient()

  // Read the latest version number to compute the next. Wrapped in a
  // single round-trip so a churning output (parallel edits) is at most
  // one duplicate-key conflict from settling.
  const { data: latest } = await supabase
    .from('output_versions')
    .select('version_number')
    .eq('output_id', input.outputId)
    .eq('workspace_id', input.workspaceId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (latest?.version_number ?? 0) + 1

  const { error } = await supabase.from('output_versions').insert({
    output_id: input.outputId,
    workspace_id: input.workspaceId,
    version_number: nextVersion,
    source: input.source,
    body: input.body,
    metadata: input.metadata ?? {},
    created_by: input.createdBy ?? null,
  })

  if (error) {
    log.warn('recordOutputVersion failed (advisory only)', {
      outputId: input.outputId,
      version: nextVersion,
      source: input.source,
      error: error.message,
    })
  }
}
