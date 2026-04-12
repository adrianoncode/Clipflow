import { NextResponse, type NextRequest } from 'next/server'

import { createMiddlewareClient } from '@/lib/supabase/middleware'

/**
 * Route-group folders like `(app)` and `(auth)` don't appear in
 * `request.nextUrl.pathname` — we must match real URL prefixes.
 */
const APP_ROUTES = ['/dashboard', '/workspace', '/settings', '/onboarding']
const AUTH_ROUTES = ['/login', '/signup', '/magic-link']
/** Routes that are intentionally public — skip all auth checks. */
const PUBLIC_ROUTES = ['/review', '/invite']

function isPrefixOf(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
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
  if (isPrefixOf(pathname, PUBLIC_ROUTES)) return response()

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

  return response()
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
