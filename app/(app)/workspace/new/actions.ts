'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a workspace name.').max(80),
  type: z.enum(['personal', 'team', 'client']),
})

export type NewWorkspaceState = { error?: string }

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base || 'workspace'}-${suffix}`
}

export async function createWorkspaceAction(
  _prev: NewWorkspaceState,
  formData: FormData,
): Promise<NewWorkspaceState> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  // Per-user creation cap. Without this, an authenticated user could
  // script the action and spawn unlimited workspaces (each = a row in
  // workspaces, workspace_members, and audit chatter). 10/hour is
  // generous for any legitimate user — agency power-users still well
  // below — but blocks scripted spam.
  const rl = await checkRateLimit(`workspace-create:${user.id}`, 10, 60 * 60_000)
  if (!rl.ok) {
    return {
      error: 'You\'ve hit the workspace creation limit. Try again in an hour.',
    }
  }

  const supabase = createClient()

  // Retry on slug collision. The 6-char suffix gives ~2 billion combos
  // but the unique constraint is `(owner_id, slug)`, so a single user
  // creating many workspaces hits collisions birthday-paradox-style
  // around the low thousands. Without retry the user sees a raw
  // Postgres unique-violation message.
  let newWorkspaceId: string | null = null
  let lastError: { message: string } | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase.rpc('create_workspace_with_owner', {
      _name: parsed.data.name,
      _slug: slugify(parsed.data.name),
      _type: parsed.data.type,
    })
    if (!error && data) {
      newWorkspaceId = data
      break
    }
    lastError = error
    // Postgres unique_violation is 23505 — retry with a fresh slug.
    if (error?.code !== '23505') break
  }

  if (!newWorkspaceId) {
    return { error: lastError?.message ?? 'Could not create workspace. Please try again.' }
  }

  // Switch the current workspace cookie to the new one
  cookies().set(CURRENT_WORKSPACE_COOKIE, newWorkspaceId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  if (parsed.data.type === 'client') {
    redirect(`/workspace/${newWorkspaceId}/onboarding`)
  }
  redirect(`/workspace/${newWorkspaceId}`)
}
