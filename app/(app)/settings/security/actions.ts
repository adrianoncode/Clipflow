'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import {
  enrollTotp,
  verifyEnrollment,
  unenroll,
  type EnrollResult,
} from '@/lib/auth/mfa'
import { regenerateRecoveryCodes } from '@/lib/auth/recovery-codes'
import { checkRateLimit, extractClientIp } from '@/lib/rate-limit'

export type StartEnrollState =
  | { ok?: undefined }
  | { ok: true; enroll: EnrollResult }
  | { ok: false; error: string }

/**
 * Start a new TOTP enrollment. Returns a QR code data-URI and the
 * plaintext secret. The user scans the QR in their Authenticator app
 * then submits the first 6-digit code to `verifyTotpEnrollmentAction`.
 */
export async function startTotpEnrollmentAction(
  _prev: StartEnrollState,
  _formData: FormData,
): Promise<StartEnrollState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const res = await enrollTotp('Clipflow Authenticator')
  if (!res.ok) return res
  return { ok: true, enroll: res.data }
}

const verifySchema = z.object({
  factor_id: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.'),
})

export type VerifyEnrollState =
  | { ok?: undefined }
  | { ok: true; recoveryCodes: string[] }
  | { ok: false; error: string }

export async function verifyTotpEnrollmentAction(
  _prev: VerifyEnrollState,
  formData: FormData,
): Promise<VerifyEnrollState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const parsed = verifySchema.safeParse({
    factor_id: formData.get('factor_id'),
    code: formData.get('code'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  // Rate-limit failed TOTP attempts per-user to slow brute force.
  const ip = extractClientIp(headers())
  const rl = await checkRateLimit(
    `mfa:verify:${user.id}:${ip}`,
    10,
    15 * 60_000,
  )
  if (!rl.ok) {
    return { ok: false, error: 'Too many attempts. Wait 15 minutes.' }
  }

  const res = await verifyEnrollment(parsed.data.factor_id, parsed.data.code)
  if (!res.ok) return res

  // Generate recovery codes immediately. User sees them ONCE — they
  // must copy them somewhere safe. We return them in the action state
  // instead of revalidating away from the form.
  const codes = await regenerateRecoveryCodes(user.id)
  if (!codes.ok) {
    // TOTP enrollment succeeded but codes failed — still useful,
    // user can regenerate from settings.
    revalidatePath('/settings/security')
    return { ok: true, recoveryCodes: [] }
  }

  revalidatePath('/settings/security')
  return { ok: true, recoveryCodes: codes.codes }
}

export type RegenerateCodesState =
  | { ok?: undefined }
  | { ok: true; recoveryCodes: string[] }
  | { ok: false; error: string }

export async function regenerateRecoveryCodesAction(
  _prev: RegenerateCodesState,
  _formData: FormData,
): Promise<RegenerateCodesState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const ip = extractClientIp(headers())
  const rl = await checkRateLimit(
    `mfa:regenerate:${user.id}:${ip}`,
    5,
    60 * 60_000,
  )
  if (!rl.ok) {
    return { ok: false, error: 'Too many regenerations. Wait an hour.' }
  }

  const res = await regenerateRecoveryCodes(user.id)
  if (!res.ok) return res

  revalidatePath('/settings/security')
  return { ok: true, recoveryCodes: res.codes }
}

const unenrollSchema = z.object({
  factor_id: z.string().uuid(),
})

export type UnenrollState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function unenrollTotpAction(
  _prev: UnenrollState,
  formData: FormData,
): Promise<UnenrollState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const parsed = unenrollSchema.safeParse({ factor_id: formData.get('factor_id') })
  if (!parsed.success) return { ok: false, error: 'Invalid factor.' }

  const res = await unenroll(parsed.data.factor_id)
  if (!res.ok) return res

  revalidatePath('/settings/security')
  return { ok: true }
}
