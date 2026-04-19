import 'server-only'

import { runActor } from './apify-client'
import { computeCacheKey, readCache, writeCache } from './cache'

export interface TrendingSound {
  /** Apify/TikTok music id — pass this back to the player. */
  id: string
  title: string
  author: string
  /** Direct MP3/audio URL — Shotstack ingests this as a soundtrack. */
  audioUrl: string | null
  /** Number of TikTok videos using this sound. */
  videoCount: number
  /** Thumbnail / cover image. */
  coverUrl: string | null
  /** Duration in seconds, if provided. */
  durationSeconds: number | null
  /** Whether this is a commercial-licensed sound (TikTok flag). */
  commercial: boolean
}

const ACTOR = 'scraptik/tiktok-api'
const DEFAULT_TTL_SECONDS = 4 * 60 * 60 // 4h — trending lists don't churn by the minute

interface FetchOptions {
  /** ISO country code. 'US', 'DE', 'GB'. Defaults to 'US'. */
  region?: string
  /** How many results to return. Apify caps reasonably high. */
  limit?: number
  /** Set to true to bypass the cache (e.g. admin refresh). */
  forceRefresh?: boolean
}

/**
 * Fetches the current TikTok trending-sounds list via Apify Scraptik.
 * Cached globally for 4h — all users in the same region get the same
 * list, so we coalesce across the whole userbase.
 *
 * Returns a normalized `TrendingSound[]`. On Apify failure or missing
 * token, returns `{ ok: false }` — the UI surfaces a friendly message
 * rather than exploding.
 */
export async function fetchTrendingSounds(
  opts: FetchOptions = {},
): Promise<{ ok: true; sounds: TrendingSound[] } | { ok: false; error: string }> {
  const region = opts.region ?? 'US'
  const limit = opts.limit ?? 30

  const input = {
    action: 'trending',
    region,
    count: limit,
  }
  const cacheKey = computeCacheKey(ACTOR, input)

  if (!opts.forceRefresh) {
    const cached = await readCache<TrendingSound[]>(cacheKey)
    if (cached) return { ok: true, sounds: cached }
  }

  const result = await runActor<Record<string, unknown>>({
    actor: ACTOR,
    input,
    limit,
  })
  if (!result.ok) return { ok: false, error: result.error }

  const sounds = result.data
    .map(normalizeSound)
    .filter((s): s is TrendingSound => s !== null)

  if (sounds.length > 0) {
    await writeCache(cacheKey, ACTOR, sounds, DEFAULT_TTL_SECONDS)
  }

  return { ok: true, sounds }
}

/**
 * Normalizes whatever Scraptik returns into our shape. Scraptik's
 * response schema can vary slightly by actor version — we defensively
 * pluck fields and skip rows where the essentials are missing.
 */
function normalizeSound(raw: Record<string, unknown>): TrendingSound | null {
  // The actor sometimes nests sound under different keys — try the
  // common ones and fall back to the row itself.
  const rec = (raw.music_info as Record<string, unknown>) ?? raw
  const id = asString(rec.id) ?? asString(rec.music_id) ?? asString(raw.id)
  const title = asString(rec.title) ?? asString(rec.name)
  if (!id || !title) return null

  return {
    id,
    title,
    author: asString(rec.author) ?? asString(rec.authorName) ?? 'Unknown',
    audioUrl:
      asString(rec.play_url) ??
      asString(rec.playUrl) ??
      asString(rec.audioUrl) ??
      null,
    videoCount: asNumber(rec.video_count ?? rec.videoCount ?? raw.video_count) ?? 0,
    coverUrl:
      asString(rec.cover) ??
      asString(rec.coverLarge) ??
      asString(rec.album) ??
      null,
    durationSeconds: asNumber(rec.duration ?? rec.durationSeconds) ?? null,
    commercial: Boolean(rec.is_commerce_music ?? rec.commercial ?? false),
  }
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}
function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isNaN(n) ? null : n
  }
  return null
}
