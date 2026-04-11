import type { AiProvider } from '@/lib/ai/providers/types'

/**
 * Produces a non-sensitive preview like `sk-...abc4` for display in the
 * vault UI. Keeps the first 3 chars (enough to visually distinguish
 * providers) and the last 4 chars (enough for the user to tell keys apart
 * without being useful to an attacker).
 *
 * Pure function — safe to call from client or server code.
 */
export function maskKey(_provider: AiProvider, key: string): string {
  const trimmed = key.trim()
  if (trimmed.length <= 8) {
    // Short keys are weird but don't crash — just mask everything.
    return '…'
  }
  const prefix = trimmed.slice(0, 3)
  const suffix = trimmed.slice(-4)
  return `${prefix}…${suffix}`
}
