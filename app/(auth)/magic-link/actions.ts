'use server'

import { z } from 'zod'

import { clientEnv } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

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
