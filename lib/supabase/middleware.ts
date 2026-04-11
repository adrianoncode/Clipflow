import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { clientEnv } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

type CookieToSet = { name: string; value: string; options: CookieOptions }

/**
 * Build a Supabase client that reads cookies from a `NextRequest` and writes
 * any session-refresh cookies to both the request (so downstream handlers
 * see them within the same execution) and the response (so the browser
 * persists them).
 *
 * Returns the client together with the mutable `response` object. The caller
 * must return `response` — or clone it onto any redirect response — so the
 * refreshed cookies survive.
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  return { supabase, response: () => response }
}
