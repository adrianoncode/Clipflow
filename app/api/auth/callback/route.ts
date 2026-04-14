import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { REFERRAL_COOKIE, REFERRAL_SOURCE_COOKIE } from '@/lib/referrals/constants'
import { trackSignupReferral } from '@/lib/referrals/track-signup'

/**
 * OAuth / Magic link callback. Supabase redirects here with a `code` query
 * parameter after the user clicks their sign-in link. We exchange it for a
 * session (which sets the auth cookies via our server client) and then send
 * them to the post-login destination.
 *
 * Also picks up any pending referral cookie — users who sign up via magic
 * link never hit the password-signup action, so this is the only place to
 * record their referral. `trackSignupReferral` is idempotent (unique
 * constraint on referee_user_id), so re-running on a returning magic-link
 * login is harmless.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    )
  }

  const cookieStore = cookies()
  const refCode = cookieStore.get(REFERRAL_COOKIE)?.value ?? null
  const refSource = cookieStore.get(REFERRAL_SOURCE_COOKIE)?.value ?? null
  if (refCode && data.user?.id) {
    await trackSignupReferral({
      refereeUserId: data.user.id,
      refereeEmail: data.user.email ?? null,
      rawReferralCode: refCode,
      source: refSource,
    })
    // Consume the cookies so they can't ever attach a second account.
    cookieStore.delete(REFERRAL_COOKIE)
    cookieStore.delete(REFERRAL_SOURCE_COOKIE)
  }

  return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/dashboard'}`)
}
