'use server'

import { headers } from 'next/headers'
import { z } from 'zod'

import { clientEnv } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, extractClientIp, RATE_LIMITS } from '@/lib/rate-limit'

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
})

export type MagicLinkState = {
  error?: string
  success?: boolean
}

export async function magicLinkAction(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  // Prevent email-bombing attacks: cap per-email requests tightly.
  // Also limit per-IP to stop signup spam.
  const ip = extractClientIp(headers())
  const emailKey = parsed.data.email.toLowerCase()
  const [ipCheck, emailCheck] = await Promise.all([
    checkRateLimit(
      `magic-link:ip:${ip}`,
      RATE_LIMITS.magicLink.limit,
      RATE_LIMITS.magicLink.windowMs,
    ),
    checkRateLimit(
      `magic-link:email:${emailKey}`,
      RATE_LIMITS.magicLink.limit,
      RATE_LIMITS.magicLink.windowMs,
    ),
  ])
  if (!ipCheck.ok || !emailCheck.ok) {
    return {
      error: 'Too many requests. Please wait a few minutes before trying again.',
    }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
