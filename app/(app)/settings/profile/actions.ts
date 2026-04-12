'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'

export type ProfileState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const fullName = formData.get('full_name')?.toString().trim() ?? ''
  if (!fullName) return { ok: false, error: 'Name cannot be empty.' }
  if (fullName.length > 80) return { ok: false, error: 'Name must be 80 characters or fewer.' }

  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings/profile')
  return { ok: true }
}

export async function sendPasswordResetAction(
  _prev: ProfileState,
  _formData: FormData,
): Promise<ProfileState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(user.email ?? '', {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback?next=/settings/profile`,
  })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
