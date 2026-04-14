import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { sendReferralWelcomeEmail } from '@/lib/email/send-referral-welcome'
import { lookupReferrerUserId } from './lookup-referrer'
import { isDisposableEmail } from './is-disposable-email'

/**
 * Called right after a new user's profile exists. Creates a referral row if:
 *   - the signup URL/cookie carried a valid referral code, AND
 *   - the referrer is not the new user themselves, AND
 *   - no referral row exists for this referee yet
 *
 * Status selection:
 *   - `blocked` if the referee's email is a known disposable inbox —
 *     common self-refer abuse vector. Row is still written so we can see
 *     it in analytics, but the webhook will never upgrade it to confirmed.
 *   - `pending` otherwise.
 *
 * Source captures the channel the referee came from (twitter, linkedin,
 * dm, email, organic…) for attribution.
 *
 * All errors are swallowed (logged, not thrown). A broken referral must
 * never break signup.
 */
export async function trackSignupReferral(params: {
  refereeUserId: string
  refereeEmail?: string | null
  rawReferralCode: string | null | undefined
  source?: string | null
}): Promise<void> {
  try {
    const referrerUserId = await lookupReferrerUserId(params.rawReferralCode)
    if (!referrerUserId) return
    if (referrerUserId === params.refereeUserId) return

    const status: 'pending' | 'blocked' = isDisposableEmail(params.refereeEmail)
      ? 'blocked'
      : 'pending'

    const admin = createAdminClient()
    const { error } = await admin.from('referrals').insert({
      referrer_user_id: referrerUserId,
      referee_user_id: params.refereeUserId,
      status,
      source: normalizeSource(params.source),
    })
    // The referee-unique constraint makes re-runs safe — swallow 23505
    // (unique violation), surface anything else.
    if (error && error.code !== '23505') {
      console.error('[trackSignupReferral] insert failed:', error.message)
      return
    }
    // Only a fresh pending referral gets the welcome email — re-runs
    // (same referee signing in again) and blocked rows stay silent.
    if (!error && status === 'pending' && params.refereeEmail) {
      await sendWelcomeEmail({
        refereeEmail: params.refereeEmail,
        referrerUserId,
      })
    }
  } catch (err) {
    console.error('[trackSignupReferral]', err)
  }
}

async function sendWelcomeEmail(params: {
  refereeEmail: string
  referrerUserId: string
}): Promise<void> {
  try {
    const admin = createAdminClient()
    const { data: referrer } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', params.referrerUserId)
      .maybeSingle()

    const display =
      (referrer?.full_name as string | null) ||
      (referrer?.email as string | undefined)?.split('@')[0] ||
      'A Clipflow user'

    await sendReferralWelcomeEmail({
      toEmail: params.refereeEmail,
      referrerDisplay: display,
    })
  } catch (err) {
    console.error('[trackSignupReferral] welcome email failed:', err)
  }
}

function normalizeSource(raw: string | null | undefined): string | null {
  if (!raw) return null
  const cleaned = raw.trim().toLowerCase()
  // Cap length + restrict to safe chars so a malicious URL can't stuff
  // garbage into analytics.
  if (!/^[a-z0-9_-]{1,32}$/.test(cleaned)) return null
  return cleaned
}

