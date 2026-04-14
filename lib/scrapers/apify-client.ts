import 'server-only'

const BASE_URL = 'https://api.apify.com/v2'

export interface ApifyRunOptions {
  /** Apify actor slug, e.g. 'scraptik/tiktok-api'. */
  actor: string
  /** Input payload shape is actor-specific. */
  input: Record<string, unknown>
  /** Hard ceiling on wait time for run-sync (seconds). Apify caps this at 300. */
  timeoutSecs?: number
  /** Cap the number of dataset items returned. Saves bandwidth. */
  limit?: number
}

export type ApifyResult<T> =
  | { ok: true; data: T[] }
  | { ok: false; error: string }

/**
 * Thin Apify client — one entry point (`runActor`) for every scraper.
 * Uses the `run-sync-get-dataset-items` endpoint, which blocks until
 * the actor finishes and returns the dataset rows in one response.
 * Good for our use case (single-user click → fetch up to 50 items)
 * — we avoid the async polling pattern which would add complexity.
 *
 * Token is pulled lazily from `process.env.APIFY_TOKEN`. We throw a
 * descriptive error at call time rather than at import, so builds don't
 * break in environments without the secret.
 */
export async function runActor<T = unknown>(
  opts: ApifyRunOptions,
): Promise<ApifyResult<T>> {
  const token = process.env.APIFY_TOKEN
  if (!token) {
    return {
      ok: false,
      error:
        'APIFY_TOKEN is not set. Add it to .env.local or Vercel env vars.',
    }
  }

  const actorSlug = opts.actor.replace('/', '~')
  const url = new URL(
    `${BASE_URL}/acts/${actorSlug}/run-sync-get-dataset-items`,
  )
  url.searchParams.set('token', token)
  url.searchParams.set('timeout', String(opts.timeoutSecs ?? 90))
  if (opts.limit) {
    url.searchParams.set('limit', String(opts.limit))
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts.input),
      // Apify runs are slow — give the fetch enough time.
      signal: AbortSignal.timeout(((opts.timeoutSecs ?? 90) + 10) * 1000),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return {
        ok: false,
        error: `Apify ${opts.actor} returned ${res.status}: ${body.slice(0, 240)}`,
      }
    }

    const data = (await res.json()) as T[]
    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apify request failed'
    return { ok: false, error: message }
  }
}

/**
 * Sanity-check helper — returns whether the token is set so routes can
 * surface a friendly "feature unavailable" message rather than a 500.
 */
export function isApifyConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN)
}
