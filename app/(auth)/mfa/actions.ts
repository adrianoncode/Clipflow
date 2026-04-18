'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { verifyChallenge, isMfaSatisfied } from '@/lib/auth/mfa'
import { checkRateLimit, extractClientIp } from '@/lib/rate-limit'

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.'),
  next: z.string().optional(),
})

export type MfaChallengeState = { error?: string }

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
    // Already satisfied (e.g. user hit back button). Just move on.
    redirect(parsed.data.next && parsed.data.next.startsWith('/') ? parsed.data.next : '/dashboard')
  }
  if (!status.verifiedFactorId) {
    return { error: 'No verified MFA factor found. Contact support.' }
  }

  const res = await verifyChallenge(status.verifiedFactorId, parsed.data.code)
  if (!res.ok) return { error: res.error }

  revalidatePath('/', 'layout')
  redirect(parsed.data.next && parsed.data.next.startsWith('/') ? parsed.data.next : '/dashboard')
}
