'use server'

import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { clientEnv } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { REFERRAL_COOKIE, REFERRAL_SOURCE_COOKIE } from '@/lib/referrals/constants'
import { trackSignupReferral } from '@/lib/referrals/track-signup'
import { checkRateLimit, extractClientIp, RATE_LIMITS } from '@/lib/rate-limit'

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  fullName: z.string().min(1, 'Please enter your name.').max(120),
})

export type SignupState = {
  error?: string
}

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  // Cap per-IP signup attempts to stop spam / abuse accounts.
  const ip = extractClientIp(headers())
  const rateCheck = await checkRateLimit(
    `signup:ip:${ip}`,
    RATE_LIMITS.signup.limit,
    RATE_LIMITS.signup.windowMs,
  )
  if (!rateCheck.ok) {
    return { error: 'Too many signup attempts from your IP. Please try again later.' }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'An account with that email already exists.' }
    }
    return { error: error.message }
  }

  // Fire-and-forget referral tracking. The DB trigger guarantees the
  // profile row exists by the time this runs (handle_new_user runs
  // inside the signup transaction).
  const cookieStore = cookies()
  const refCode = cookieStore.get(REFERRAL_COOKIE)?.value ?? null
  const refSource = cookieStore.get(REFERRAL_SOURCE_COOKIE)?.value ?? null
  if (refCode && data.user?.id) {
    await trackSignupReferral({
      refereeUserId: data.user.id,
      refereeEmail: parsed.data.email,
      rawReferralCode: refCode,
      source: refSource,
    })
    // Clear the cookies once consumed so they can't attach a second signup.
    cookieStore.delete(REFERRAL_COOKIE)
    cookieStore.delete(REFERRAL_SOURCE_COOKIE)
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding/role')
}
