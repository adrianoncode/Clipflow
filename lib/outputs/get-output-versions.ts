import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

/**
 * Returns a Map of outputId → highest version_number for each id in
 * the input. Outputs that have no version rows yet (legacy pre-Slice-16
 * data) get omitted from the map — caller treats that as "v1, no
 * history" via Map.get() returning undefined.
 *
 * Used by Pipeline + OutputsGrid to render the "v2" / "v3" badge that
 * tells the user this draft has been re-generated or hand-edited.
 */
export async function getOutputLatestVersions(
  workspaceId: string,
  outputIds: string[],
): Promise<Map<string, number>> {
  if (outputIds.length === 0) return new Map()

  const supabase = createClient()
  const { data, error } = await supabase
    .from('output_versions')
    .select('output_id, version_number')
    .eq('workspace_id', workspaceId)
    .in('output_id', outputIds)

  if (error) {
    log.error('getOutputLatestVersions failed', error, { workspaceId })
    return new Map()
  }

  const max = new Map<string, number>()
  for (const row of data ?? []) {
    const prev = max.get(row.output_id) ?? 0
    if (row.version_number > prev) max.set(row.output_id, row.version_number)
  }
  return max
}
