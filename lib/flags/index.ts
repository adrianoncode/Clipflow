/**
 * Feature flags — minimal, honest, no external service.
 *
 * Why not LaunchDarkly / Unleash / PostHog-flags? At our scale (one
 * developer, no QA team) the extra network hop and vendor lock-in
 * isn't worth it. Every flag lives in code, defaults to `false`, and
 * flips on via a single env var.
 *
 * Add a flag:
 *   1. Add its key to the `FLAG_KEYS` union below.
 *   2. Set `CLIPFLOW_FLAGS` in your env to a comma-separated list
 *      (e.g. `CLIPFLOW_FLAGS=new_onboarding,dark_mode`).
 *   3. Check it at a call site with `isFlagEnabled('new_onboarding')`.
 *
 * Percentage rollouts: append `:N` to the flag name
 *   `CLIPFLOW_FLAGS=new_onboarding:25`
 * means "enabled for the ~25% of user IDs whose deterministic hash
 * falls below the cutoff." The same user will always get the same
 * answer, so feature toggles don't flap per request.
 */

/** Add new flags here. Deleting one = instant global off. */
export type FeatureFlag =
  | 'new_onboarding' // placeholder — swap in as real ones land
  | 'client_review_v2'
  | 'advanced_analytics'

interface ParsedFlag {
  name: string
  rolloutPercent: number // 0-100; 100 means fully on
}

/**
 * Parse the env var once per process. The result is static after
 * module init — flipping a flag requires a redeploy, which is a
 * feature (reproducible builds) not a bug.
 */
const PARSED_FLAGS: Map<string, ParsedFlag> = (() => {
  const raw = process.env.CLIPFLOW_FLAGS ?? ''
  const map = new Map<string, ParsedFlag>()
  for (const entry of raw.split(',')) {
    const trimmed = entry.trim()
    if (!trimmed) continue
    const [name, percent] = trimmed.split(':') as [string, string | undefined]
    const rolloutPercent =
      percent && !Number.isNaN(Number(percent))
        ? Math.min(100, Math.max(0, Number(percent)))
        : 100
    map.set(name, { name, rolloutPercent })
  }
  return map
})()

/**
 * Is the flag on for this user (or globally, if no userId given)?
 *
 * Returns `true` when:
 *   - the flag is in `CLIPFLOW_FLAGS`, AND
 *   - either the rollout is 100% OR the user's hashed ID falls
 *     below the rollout cutoff.
 *
 * Consistent per user — no random flapping between requests.
 */
export function isFlagEnabled(
  flag: FeatureFlag,
  userId?: string,
): boolean {
  const parsed = PARSED_FLAGS.get(flag)
  if (!parsed) return false
  if (parsed.rolloutPercent >= 100) return true
  if (parsed.rolloutPercent <= 0) return false
  if (!userId) return false
  return hashToPercent(`${flag}:${userId}`) < parsed.rolloutPercent
}

/**
 * Deterministic hash → 0-99 bucket.
 * Not cryptographically secure — we just want a stable per-user
 * number so rollouts don't flap and users don't see the feature
 * appear and disappear across requests.
 */
function hashToPercent(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) & 0x7fffffff
  }
  return hash % 100
}

/** Debug helper: list every flag and its current state. Handy in
 * admin panels or when diagnosing "why don't I see it?" reports. */
export function listFlags(userId?: string): Array<{
  flag: FeatureFlag
  enabled: boolean
  rolloutPercent: number
}> {
  const allFlags: FeatureFlag[] = [
    'new_onboarding',
    'client_review_v2',
    'advanced_analytics',
  ]
  return allFlags.map((flag) => {
    const parsed = PARSED_FLAGS.get(flag)
    return {
      flag,
      enabled: isFlagEnabled(flag, userId),
      rolloutPercent: parsed?.rolloutPercent ?? 0,
    }
  })
}
