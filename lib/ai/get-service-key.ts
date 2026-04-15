import 'server-only'

import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import type { MediaProvider } from '@/lib/ai/providers/types'

/**
 * BYOK resolver for non-LLM services. Each function:
 *   1. Looks for an encrypted key for the workspace in ai_keys
 *   2. Falls back to `process.env.<SERVICE>_API_KEY` if the user hasn't
 *      connected one yet (legacy behavior — lets existing features work
 *      during the BYOK rollout)
 *   3. Returns null if neither is available, so callers can render a
 *      "connect your key" prompt instead of crashing
 *
 * The env fallback is kept around so the site doesn't go dark for the
 * current user base. New signups shouldn't rely on it — our onboarding
 * steers them toward connecting their own key from day one.
 */
export async function getServiceKey(
  workspaceId: string,
  provider: MediaProvider,
): Promise<{
  key: string | null
  source: 'byok' | 'platform' | 'missing'
}> {
  // 1. Check for a user-connected key first
  const byok = await getDecryptedAiKey(workspaceId, provider)
  if (byok.ok) return { key: byok.plaintext, source: 'byok' }

  // 2. Fallback to the platform-owned env var
  const envVar =
    provider === 'shotstack'
      ? process.env.SHOTSTACK_API_KEY
      : provider === 'replicate'
        ? process.env.REPLICATE_API_TOKEN
        : provider === 'elevenlabs'
          ? process.env.ELEVENLABS_API_KEY
          : undefined

  if (envVar) return { key: envVar, source: 'platform' }
  return { key: null, source: 'missing' }
}

/** Convenience — just the key string or null. */
export async function resolveServiceKey(
  workspaceId: string,
  provider: MediaProvider,
): Promise<string | null> {
  const result = await getServiceKey(workspaceId, provider)
  return result.key
}
