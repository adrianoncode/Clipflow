import { NextResponse, type NextRequest } from 'next/server'

import { clientEnv } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

/**
 * Sign-out endpoint.
 *
 * Defense-in-depth CSRF check: SameSite=Lax cookies already block most
 * cross-site forms (since this is a top-level navigation POST, Lax permits
 * it for some browsers — Safari pre-13 in particular), so we additionally
 * require the request `Origin` (or `Referer` fallback) to match
 * `NEXT_PUBLIC_APP_URL`. Without this, an attacker page could embed a
 * <form action="https://app.example/api/auth/signout" method="POST"> and
 * forcibly log victims out — annoying at best, a phishing pre-step at
 * worst (logged-out user re-enters credentials on the next prompt).
 */
export async function POST(request: NextRequest) {
  const expectedOrigin = new URL(clientEnv.NEXT_PUBLIC_APP_URL).origin
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Prefer Origin (always set by browsers on POST). Fall back to Referer
  // when an opaque origin (sandbox iframe) strips it. If neither matches
  // the configured app origin, refuse — this is not a user-initiated
  // request from our own UI.
  const refererOrigin = (() => {
    if (!referer) return null
    try {
      return new URL(referer).origin
    } catch {
      return null
    }
  })()

  const sourceOrigin = origin ?? refererOrigin
  if (sourceOrigin !== expectedOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}
