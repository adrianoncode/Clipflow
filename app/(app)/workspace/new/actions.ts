'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
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

  const supabase = createClient()

  const { data: newWorkspaceId, error: rpcError } = await supabase.rpc(
    'create_workspace_with_owner',
    {
      _name: parsed.data.name,
      _slug: slugify(parsed.data.name),
      _type: parsed.data.type,
    },
  )

  if (rpcError || !newWorkspaceId) {
    return { error: rpcError?.message ?? 'Could not create workspace. Please try again.' }
  }

  // Switch the current workspace cookie to the new one
  cookies().set(CURRENT_WORKSPACE_COOKIE, newWorkspaceId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  redirect(`/workspace/${newWorkspaceId}`)
}
