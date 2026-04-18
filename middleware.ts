import { NextResponse, type NextRequest } from 'next/server'

import { createMiddlewareClient } from '@/lib/supabase/middleware'
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE,
  REFERRAL_SOURCE_COOKIE,
} from '@/lib/referrals/constants'
import { normalizeReferralCode } from '@/lib/referrals/normalize-code'

/**
 * Route-group folders like `(app)` and `(auth)` don't appear in
 * `request.nextUrl.pathname` — we must match real URL prefixes.
 */
const APP_ROUTES = ['/dashboard', '/workspace', '/settings', '/onboarding']
const AUTH_ROUTES = ['/login', '/signup', '/magic-link']
/** Routes that are intentionally public — skip all auth checks. */
const PUBLIC_ROUTES = ['/review', '/invite']
/** MFA challenge route — accessible while authenticated-but-unverified (AAL1). */
const MFA_ROUTE = '/mfa'

function isPrefixOf(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Persist `?ref=XXXX` into a cookie so the signup flow can pick it up
 * even if the user clicks around the site before creating an account.
 * Safe to call on every request — no-ops when the param is missing or
 * malformed.
 */
function attachReferralCookie(request: NextRequest, res: NextResponse): void {
  const raw = request.nextUrl.searchParams.get('ref')
  const code = normalizeReferralCode(raw)
  if (!code) return

  const baseCookie = {
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax' as const,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  }
  res.cookies.set(REFERRAL_COOKIE, code, baseCookie)

  // Optional attribution channel — `?source=twitter`, `?source=linkedin`,
  // etc. Only persist if the attached ref is also present so dangling
  // `?source=` params don't poison later signups.
  const rawSource = request.nextUrl.searchParams.get('source')
  if (rawSource) {
    const cleaned = rawSource.trim().toLowerCase()
    if (/^[a-z0-9_-]{1,32}$/.test(cleaned)) {
      res.cookies.set(REFERRAL_SOURCE_COOKIE, cleaned, baseCookie)
    }
  }
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)

  // IMPORTANT: use getUser(), not getSession(). getUser() verifies the JWT
  // with the Supabase auth server and is the only trustworthy check.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Public routes (e.g. /review/[token]) bypass auth entirely.
  if (isPrefixOf(pathname, PUBLIC_ROUTES)) {
    const res = response()
    attachReferralCookie(request, res)
    return res
  }

  const isAppRoute = isPrefixOf(pathname, APP_ROUTES)
  const isAuthRoute = isPrefixOf(pathname, AUTH_ROUTES)

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    const redirect = NextResponse.redirect(url)
    for (const cookie of response().cookies.getAll()) {
      redirect.cookies.set(cookie)
    }
    attachReferralCookie(request, redirect)
    return redirect
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.searchParams.delete('next')
    const redirect = NextResponse.redirect(url)
    for (const cookie of response().cookies.getAll()) {
      redirect.cookies.set(cookie)
    }
    return redirect
  }

  // MFA step-up gate: if the user's session is AAL1 but they have MFA
  // enrolled (nextLevel === 'aal2'), force them through /mfa before
  // they can hit any protected app route.
  if (user && isAppRoute && pathname !== MFA_ROUTE) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const url = request.nextUrl.clone()
      url.pathname = MFA_ROUTE
      url.searchParams.set('next', pathname)
      const redirect = NextResponse.redirect(url)
      for (const cookie of response().cookies.getAll()) {
        redirect.cookies.set(cookie)
      }
      return redirect
    }
  }

  const res = response()
  attachReferralCookie(request, res)
  return res
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - _next/static, _next/image
     * - favicon
     * - static asset extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
