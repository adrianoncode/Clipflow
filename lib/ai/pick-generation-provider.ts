import 'server-only'

import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import type { AiProvider } from '@/lib/ai/providers/types'
import { createClient } from '@/lib/supabase/server'

export type PickProviderResult =
  | { ok: true; provider: AiProvider; apiKey: string; keyId: string }
  | {
      ok: false
      code: 'no_key' | 'decrypt_failed' | 'db_error'
      message: string
    }

/**
 * Fixed priority: OpenAI is best-tested (Whisper pipeline depends on
 * it), Anthropic is strong on structured tone, Google is the least-
 * exercised path. M4 picks the first provider the workspace has a key
 * for. A per-workspace override can ship in M6+ without touching this
 * function — add a `workspaces.default_provider` column and read it
 * first before falling back to the priority list.
 */
const PRIORITY: readonly AiProvider[] = ['openai', 'anthropic', 'google']

/**
 * Resolves which BYOK provider to use for content generation in the
 * given workspace. Two round trips: one to find out which providers
 * have keys, one to decrypt the chosen provider's latest key via the
 * M3 helper.
 */
export async function pickGenerationProvider(
  workspaceId: string,
): Promise<PickProviderResult> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ai_keys')
    .select('provider')
    .eq('workspace_id', workspaceId)

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[pickGenerationProvider]', error.message)
    return {
      ok: false,
      code: 'db_error',
      message: 'Could not read workspace AI keys.',
    }
  }

  const availableProviders = new Set<AiProvider>(
    (data ?? []).map((row) => row.provider as AiProvider),
  )

  const winner = PRIORITY.find((provider) => availableProviders.has(provider))
  if (!winner) {
    return {
      ok: false,
      code: 'no_key',
      message: 'No AI key saved for this workspace. Add one in Settings → AI Keys.',
    }
  }

  const decrypted = await getDecryptedAiKey(workspaceId, winner)
  if (!decrypted.ok) {
    return {
      ok: false,
      code: decrypted.code === 'no_key' ? 'no_key' : 'decrypt_failed',
      message: decrypted.message,
    }
  }

  return {
    ok: true,
    provider: winner,
    apiKey: decrypted.plaintext,
    keyId: decrypted.keyId,
  }
}
