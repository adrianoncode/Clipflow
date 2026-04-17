import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { ScraperFeature } from '@/lib/supabase/types'
import { log } from '@/lib/log'

/**
 * Writes one row to `scraper_usage`. Called from every scraper-backed
 * feature right after the call resolves (cache hit or miss). Quota
 * checks in `check-feature.ts` read from this table.
 *
 * Silent on failure — a broken log must not block a successful query.
 */
export async function logScraperUsage(params: {
  workspaceId: string
  feature: ScraperFeature
  target?: string | null
  cacheHit?: boolean
  cacheKey?: string | null
  createdBy?: string | null
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('scraper_usage').insert({
      workspace_id: params.workspaceId,
      feature: params.feature,
      target: params.target ?? null,
      cache_hit: params.cacheHit ?? false,
      cache_key: params.cacheKey ?? null,
      created_by: params.createdBy ?? null,
    })
    if (error) {
      log.error('logScraperUsage failed', error)
    }
  } catch (err) {
    console.error('[logScraperUsage] unexpected:', err)
  }
}
