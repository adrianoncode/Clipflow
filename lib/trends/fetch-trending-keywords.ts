import 'server-only'

import { ALL_NICHE_IDS, type NicheId } from '@/lib/niche/presets'
import { log } from '@/lib/log'

/**
 * Pulls the most-viewed videos from the last 7 d in each niche, mines
 * the titles + tags for high-frequency tokens, and returns the top
 * keywords ranked by frequency.
 *
 * Used by /api/cron/trends. Output rows go into `public.trending_keywords`.
 *
 * Quota math (YouTube Data API v3):
 *   - search.list ............ 100 units / call
 *   - videos.list ............ 1 unit / video for snippet
 *   - 6 niches × 1 search × 100 ............... = 600 units
 *   - 6 niches × ~50 videos × 1 ................ = 300 units
 *   Total per run: ~900 units. Daily quota: 10 000. Plenty of headroom.
 */

export interface TrendingKeywordRow {
  niche_id: NicheId
  keyword: string
  frequency: number
  /** 0..100 — normalized rank within the niche (top keyword = 100). */
  score: number
  source: 'youtube'
}

interface FetchOptions {
  apiKey: string
  /** Override per-niche queries — used by tests + future TikTok mirror. */
  nicheQueries?: Partial<Record<NicheId, string[]>>
  /** Top-N to keep per niche before persistence. Default 30. */
  topN?: number
  /** Lookback window in days. Default 7. */
  windowDays?: number
}

/**
 * Default niche → search-query mapping. Each niche gets a small set of
 * deliberately broad queries so the result video set has enough surface
 * area to extract meaningful trending tokens. Narrower queries (e.g.
 * "podcast") would over-bias toward generic words.
 */
const DEFAULT_NICHE_QUERIES: Record<NicheId, string[]> = {
  creator: ['creator economy', 'content creator tips', 'short form video'],
  podcaster: ['podcast tips', 'podcast growth', 'podcast clips'],
  coach: ['business coaching', 'mindset coach', 'productivity tips'],
  saas: ['saas growth', 'startup founder', 'building in public'],
  ecommerce: ['ecommerce tips', 'dtc brand', 'shopify growth'],
  agency: ['marketing agency', 'agency growth', 'client acquisition'],
}

const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'

/**
 * Single-shot run for one niche. Exposed for tests and finer scheduling
 * (e.g. retrying just one niche after a quota error).
 */
export async function fetchNicheKeywords(params: {
  apiKey: string
  niche: NicheId
  queries: string[]
  topN: number
  windowDays: number
}): Promise<TrendingKeywordRow[]> {
  const { apiKey, niche, queries, topN, windowDays } = params

  const publishedAfter = new Date(
    Date.now() - windowDays * 24 * 60 * 60 * 1000,
  ).toISOString()

  // 1) Find video IDs across all queries for the niche.
  const videoIds = new Set<string>()
  for (const q of queries) {
    const url = new URL(SEARCH_URL)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('q', q)
    url.searchParams.set('type', 'video')
    url.searchParams.set('order', 'viewCount')
    url.searchParams.set('publishedAfter', publishedAfter)
    url.searchParams.set('maxResults', '50')
    url.searchParams.set('relevanceLanguage', 'en')
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) {
      // Quota or auth issue — log + skip this query, keep others going.
      log.warn('fetchNicheKeywords search.list failed', {
        niche,
        query: q,
        status: res.status,
      })
      continue
    }
    const data = (await res.json()) as {
      items?: Array<{ id?: { videoId?: string } }>
    }
    for (const item of data.items ?? []) {
      const id = item.id?.videoId
      if (id) videoIds.add(id)
    }
  }

  if (videoIds.size === 0) return []

  // 2) Fetch full snippet (with tags[]) for each video, batched to 50.
  const tokenCounts = new Map<string, number>()
  const ids = [...videoIds]
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50)
    const url = new URL(VIDEOS_URL)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('id', batch.join(','))
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) {
      log.warn('fetchNicheKeywords videos.list failed', {
        niche,
        status: res.status,
      })
      continue
    }
    const data = (await res.json()) as {
      items?: Array<{ snippet?: { title?: string; tags?: string[] } }>
    }
    for (const item of data.items ?? []) {
      const title = item.snippet?.title ?? ''
      const tags = item.snippet?.tags ?? []
      for (const tok of tokenize(title)) bump(tokenCounts, tok, 2) // titles weigh more
      for (const tag of tags) {
        for (const tok of tokenize(tag)) bump(tokenCounts, tok, 1)
      }
    }
  }

  // 3) Rank, slice, normalize.
  const ranked = [...tokenCounts.entries()]
    .map(([keyword, frequency]) => ({ keyword, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, topN)

  if (ranked.length === 0) return []

  const maxFreq = ranked[0]!.frequency
  return ranked.map(({ keyword, frequency }) => ({
    niche_id: niche,
    keyword,
    frequency,
    score: Math.round((frequency / maxFreq) * 100),
    source: 'youtube' as const,
  }))
}

/**
 * Runs every niche sequentially. Failures in one niche don't kill the
 * whole run — the cron caller logs partial-success counts.
 */
export async function fetchAllTrendingKeywords(
  opts: FetchOptions,
): Promise<{
  rows: TrendingKeywordRow[]
  perNiche: Record<NicheId, number>
}> {
  const topN = opts.topN ?? 30
  const windowDays = opts.windowDays ?? 7

  const rows: TrendingKeywordRow[] = []
  const perNiche = {} as Record<NicheId, number>

  for (const niche of ALL_NICHE_IDS) {
    const queries = opts.nicheQueries?.[niche] ?? DEFAULT_NICHE_QUERIES[niche]
    try {
      const slice = await fetchNicheKeywords({
        apiKey: opts.apiKey,
        niche,
        queries,
        topN,
        windowDays,
      })
      rows.push(...slice)
      perNiche[niche] = slice.length
    } catch (err) {
      log.error('fetchAllTrendingKeywords niche failed', {
        niche,
        err: err instanceof Error ? err.message : String(err),
      })
      perNiche[niche] = 0
    }
  }

  return { rows, perNiche }
}

// ----------------------------------------------------------------------------
// Tokenization helpers — kept tiny + deterministic so unit tests stay simple.
// ----------------------------------------------------------------------------

/** Stop-word list. Short on purpose — wider lists kill recall on niche-y
 *  vocab. Kept lowercase, ascii-only. */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
  'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'in', 'on', 'at',
  'to', 'for', 'of', 'with', 'by', 'from', 'as', 'about', 'into', 'over',
  'after', 'before', 'between', 'through', 'so', 'than', 'too', 'very',
  'just', 'only', 'also', 'how', 'why', 'what', 'when', 'where', 'who',
  'which', 'will', 'one', 'two', 'three', 'new', 'old', 'best', 'top',
  'youtube', 'video', 'videos', 'shorts', 'reel', 'reels', 'tiktok',
])

function tokenize(input: string): string[] {
  if (!input) return []
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && w.length <= 24)
    .filter((w) => !STOP_WORDS.has(w))
}

function bump(map: Map<string, number>, key: string, by: number): void {
  map.set(key, (map.get(key) ?? 0) + by)
}
