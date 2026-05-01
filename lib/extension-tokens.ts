import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

import { log } from '@/lib/log'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Mint / verify helpers for the browser-extension authentication.
 *
 * Plaintext tokens are 32 random bytes encoded as base64url (44 chars).
 * Only `sha256(plaintext)` is persisted; the plaintext is returned to
 * the caller exactly once at mint time. No code path ever stores or
 * logs the plaintext.
 *
 * Verifying is constant-time-ish via `WHERE token_hash = $1` — Postgres
 * does the comparison on the indexed bytea/text column, no app-side
 * timing leaks.
 */

const TOKEN_BYTES = 32

function hashToken(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex')
}

export interface MintResult {
  ok: true
  /** Plaintext — show to the user once, then discard. NEVER persist. */
  plaintext: string
  /** Stable id for revoke / list operations. */
  id: string
  name: string
  createdAt: string
}

export async function mintExtensionToken(params: {
  userId: string
  name: string
}): Promise<MintResult | { ok: false; error: string }> {
  const trimmedName = params.name.trim().slice(0, 80) || 'Extension'
  const plaintext = randomBytes(TOKEN_BYTES).toString('base64url')
  const tokenHash = hashToken(plaintext)

  const supabase = createClient()
  const { data, error } = await supabase
    .from('extension_tokens')
    .insert({
      user_id: params.userId,
      name: trimmedName,
      token_hash: tokenHash,
    })
    .select('id, name, created_at')
    .single()

  if (error || !data) {
    log.error('mintExtensionToken failed', error, { userId: params.userId })
    return { ok: false, error: 'Could not create token.' }
  }

  return {
    ok: true,
    plaintext,
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
  }
}

export async function revokeExtensionToken(params: {
  userId: string
  tokenId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('extension_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', params.tokenId)
    .eq('user_id', params.userId)
    .is('revoked_at', null)

  if (error) {
    log.error('revokeExtensionToken failed', error, { tokenId: params.tokenId })
    return { ok: false, error: 'Could not revoke token.' }
  }
  return { ok: true }
}

export interface ExtensionTokenSummary {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export async function listExtensionTokens(userId: string): Promise<ExtensionTokenSummary[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('extension_tokens')
    .select('id, name, created_at, last_used_at, revoked_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    log.error('listExtensionTokens failed', error, { userId })
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
  }))
}

/**
 * Verify a plaintext bearer token from an extension request. Returns
 * the user_id on success. Touches `last_used_at` so users can see
 * which tokens are active. Uses the admin client because the request
 * doesn't carry a Supabase session — the bearer IS the auth.
 */
export async function verifyExtensionToken(
  plaintext: string,
): Promise<{ ok: true; userId: string; tokenId: string } | { ok: false }> {
  if (!plaintext) return { ok: false }
  const tokenHash = hashToken(plaintext)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('extension_tokens')
    .select('id, user_id, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error) {
    log.error('verifyExtensionToken lookup failed', error)
    return { ok: false }
  }
  if (!data) return { ok: false }
  if (data.revoked_at) return { ok: false }

  // Best-effort touch — never block the request on a write-failure.
  void admin
    .from('extension_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(({ error: touchErr }) => {
      if (touchErr) log.warn('verifyExtensionToken touch failed', { tokenId: data.id })
    })

  return { ok: true, userId: data.user_id, tokenId: data.id }
}
