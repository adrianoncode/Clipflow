import 'server-only'

import { decrypt, encrypt } from '@/lib/crypto/encryption'
import { log } from '@/lib/log'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/supabase/types'

type SocialAccountUpdate = Database['public']['Tables']['social_accounts']['Update']

/**
 * Sanctioned read/write helpers for OAuth tokens stored on `social_accounts`.
 *
 * Every callsite that previously touched `social_accounts.access_token` or
 * `.refresh_token` directly MUST go through here — the plaintext columns
 * were removed in `20260430000000_encrypt_social_tokens.sql`, replaced by
 * AES-256-GCM ciphertext / iv / auth_tag triples (base64).
 *
 * Why this layer exists:
 *   - Encryption / decryption rules in one place — easy to audit
 *   - No plaintext key string ever crosses a function boundary it doesn't
 *     have to: callers receive a typed `SocialTokenSet` and the access
 *     token is short-lived in memory
 *   - Decrypt failures are caught + logged with a stable error code so
 *     ciphertext / iv / auth_tag bytes never end up in Sentry context
 *
 * This file imports `server-only` and uses Node's `crypto` — never import
 * it from middleware or a Client Component.
 */

export interface SocialTokenSet {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
}

export interface SaveSocialAccountInput {
  workspaceId: string
  userId: string
  platform: string
  platformUserId: string
  platformUsername: string | null
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
}

/**
 * Insert (or upsert) a social account with encrypted OAuth tokens.
 *
 * Uses the admin client because the OAuth callback runs as the user but
 * needs to write rows whose RLS policies are workspace-membership based —
 * the caller is responsible for verifying membership before invoking this.
 */
export async function saveSocialAccount(input: SaveSocialAccountInput): Promise<{
  ok: true
  id: string
} | { ok: false; error: string }> {
  const access = encrypt(input.accessToken)
  const refresh = input.refreshToken ? encrypt(input.refreshToken) : null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('social_accounts')
    .upsert(
      {
        workspace_id: input.workspaceId,
        user_id: input.userId,
        platform: input.platform,
        platform_user_id: input.platformUserId,
        platform_username: input.platformUsername,
        access_token_ciphertext: access.ciphertext,
        access_token_iv: access.iv,
        access_token_auth_tag: access.authTag,
        refresh_token_ciphertext: refresh?.ciphertext ?? null,
        refresh_token_iv: refresh?.iv ?? null,
        refresh_token_auth_tag: refresh?.authTag ?? null,
        expires_at: input.expiresAt?.toISOString() ?? null,
      },
      { onConflict: 'workspace_id,platform,platform_user_id' },
    )
    .select('id')
    .single()

  if (error || !data) {
    log.error('saveSocialAccount: upsert failed', error, {
      workspaceId: input.workspaceId,
      platform: input.platform,
    })
    return { ok: false, error: 'Could not save social connection.' }
  }
  return { ok: true, id: data.id }
}

/**
 * Decrypt and return the OAuth token set for a connected social account.
 *
 * Caller must already have authorized the read — this helper does NOT
 * re-check workspace membership. Pair with `requireWorkspaceMember()`.
 *
 * Returns `null` (not an error) if the account is not found, so callers
 * can show "not connected" without distinguishing missing-row from RLS-
 * blocked. Returns `{ ok: false }` on decrypt failure (master key
 * rotated, ciphertext tampered, schema half-populated despite the CHECK
 * constraint) so we surface as "reconnect required" rather than a crash.
 */
export async function getSocialTokens(params: {
  workspaceId: string
  platform: string
  platformUserId?: string
}): Promise<
  | { ok: true; tokens: SocialTokenSet; accountId: string }
  | { ok: false; reason: 'not_connected' | 'decrypt_failed' }
> {
  const supabase = createAdminClient()
  const baseQuery = supabase
    .from('social_accounts')
    .select(
      'id, access_token_ciphertext, access_token_iv, access_token_auth_tag, refresh_token_ciphertext, refresh_token_iv, refresh_token_auth_tag, expires_at',
    )
    .eq('workspace_id', params.workspaceId)
    .eq('platform', params.platform)

  const filtered = params.platformUserId
    ? baseQuery.eq('platform_user_id', params.platformUserId)
    : baseQuery

  const { data, error } = await filtered
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    log.error('getSocialTokens: query failed', error, {
      workspaceId: params.workspaceId,
      platform: params.platform,
    })
    return { ok: false, reason: 'not_connected' }
  }
  if (!data) return { ok: false, reason: 'not_connected' }

  if (
    !data.access_token_ciphertext ||
    !data.access_token_iv ||
    !data.access_token_auth_tag
  ) {
    return { ok: false, reason: 'not_connected' }
  }

  try {
    const accessToken = decrypt({
      ciphertext: data.access_token_ciphertext,
      iv: data.access_token_iv,
      authTag: data.access_token_auth_tag,
    })

    let refreshToken: string | null = null
    if (
      data.refresh_token_ciphertext &&
      data.refresh_token_iv &&
      data.refresh_token_auth_tag
    ) {
      refreshToken = decrypt({
        ciphertext: data.refresh_token_ciphertext,
        iv: data.refresh_token_iv,
        authTag: data.refresh_token_auth_tag,
      })
    }

    return {
      ok: true,
      accountId: data.id,
      tokens: {
        accessToken,
        refreshToken,
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      },
    }
  } catch (err) {
    // Never log ciphertext / iv / auth_tag — only the account id.
    log.error('getSocialTokens: decrypt failed', err, { accountId: data.id })
    return { ok: false, reason: 'decrypt_failed' }
  }
}

/**
 * Refresh the persisted access token after a successful OAuth refresh
 * round-trip. Atomically re-encrypts and updates the affected row.
 */
export async function rotateAccessToken(params: {
  accountId: string
  accessToken: string
  refreshToken?: string | null
  expiresAt: Date | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = encrypt(params.accessToken)
  const refresh =
    params.refreshToken !== undefined
      ? params.refreshToken === null
        ? { ciphertext: null, iv: null, authTag: null }
        : encrypt(params.refreshToken)
      : undefined

  const supabase = createAdminClient()
  const update: SocialAccountUpdate = {
    access_token_ciphertext: access.ciphertext,
    access_token_iv: access.iv,
    access_token_auth_tag: access.authTag,
    expires_at: params.expiresAt?.toISOString() ?? null,
  }
  if (refresh !== undefined) {
    update.refresh_token_ciphertext = refresh.ciphertext
    update.refresh_token_iv = refresh.iv
    update.refresh_token_auth_tag = refresh.authTag
  }

  const { error } = await supabase
    .from('social_accounts')
    .update(update)
    .eq('id', params.accountId)

  if (error) {
    log.error('rotateAccessToken: update failed', error, { accountId: params.accountId })
    return { ok: false, error: 'Could not rotate access token.' }
  }
  return { ok: true }
}
