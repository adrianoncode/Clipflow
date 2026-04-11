import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

/**
 * Onboarding Step 4 — Done.
 *
 * Server Component with a side effect: sets profiles.onboarded_at = now(),
 * invalidates the (app) layout cache so the next render sees the updated
 * profile, and redirects to /dashboard. No UI is rendered — the whole page
 * body is a redirect chain.
 *
 * Idempotent: running it twice just pushes onboarded_at forward, which is
 * harmless.
 */
export default async function OnboardingCompletePage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    // Even if the update fails we send the user somewhere sane. (app)/layout
    // will bounce them back if onboarded_at is still null.
    // eslint-disable-next-line no-console
    console.error('[onboarding/complete]', error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
