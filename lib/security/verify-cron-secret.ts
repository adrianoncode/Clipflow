import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Timing-safe verification of the CRON_SECRET env var against a provided
 * header/query value.
 *
 * Fails closed: if `CRON_SECRET` is not configured the endpoint is
 * considered unauthorized (prevents a misconfigured deploy from
 * accidentally becoming a public mass-mutation endpoint).
 */
export function verifyCronSecret(provided: string | null | undefined): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected || expected.length < 16) {
    // Missing or too-short secret → fail closed
    return false
  }
  if (typeof provided !== 'string' || provided.length === 0) return false

  // Hash both sides to equalize length before timingSafeEqual
  const providedHash = createHash('sha256').update(provided).digest()
  const expectedHash = createHash('sha256').update(expected).digest()
  try {
    return timingSafeEqual(providedHash, expectedHash)
  } catch {
    return false
  }
}

/**
 * Timing-safe verification for any env-backed webhook secret.
 * Fails closed when the env var is missing.
 */
export function verifyEnvSecret(envVarName: string, provided: string | null | undefined): boolean {
  const expected = process.env[envVarName]
  if (!expected || expected.length < 16) return false
  if (typeof provided !== 'string' || provided.length === 0) return false

  const providedHash = createHash('sha256').update(provided).digest()
  const expectedHash = createHash('sha256').update(expected).digest()
  try {
    return timingSafeEqual(providedHash, expectedHash)
  } catch {
    return false
  }
}
