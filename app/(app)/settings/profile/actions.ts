'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import { log } from '@/lib/log'

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
 * Revoke all of the current user's sessions across every device.
 * Useful after suspected password compromise — the admin Supabase API
 * invalidates every refresh token for this user. The caller's current
 * session also gets signed out (so they have to log in again).
 */
export async function signOutAllSessionsAction(
  _prev: ProfileState,
  _formData: FormData,
): Promise<ProfileState> {
  const user = await getUser()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const admin = createAdminClient()
  // scope: 'global' signs out every session for this user (all devices + tabs).
  const { error } = await admin.auth.admin.signOut(user.id, 'global')
  if (error) {
    return { ok: false, error: 'Could not sign out of all sessions.' }
  }

  // Also clear the current session's cookies locally so the redirect
  // actually goes to /login without a stale cookie.
  const supabase = createClient()
  await supabase.auth.signOut()

  redirect('/login?logged_out_everywhere=true')
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
    // 1. Cancel any active Stripe subscriptions on workspaces the user
    //    owns, BEFORE deleting the workspace rows. Otherwise we'd leave
    //    orphaned subscriptions billing a deleted account and Stripe
    //    eventually generates unpaid-invoice emails to a dead mailbox.
    //    We cancel immediately (not end-of-period) because the
    //    workspace itself is about to be deleted.
    const { data: ownedWorkspaces } = await admin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)

    if (ownedWorkspaces && ownedWorkspaces.length > 0) {
      const { data: subs } = await admin
        .from('subscriptions')
        .select('stripe_subscription_id')
        .in('workspace_id', ownedWorkspaces.map((w) => w.id))
        .not('stripe_subscription_id', 'is', null)

      if (subs && subs.length > 0) {
        // Lazy-load Stripe so local dev without a secret doesn't fail
        // the whole action; cancellations just get skipped.
        try {
          const { stripe } = await import('@/lib/stripe/client')
          await Promise.allSettled(
            subs.map((s) =>
              s.stripe_subscription_id
                ? stripe.subscriptions.cancel(s.stripe_subscription_id)
                : Promise.resolve(),
            ),
          )
        } catch {
          // Cancellation failing shouldn't block account deletion — the
          // user's GDPR right trumps our bookkeeping. Log and continue.
        }
      }
    }

    // 2. Delete all workspaces owned by this user (cascades to content,
    //    outputs, subscriptions, etc. via FK constraints).
    await admin
      .from('workspaces')
      .delete()
      .eq('owner_id', user.id)

    // 3. Delete profile
    await admin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    // 4. Delete auth user (Supabase Admin API)
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      log.error('account deletion: auth.admin.deleteUser failed', error, {
        userId: user.id,
      })
      return {
        ok: false,
        error: `Could not remove the auth record: ${error.message}. Contact support if this persists.`,
      }
    }
  } catch (err) {
    // Pull the real message up so the user has something actionable.
    // We still suggest support because mid-deletion failures mean the
    // account is in an inconsistent half-deleted state.
    const detail = err instanceof Error ? err.message : 'Unknown error'
    log.error('account deletion: unexpected failure', err, { userId: user.id })
    return {
      ok: false,
      error: `Account deletion failed partway through: ${detail}. Contact support so we can finish the cleanup.`,
    }
  }

  redirect('/login?deleted=true')
}
