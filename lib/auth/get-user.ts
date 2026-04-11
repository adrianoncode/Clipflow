import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'

/**
 * Returns the currently authenticated user, or `null` if unauthenticated.
 *
 * Uses `getUser()` — which contacts the Supabase auth server and verifies the
 * JWT — rather than the faster `getSession()` which blindly trusts the
 * cookie. Slight latency cost, but the only correct choice for anything that
 * makes an auth decision.
 *
 * Wrapped in React `cache` so multiple RSC calls in one request deduplicate.
 */
export const getUser = cache(async () => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})
