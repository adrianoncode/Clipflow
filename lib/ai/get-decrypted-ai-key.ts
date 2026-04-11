import 'server-only'

import { decrypt } from '@/lib/crypto/encryption'
import { createClient } from '@/lib/supabase/server'
import type { AiProvider } from '@/lib/ai/providers/types'

export type DecryptedKeyResult =
  | { ok: true; plaintext: string; keyId: string }
  | { ok: false; code: 'no_key' | 'decrypt_failed' | 'db_error'; message: string }

/**
 * Server-only helper that fetches the most recently-created encrypted
 * ai_keys row for `(workspace_id, provider)` and returns the plaintext key.
 *
 * Uses the normal server client so RLS enforces access — since M3's
 * migration relaxed the select policy to editor+, any editor or owner in
 * the workspace can decrypt. Insert/update/delete on ai_keys remain
 * owner-only.
 *
 * Never logs the plaintext — only `keyId`, `provider`, and error codes.
 */
export async function getDecryptedAiKey(
  workspaceId: string,
  provider: AiProvider,
): Promise<DecryptedKeyResult> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ai_keys')
    .select('id, ciphertext, iv, auth_tag')
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[getDecryptedAiKey]', error.message)
    return {
      ok: false,
      code: 'db_error',
      message: 'Could not read the workspace AI key.',
    }
  }

  if (!data) {
    return {
      ok: false,
      code: 'no_key',
      message: `No ${provider} key saved for this workspace.`,
    }
  }

  try {
    const plaintext = decrypt({
      ciphertext: data.ciphertext,
      iv: data.iv,
      authTag: data.auth_tag,
    })
    return { ok: true, plaintext, keyId: data.id }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[getDecryptedAiKey] decrypt failed for key', data.id, (err as Error).message)
    return {
      ok: false,
      code: 'decrypt_failed',
      message: 'Stored key could not be decrypted. Re-add the key in Settings.',
    }
  }
}
