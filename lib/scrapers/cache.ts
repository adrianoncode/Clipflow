import 'server-only'

import { createHash } from 'crypto'

import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'

/**
 * Deterministic hash of `actor + sorted-JSON-input`. Sorted-keys is
 * important — `{a:1, b:2}` and `{b:2, a:1}` must hash identically or
 * the cache becomes useless.
 */
export function computeCacheKey(actor: string, input: Record<string, unknown>): string {
  const sorted = sortKeys(input)
  const payload = JSON.stringify({ actor, input: sorted })
  return createHash('sha256').update(payload).digest('hex')
}

function sortKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => sortKeys(v)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = sortKeys((value as Record<string, unknown>)[k])
    }
    return out as T
  }
  return value
}

/**
 * Reads a cached scraper result. Returns null on miss or when the row
 * has expired. Uses the service-role client because `scraper_cache`
 * has no public RLS policies.
 */
export async function readCache<T>(cacheKey: string): Promise<T | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('scraper_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .maybeSingle()

    if (error) {
      log.error('scraper-cache read failed', error, { cacheKey })
      return null
    }
    if (!data) return null
    if (new Date(data.expires_at as string) < new Date()) return null
    return data.data as T
  } catch (err) {
    log.error('scraper-cache read unexpected', err, { cacheKey })
    return null
  }
}

/**
 * Upserts a scraper result into the cache. TTL in seconds — the row
 * is marked as expired after `now() + ttlSeconds`.
 */
export async function writeCache<T>(
  cacheKey: string,
  actor: string,
  data: T,
  ttlSeconds: number,
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()
    const admin = createAdminClient()
    const { error } = await admin.from('scraper_cache').upsert(
      {
        cache_key: cacheKey,
        actor,
        data: data as never,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cache_key' },
    )
    if (error) {
      log.error('scraper-cache write failed', error, { cacheKey })
    }
  } catch (err) {
    log.error('scraper-cache write unexpected', err, { cacheKey })
  }
}
