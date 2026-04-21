'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { verifyChallenge, isMfaSatisfied, unenroll, listFactors } from '@/lib/auth/mfa'
import { safeNextPath } from '@/lib/auth/safe-next-path'
import { consumeRecoveryCode } from '@/lib/auth/recovery-codes'
import { checkRateLimit, extractClientIp } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'

// Accept either a 6-digit TOTP code OR an 8-group recovery code like
// `A7K9-MP2X-QWN4-R8Z3` (32 chars, dashes optional, any case).
const schema = z.object({
  code: z
    .string()
    .trim()
    .min(6, 'Enter a valid code.')
    .max(40, 'Code too long.'),
  next: z.string().optional(),
})

export type MfaChallengeState = { error?: string }

function isTotpShape(code: string): boolean {
  return /^\d{6}$/.test(code)
}

export async function verifyMfaAction(
  _prev: MfaChallengeState,
  formData: FormData,
): Promise<MfaChallengeState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const parsed = schema.safeParse({
    code: formData.get('code'),
    next: formData.get('next') ?? undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  // Rate-limit failed attempts per-user per-IP to deter brute force.
  const ip = extractClientIp(headers())
  const rl = await checkRateLimit(`mfa:login:${user.id}:${ip}`, 10, 15 * 60_000)
  if (!rl.ok) {
    return { error: 'Too many attempts. Wait 15 minutes.' }
  }

  const status = await isMfaSatisfied()
  if (status.satisfied) {
    redirect(safeNextPath(parsed.data.next))
  }
  if (!status.verifiedFactorId) {
    return { error: 'No verified MFA factor found. Contact support.' }
  }

  const code = parsed.data.code

  // TOTP path — live 6-digit code from authenticator app.
  if (isTotpShape(code)) {
    const res = await verifyChallenge(status.verifiedFactorId, code)
    if (!res.ok) return { error: res.error }

    revalidatePath('/', 'layout')
    redirect(safeNextPath(parsed.data.next))
  }

  // Recovery-code path — user lost their authenticator, consuming one
  // of the 10 codes we issued on enrollment.
  //
  // When a recovery code succeeds, we unenroll the TOTP factor so the
  // user lands in a "no 2FA" state and can re-enroll fresh. This is
  // the safer default: assume the device is compromised, not just lost.
  // The user is notified via the success UI that they must re-enroll.
  const recovery = await consumeRecoveryCode(user.id, code)
  if (!recovery.ok) return { error: recovery.error }

  // Remove all existing TOTP factors so the session drops back to AAL1
  // and the user can re-enroll from settings.
  const factors = await listFactors()
  for (const f of factors) {
    await unenroll(f.id)
  }

  // Force a session refresh so the removed factor stops blocking
  // getAuthenticatorAssuranceLevel. Using admin client to force
  // re-issue a token with updated AAL.
  try {
    const admin = createAdminClient()
    // There's no "refresh" admin endpoint — signing out everywhere then
    // letting the user log in again is cleaner than a half-valid session.
    await admin.auth.admin.signOut(user.id, 'others')
  } catch (err) {
    log.error('recovery code sign-out-others failed', err, { userId: user.id })
  }

  log.warn('mfa recovery code consumed — TOTP factor removed', {
    userId: user.id,
  })

  revalidatePath('/', 'layout')
  redirect(`${safeNextPath(parsed.data.next)}?mfa_recovery=1`)
}
