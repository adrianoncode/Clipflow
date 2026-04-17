import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeReferralCode } from './normalize-code'
import { log } from '@/lib/log'

/**
 * Resolves a referral code to the referrer's user id, bypassing RLS
 * (we need to look up a profile that is not the current user's).
 *
 * Returns null for unknown / malformed codes. Callers must also verify
 * that the resolved referrer is not the current user (self-refer).
 */
export async function lookupReferrerUserId(rawCode: string | null | undefined): Promise<string | null> {
  const code = normalizeReferralCode(rawCode)
  if (!code) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .maybeSingle()

  if (error) {
    log.error('lookupReferrerUserId failed', error)
    return null
  }
  return (data?.id as string | undefined) ?? null
}
