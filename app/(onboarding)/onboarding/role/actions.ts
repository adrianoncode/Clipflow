'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { ONBOARDING_ROLE_COOKIE } from '@/app/(onboarding)/onboarding/cookies'

const schema = z.object({
  role: z.enum(['solo', 'team', 'agency']),
})

export type RoleState = { error?: string }

export async function selectRoleAction(
  _prev: RoleState,
  formData: FormData,
): Promise<RoleState> {
  const parsed = schema.safeParse({ role: formData.get('role') })
  if (!parsed.success) {
    return { error: 'Please choose how you plan to use Clipflow.' }
  }

  cookies().set(ONBOARDING_ROLE_COOKIE, parsed.data.role, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 30, // 30 minutes
    path: '/',
  })

  redirect('/onboarding/workspace')
}
