import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

/**
 * Thin wrappers around Supabase's built-in MFA (TOTP). No DB tables
 * needed — Supabase stores factors in `auth.mfa_factors`.
 *
 * Flow:
 *   1. `enrollTotp()` — Supabase generates a secret + QR code. Factor
 *      is in `unverified` state until the user scans + submits a code.
 *   2. `verifyEnrollment(factorId, code)` — activates the factor.
 *   3. Subsequent logins: after password, check
 *      `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`.
 *      If `nextLevel === 'aal2'` and `currentLevel === 'aal1'` →
 *      challenge the user for their TOTP code before granting access.
 */

export interface EnrollResult {
  factorId: string
  /** SVG data URI of the QR code. Render with <img src={qr} />. */
  qrCode: string
  /** Plaintext secret — show as fallback for users who can't scan. */
  secret: string
}

export async function enrollTotp(
  friendlyName: string = 'Clipflow',
): Promise<{ ok: true; data: EnrollResult } | { ok: false; error: string }> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  })

  if (error || !data) {
    log.error('mfa enroll failed', error ?? undefined)
    return { ok: false, error: error?.message ?? 'Could not start MFA enrollment.' }
  }

  return {
    ok: true,
    data: {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    },
  }
}

export async function verifyEnrollment(
  factorId: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient()

  // Challenge creates a challenge id bound to the factor, then verify
  // confirms the code. Both steps required.
  const challenge = await supabase.auth.mfa.challenge({ factorId })
  if (challenge.error || !challenge.data) {
    log.error('mfa challenge (enroll) failed', challenge.error ?? undefined, { factorId })
    return {
      ok: false,
      error: challenge.error?.message ?? 'Could not start verification.',
    }
  }

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  })
  if (verify.error) {
    log.warn('mfa verify (enroll) failed', {
      factorId,
      error: verify.error.message,
    })
    return { ok: false, error: 'That code is incorrect. Check your Authenticator app and try again.' }
  }

  return { ok: true }
}

export async function unenroll(
  factorId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient()
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) {
    log.error('mfa unenroll failed', error, { factorId })
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export interface MfaFactor {
  id: string
  friendlyName: string
  factorType: string
  status: string
  createdAt: string
}

export async function listFactors(): Promise<MfaFactor[]> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error || !data) {
    log.error('mfa listFactors failed', error ?? undefined)
    return []
  }
  const totp = data.totp ?? []
  return totp.map((f) => ({
    id: f.id,
    friendlyName: f.friendly_name ?? 'Authenticator',
    factorType: f.factor_type,
    status: f.status,
    createdAt: f.created_at,
  }))
}

/**
 * Returns true if the current user has completed MFA for this session.
 * If false and they have enrolled factors, they should be redirected
 * to the /mfa challenge page.
 */
export async function isMfaSatisfied(): Promise<{
  satisfied: boolean
  requiresMfa: boolean
  verifiedFactorId: string | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) {
    // FAIL CLOSED. If Supabase Auth has a transient outage, an MFA-
    // enrolled user must NOT skip the challenge — the previous "assume
    // satisfied" branch let an upstream hiccup bypass MFA, defeating
    // the entire point of step-up auth. We claim "MFA required, no
    // verified factor available" so the caller redirects to /mfa
    // (which surfaces a clean error message rather than a silent pass).
    log.error('isMfaSatisfied: AAL check failed, failing closed', error)
    return { satisfied: false, requiresMfa: true, verifiedFactorId: null }
  }

  const requiresMfa = data.nextLevel === 'aal2'
  const satisfied = data.currentLevel === 'aal2' || !requiresMfa

  // Find the first verified factor to challenge against.
  let verifiedFactorId: string | null = null
  if (requiresMfa && !satisfied) {
    const factors = await listFactors()
    const verified = factors.find((f) => f.status === 'verified')
    verifiedFactorId = verified?.id ?? null
  }

  return { satisfied, requiresMfa, verifiedFactorId }
}

/** Verify a TOTP code at login. Returns ok on successful step-up. */
export async function verifyChallenge(
  factorId: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient()
  const challenge = await supabase.auth.mfa.challenge({ factorId })
  if (challenge.error || !challenge.data) {
    log.error('mfa challenge (login) failed', challenge.error ?? undefined, { factorId })
    return {
      ok: false,
      error: challenge.error?.message ?? 'Could not start verification.',
    }
  }

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  })
  if (verify.error) {
    return { ok: false, error: 'Incorrect code. Try again.' }
  }
  return { ok: true }
}
