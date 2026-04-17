'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

/**
 * Permanently deletes the user's account and all associated data.
 * Cascades through: workspaces, content, outputs, subscriptions, profiles.
 * GDPR "right to be forgotten" compliance.
 */
export async function deleteAccountAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const confirmation = formData.get('confirmation')?.toString().trim()
  if (confirmation !== 'DELETE') {
    return { ok: false, error: 'Please type DELETE to confirm.' }
  }

  const admin = createAdminClient()

  try {
    // 1. Delete all workspaces owned by this user (cascades to content, outputs, etc.)
    await admin
      .from('workspaces')
      .delete()
      .eq('owner_id', user.id)

    // 2. Delete profile
    await admin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    // 3. Delete auth user (Supabase Admin API)
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      return { ok: false, error: 'Failed to delete account. Please contact support.' }
    }
  } catch {
    return { ok: false, error: 'Something went wrong. Please contact support.' }
  }

  redirect('/login?deleted=true')
}
