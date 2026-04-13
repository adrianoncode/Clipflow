import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/send-welcome'

export default async function OnboardingCompletePage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()

  // Mark as onboarded
  await supabase
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', user.id)

  // Send welcome email (non-blocking, don't wait)
  const fullName = typeof user.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : user.email?.split('@')[0] ?? 'there'

  sendWelcomeEmail({
    toEmail: user.email ?? '',
    userName: fullName,
  }).catch(() => {}) // Fire and forget

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
