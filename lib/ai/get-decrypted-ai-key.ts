import 'server-only'

import { decrypt } from '@/lib/crypto/encryption'
import { createClient } from '@/lib/supabase/server'
import type { AiProvider } from '@/lib/ai/providers/types'
import { log } from '@/lib/log'

export type DecryptedKeyResult =
  | { ok: true; plaintext: string; keyId: string }
  | { ok: false; code: 'no_key' | 'decrypt_failed' | 'db_error' | 'forbidden'; message: string }

/**
 * Server-only helper that fetches the most recently-created encrypted
 * ai_keys row for `(workspace_id, provider)` and returns the plaintext key.
 *
 * Authorization (defense in depth):
 *   1. Uses the user-scoped server client → RLS enforces workspace
 *      membership at the query level.
 *   2. ADDITIONALLY, when a user JWT is present, this helper performs an
 *      explicit `workspace_members` lookup against `auth.uid()` and
 *      refuses to decrypt if the caller is not a member. This guards
 *      against a future RLS relaxation or a refactor that accidentally
 *      swaps in `createAdminClient()` from a user-input code path.
 *   3. Cron / webhook callers (no user JWT) bypass the explicit check,
 *      since they don't have a JWT to leak — they're inherently trusted
 *      contexts gated by `verifyCronSecret` or `stripe.webhooks
 *      .constructEvent`.
 *
 * Never logs the plaintext — only `keyId`, `provider`, and error codes.
 */
export async function getDecryptedAiKey(
  workspaceId: string,
  provider: AiProvider,
): Promise<DecryptedKeyResult> {
  const supabase = createClient()

  // Belt-and-braces membership check when running in user context.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const { data: member } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!member) {
      log.warn('getDecryptedAiKey: non-member attempted decrypt', {
        userId: user.id,
        workspaceId,
        provider,
      })
      return {
        ok: false,
        code: 'forbidden',
        message: 'You are not a member of this workspace.',
      }
    }
  }

  const { data, error } = await supabase
    .from('ai_keys')
    .select('id, ciphertext, iv, auth_tag')
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    log.error('getDecryptedAiKey failed', error)
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
    log.error('getDecryptedAiKey decrypt failed', err, { keyId: data.id })
    return {
      ok: false,
      code: 'decrypt_failed',
      message: 'Stored key could not be decrypted. Re-add the key in Settings.',
    }
  }
}
