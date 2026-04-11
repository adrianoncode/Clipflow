import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

import { clientEnv } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

type CookieToSet = { name: string; value: string; options: CookieOptions }

/**
 * Supabase client for use in Server Components, Server Actions and Route
 * Handlers.
 *
 * Cookie-mutation note: in Server Components `cookies()` returns a read-only
 * store and calling `.set()` throws. We swallow that error — middleware is
 * responsible for refreshing auth cookies on each request, so a failed `set`
 * in an RSC context is harmless. In Server Actions / Route Handlers the
 * store is mutable and the `.set()` calls succeed as expected.
 *
 * This is the officially documented `@supabase/ssr` pattern for Next 14.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a Server Component — cookies are read-only here.
            // Middleware will refresh the session on the next request.
          }
        },
      },
    },
  )
}
