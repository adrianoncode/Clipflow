import { createBrowserClient } from '@supabase/ssr'

import { clientEnv } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

/**
 * Supabase client for use in Client Components ("use client").
 *
 * Never import this from a Server Component or a Route Handler — use
 * `createClient()` from `@/lib/supabase/server` instead.
 */
export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
