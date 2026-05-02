import 'server-only'

import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import { log } from '@/lib/log'

/**
 * ZapCap stores TWO secrets per workspace — the API key (used as the
 * `x-api-key` header on every request) and the webhook secret (used
 * to HMAC-verify inbound webhook payloads). They live together as a
 * JSON blob inside the existing `ai_keys` row for `provider='zapcap'`,
 * encrypted with the same AES-256-GCM helper as every other key.
 *
 * This wrapper hides the JSON shape from callers and gives them a
 * typed result. Decryption + workspace-membership enforcement come
 * from `getDecryptedAiKey` upstream — keeping the security envelope
 * identical to OpenAI / Anthropic / Shotstack.
 */

export interface ZapCapSecrets {
  apiKey: string
  webhookSecret: string
}

export type ZapCapSecretsResult =
  | { ok: true; secrets: ZapCapSecrets; keyId: string }
  | {
      ok: false
      code: 'no_key' | 'malformed' | 'decrypt_failed' | 'db_error' | 'forbidden'
      message: string
    }

export async function getZapcapSecrets(
  workspaceId: string,
): Promise<ZapCapSecretsResult> {
  const decrypted = await getDecryptedAiKey(workspaceId, 'zapcap')
  if (!decrypted.ok) {
    return decrypted
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(decrypted.plaintext)
  } catch {
    log.error('getZapcapSecrets: stored payload is not JSON', {
      keyId: decrypted.keyId,
    })
    return {
      ok: false,
      code: 'malformed',
      message:
        'Saved ZapCap key is malformed. Re-add the API key + webhook secret in Settings → AI Keys.',
    }
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as { apiKey?: unknown }).apiKey !== 'string' ||
    typeof (parsed as { webhookSecret?: unknown }).webhookSecret !== 'string'
  ) {
    return {
      ok: false,
      code: 'malformed',
      message:
        'Saved ZapCap payload is missing apiKey or webhookSecret. Re-add in Settings → AI Keys.',
    }
  }

  const obj = parsed as { apiKey: string; webhookSecret: string }
  return {
    ok: true,
    secrets: { apiKey: obj.apiKey, webhookSecret: obj.webhookSecret },
    keyId: decrypted.keyId,
  }
}

/**
 * Service-role variant for the webhook handler. The webhook arrives
 * with no user JWT, so we look up the row by ZapCap task id (already
 * matched to a `caption_renders` row) and pull the workspace's
 * encrypted ZapCap blob via the admin client. Bypass of the
 * membership check is intentional and safe because the caller has
 * already proven possession of a valid HMAC signature in a separate
 * step above this — see `app/api/webhooks/zapcap/route.ts`.
 */
export async function getZapcapSecretsAsAdmin(
  workspaceId: string,
): Promise<ZapCapSecretsResult> {
  const { decrypt } = await import('@/lib/crypto/encryption')
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('ai_keys')
    .select('id, ciphertext, iv, auth_tag')
    .eq('workspace_id', workspaceId)
    .eq('provider', 'zapcap')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    log.error('getZapcapSecretsAsAdmin db error', error)
    return { ok: false, code: 'db_error', message: 'DB error.' }
  }
  if (!data) {
    return { ok: false, code: 'no_key', message: 'No ZapCap key.' }
  }

  let plaintext: string
  try {
    plaintext = decrypt({
      ciphertext: data.ciphertext,
      iv: data.iv,
      authTag: data.auth_tag,
    })
  } catch (err) {
    log.error('getZapcapSecretsAsAdmin decrypt failed', err, {
      keyId: data.id,
    })
    return { ok: false, code: 'decrypt_failed', message: 'Decrypt failed.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(plaintext)
  } catch {
    return { ok: false, code: 'malformed', message: 'Malformed JSON.' }
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as { apiKey?: unknown }).apiKey !== 'string' ||
    typeof (parsed as { webhookSecret?: unknown }).webhookSecret !== 'string'
  ) {
    return { ok: false, code: 'malformed', message: 'Missing fields.' }
  }

  const obj = parsed as { apiKey: string; webhookSecret: string }
  return {
    ok: true,
    secrets: { apiKey: obj.apiKey, webhookSecret: obj.webhookSecret },
    keyId: data.id,
  }
}
