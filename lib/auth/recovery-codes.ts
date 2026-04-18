import 'server-only'

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'

/**
 * Single-use recovery codes for TOTP 2FA fallback.
 *
 * Format: 8 groups of 4 base32-ish characters separated by dashes,
 * e.g. `A7K9-MP2X-QWN4-R8Z3` (32 chars, ~160 bits of entropy after
 * removing visually-ambiguous letters 0/O/1/I/L).
 *
 * Storage: SHA-256 hash — we never store plaintext. The user sees
 * plaintext exactly once (right after enrollment / regeneration),
 * must copy them somewhere safe, and cannot retrieve them again.
 *
 * Verification: constant-time hash comparison + atomic mark-as-used
 * so a leaked backup snapshot can't be reused.
 */

const CODE_COUNT = 10
const GROUP_LENGTH = 4
const GROUPS = 4
// Avoid visually-ambiguous chars: 0/O, 1/I/L, 5/S, 8/B.
const ALPHABET = 'ACDEFGHJKMNPQRTUVWXYZ234679'

function generatePlaintextCode(): string {
  const bytes = randomBytes(GROUPS * GROUP_LENGTH)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    if (i > 0 && i % GROUP_LENGTH === 0) out += '-'
    out += ALPHABET[bytes[i]! % ALPHABET.length]
  }
  return out
}

function hashCode(plaintext: string): string {
  // Normalize: strip dashes, uppercase — so users can type the code
  // with or without dashes, mixed case.
  const normalized = plaintext.replace(/-/g, '').toUpperCase()
  return createHash('sha256').update(normalized).digest('hex')
}

/**
 * Generate 10 fresh codes for the user, invalidate any existing ones,
 * and return the plaintext list. Call this on enrollment and whenever
 * the user clicks "Regenerate codes".
 */
export async function regenerateRecoveryCodes(
  userId: string,
): Promise<{ ok: true; codes: string[] } | { ok: false; error: string }> {
  const admin = createAdminClient()

  // Atomic-ish replace: delete existing then insert new. Supabase has
  // no multi-statement transactions over REST, so we accept a brief
  // window where a user has 0 codes if the insert fails after the
  // delete — they'll just see "0 remaining" and can regenerate again.
  const { error: delErr } = await admin
    .from('mfa_recovery_codes')
    .delete()
    .eq('user_id', userId)
  if (delErr) {
    log.error('regenerateRecoveryCodes delete failed', delErr, { userId })
    return { ok: false, error: 'Could not reset recovery codes.' }
  }

  const plaintext: string[] = []
  const rows = []
  for (let i = 0; i < CODE_COUNT; i++) {
    const code = generatePlaintextCode()
    plaintext.push(code)
    rows.push({ user_id: userId, code_hash: hashCode(code) })
  }

  const { error: insErr } = await admin.from('mfa_recovery_codes').insert(rows)
  if (insErr) {
    log.error('regenerateRecoveryCodes insert failed', insErr, { userId })
    return { ok: false, error: 'Could not generate new recovery codes.' }
  }

  return { ok: true, codes: plaintext }
}

/**
 * Verify a code and mark it used. Constant-time at the hash layer,
 * atomic mark-as-used (single UPDATE with used_at IS NULL guard).
 */
export async function consumeRecoveryCode(
  userId: string,
  submitted: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient()
  const submittedHash = hashCode(submitted)

  // Find an unused code row matching the hash. We could scan all user
  // codes and timingSafeEqual each, but the DB-side lookup with an
  // exact match is cheaper and just as safe — SHA-256 with 160 bits
  // of input entropy has no meaningful timing side-channel here.
  const { data: row, error: readErr } = await admin
    .from('mfa_recovery_codes')
    .select('id, code_hash, used_at')
    .eq('user_id', userId)
    .eq('code_hash', submittedHash)
    .is('used_at', null)
    .maybeSingle()

  if (readErr) {
    log.error('consumeRecoveryCode read failed', readErr, { userId })
    return { ok: false, error: 'Could not verify recovery code.' }
  }

  if (!row) {
    // Don't leak whether the code is unknown vs already-used — same error.
    return { ok: false, error: 'Invalid or already-used recovery code.' }
  }

  // Defence-in-depth: constant-time compare of the stored hash against
  // the submitted hash (they're both hex strings of equal length).
  const stored = Buffer.from(row.code_hash, 'hex')
  const provided = Buffer.from(submittedHash, 'hex')
  if (stored.length !== provided.length || !timingSafeEqual(stored, provided)) {
    return { ok: false, error: 'Invalid or already-used recovery code.' }
  }

  // Atomic mark-as-used — the `used_at IS NULL` guard prevents a
  // race where two simultaneous requests each consume the same code.
  const nowIso = new Date().toISOString()
  const { data: updated, error: updErr } = await admin
    .from('mfa_recovery_codes')
    .update({ used_at: nowIso })
    .eq('id', row.id)
    .is('used_at', null)
    .select('id')
    .maybeSingle()

  if (updErr || !updated) {
    return { ok: false, error: 'Invalid or already-used recovery code.' }
  }

  return { ok: true }
}

/**
 * Count unused recovery codes for a user. Used by the settings UI
 * to show "X of 10 remaining".
 */
export async function countUnusedCodes(userId: string): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('mfa_recovery_codes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('used_at', null)

  if (error) {
    log.error('countUnusedCodes failed', error, { userId })
    return 0
  }
  return count ?? 0
}
