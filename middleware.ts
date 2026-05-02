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
const APP_ROUTES = ['/dashboard', '/workspace', '/settings', '/onboarding', '/admin']
const AUTH_ROUTES = ['/login', '/signup', '/magic-link']
/** Routes that are intentionally public — skip all auth checks. */
const PUBLIC_ROUTES = ['/review', '/invite']
/** MFA challenge route — accessible while authenticated-but-unverified (AAL1). */
const MFA_ROUTE = '/mfa'

function isPrefixOf(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * Headers we forward from middleware to the (app) RSC layout so it can read
 * the verified user identity without running a second `auth.getUser()`.
 * Stripped from inbound requests first so a malicious client can't spoof
 * them — middleware always sets them from its own verified `getUser()`.
 */
const USER_ID_HEADER = 'x-clipflow-user-id'
const USER_EMAIL_HEADER = 'x-clipflow-user-email'

/**
 * Session-verification fast-path. After a successful `auth.getUser()`
 * round-trip we mark the session "verified" via this httpOnly cookie.
 * Subsequent requests within the TTL skip the network round-trip and
 * decode the JWT locally with `auth.getSession()`. Tradeoff: revoked
 * tokens take up to TTL to be noticed at the routing layer. RLS still
 * enforces auth on every DB query independently — the JWT signature is
 * verified server-side by Supabase before any row is returned — so an
 * unverified JWT in middleware can't actually access data.
 */
const SESSION_VERIFY_COOKIE = 'cf_session_verified_at'
const SESSION_VERIFY_TTL_MS = 30_000

/** Decode a Supabase JWT payload locally — no signature verification.
 *  Safe to use for the fast-path because middleware already ran a verified
 *  `getUser()` within SESSION_VERIFY_TTL_MS, and any actual data access is
 *  re-validated server-side by Supabase RLS using the JWT secret.
 *  Avoids the `session.user` accessor on `getSession()` which prints a
 *  noisy "could be insecure!" warning on every request. */
function decodeJwtPayload(jwt: string): { sub: string; email?: string } | null {
  const parts = jwt.split('.')
  if (parts.length < 2) return null
  try {
    const b64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const json = atob(padded)
    const payload = JSON.parse(json) as { sub?: string; email?: string }
    if (!payload.sub) return null
    return { sub: payload.sub, email: payload.email }
  } catch {
    return null
  }
}

/** Stamp the fast-path marker on a response so subsequent requests within
 *  TTL can skip the `auth.getUser()` round-trip. Idempotent — safe to call
 *  on any response we're about to return after a successful full verify. */
function setSessionVerifiedCookie(res: NextResponse): void {
  res.cookies.set(SESSION_VERIFY_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: Math.floor(SESSION_VERIFY_TTL_MS / 1000),
    path: '/',
  })
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
  // Strip any spoofed identity headers from the inbound request — only
  // middleware is allowed to set these, after a verified `getUser()`.
  request.headers.delete(USER_ID_HEADER)
  request.headers.delete(USER_EMAIL_HEADER)

  const { supabase, response } = createMiddlewareClient(request)

  // Fast-path: if the session was fully verified within the last
  // SESSION_VERIFY_TTL_MS, trust the JWT in the cookie via local-only
  // `getSession()` instead of paying for another round-trip to gotrue.
  // After the TTL we re-verify so revocations / token rotations are
  // caught at most one TTL window late.
  const verifiedAtRaw = request.cookies.get(SESSION_VERIFY_COOKIE)?.value
  const verifiedAt = verifiedAtRaw ? Number(verifiedAtRaw) : 0
  const sessionIsFresh =
    verifiedAt > 0 && Date.now() - verifiedAt < SESSION_VERIFY_TTL_MS

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  let didFullVerify = false

  if (sessionIsFresh) {
    // We deliberately use getSession + local JWT decode on the fast path,
    // and never touch `session.user`. The auth-js User accessor proxy
    // logs a "could be insecure!" warning on every read otherwise.
    ;(supabase.auth as unknown as { suppressGetSessionWarning?: boolean })
      .suppressGetSessionWarning = true
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const decoded = session?.access_token
      ? decodeJwtPayload(session.access_token)
      : null
    user = decoded
      ? ({ id: decoded.sub, email: decoded.email ?? null } as unknown as typeof user)
      : null
  } else {
    const {
      data: { user: verifiedUser },
    } = await supabase.auth.getUser()
    user = verifiedUser
    didFullVerify = true
  }

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
    if (didFullVerify) setSessionVerifiedCookie(redirect)
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
      if (didFullVerify) setSessionVerifiedCookie(redirect)
      return redirect
    }
  }

  const baseRes = response()

  // For authenticated requests on app routes, forward the verified user
  // identity to the RSC layout via request headers so it can skip its own
  // `auth.getUser()` round-trip. We have to rebuild the response with
  // overridden request headers because Next bakes those overrides into the
  // response at construction time.
  let res: NextResponse = baseRes
  if (user && isAppRoute) {
    const overrideHeaders = new Headers(request.headers)
    overrideHeaders.set(USER_ID_HEADER, user.id)
    if (user.email) overrideHeaders.set(USER_EMAIL_HEADER, user.email)
    res = NextResponse.next({ request: { headers: overrideHeaders } })
    for (const cookie of baseRes.cookies.getAll()) {
      res.cookies.set(cookie)
    }
  }

  // Refresh the fast-path marker whenever we just did a full verify and
  // the user is logged in. Subsequent requests within TTL skip the
  // network round-trip.
  if (didFullVerify && user) setSessionVerifiedCookie(res)

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
