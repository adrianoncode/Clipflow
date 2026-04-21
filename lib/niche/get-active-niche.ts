import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

import { parseNicheId, type NicheId } from './presets'

/**
 * Loads the workspace's active niche preset id. Returns null when no
 * preset is selected — callers use that to skip niche injection in
 * prompts.
 *
 * Defensive: any DB / schema error just returns null so generation
 * never fails because of an unavailable niche lookup.
 */
export async function getActiveNiche(workspaceId: string): Promise<NicheId | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('workspaces')
      .select('active_niche')
      .eq('id', workspaceId)
      .maybeSingle()

    if (error) {
      log.error('getActiveNiche query failed', error, { workspaceId })
      return null
    }
    const row = data as { active_niche: string | null } | null
    return parseNicheId(row?.active_niche ?? null)
  } catch (err) {
    log.error('getActiveNiche unexpected', err, { workspaceId })
    return null
  }
}
