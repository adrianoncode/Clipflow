'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { ONBOARDING_ROLE_COOKIE } from '@/app/(onboarding)/onboarding/cookies'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

export type WorkspaceState = { error?: string }

// ---------------------------------------------------------------------------
// Solo path — rename the existing personal workspace
// ---------------------------------------------------------------------------
const soloSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().trim().min(1, 'Please enter a workspace name.').max(80),
})

export async function completePersonalWorkspaceAction(
  _prev: WorkspaceState,
  formData: FormData,
): Promise<WorkspaceState> {
  const parsed = soloSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    name: formData.get('name'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()

  const { error: wsError } = await supabase
    .from('workspaces')
    .update({ name: parsed.data.name })
    .eq('id', parsed.data.workspace_id)
  if (wsError) {
    return { error: 'Could not update workspace. Please try again.' }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role_type: 'solo' })
    .eq('id', user.id)
  if (profileError) {
    return { error: 'Could not update your profile. Please try again.' }
  }

  cookies().delete(ONBOARDING_ROLE_COOKIE)
  redirect('/onboarding/ai-key')
}

// ---------------------------------------------------------------------------
// Team / Agency path — create a new workspace via the RPC
// ---------------------------------------------------------------------------
const teamSchema = z.object({
  name: z.string().trim().min(1, 'Please enter a workspace name.').max(80),
  role_type: z.enum(['team', 'agency']),
})

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

export async function createTeamWorkspaceAction(
  _prev: WorkspaceState,
  formData: FormData,
): Promise<WorkspaceState> {
  const parsed = teamSchema.safeParse({
    name: formData.get('name'),
    role_type: formData.get('role_type'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()

  // Agency users go straight to `client` workspace type — their first
  // workspace IS their studio / agency brand. `team` stays as the
  // legacy type only for users who are grandfathered in from the
  // pre-ICP-split schema.
  const workspaceType = parsed.data.role_type === 'agency' ? 'client' : 'team'
  const { data: newWorkspaceId, error: rpcError } = await supabase.rpc(
    'create_workspace_with_owner',
    {
      _name: parsed.data.name,
      _slug: slugify(parsed.data.name),
      _type: workspaceType,
    },
  )
  if (rpcError || !newWorkspaceId) {
    return { error: 'Could not create workspace. Please try again.' }
  }

  cookies().set(CURRENT_WORKSPACE_COOKIE, newWorkspaceId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role_type: parsed.data.role_type })
    .eq('id', user.id)
  if (profileError) {
    return { error: 'Could not update your profile. Please try again.' }
  }

  cookies().delete(ONBOARDING_ROLE_COOKIE)
  redirect('/onboarding/ai-key')
}
