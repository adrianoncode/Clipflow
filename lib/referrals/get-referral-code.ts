import 'server-only'

import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'
import { log } from '@/lib/log'

/**
 * Returns the logged-in user's referral code. RLS lets the user read their
 * own profile row, so no admin client is needed.
 */
export const getOwnReferralCode = cache(async (): Promise<string | null> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('referral_code')
    .maybeSingle()

  if (error) {
    log.error('getOwnReferralCode failed', error)
    return null
  }
  return (data?.referral_code as string | null) ?? null
})
