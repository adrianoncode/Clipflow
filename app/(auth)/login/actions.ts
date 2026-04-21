'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/safe-next-path'
import { checkRateLimit, extractClientIp, RATE_LIMITS } from '@/lib/rate-limit'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  next: z.string().optional(),
})

export type LoginState = {
  error?: string
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  // Rate-limit on both the IP and the email — an attacker rotating IPs
  // still gets stopped on the target email, and an attacker enumerating
  // emails still gets stopped on the source IP.
  const ip = extractClientIp(headers())
  const emailKey = parsed.data.email.toLowerCase()
  const [ipCheck, emailCheck] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowMs),
    checkRateLimit(`login:email:${emailKey}`, RATE_LIMITS.login.limit, RATE_LIMITS.login.windowMs),
  ])
  if (!ipCheck.ok || !emailCheck.ok) {
    return {
      error: 'Too many login attempts. Please wait 15 minutes and try again.',
    }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Incorrect email or password.' }
  }

  revalidatePath('/', 'layout')
  redirect(safeNextPath(parsed.data.next))
}
