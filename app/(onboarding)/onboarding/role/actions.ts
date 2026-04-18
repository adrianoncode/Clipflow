'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { ONBOARDING_ROLE_COOKIE } from '@/app/(onboarding)/onboarding/cookies'

// 'team' stays in the enum because the DB profiles table still has
// grandfathered users with role_type='team'. New onboarding only
// writes 'solo' or 'agency' (UI offers just those), but accepting
// 'team' as input keeps a future "re-run onboarding" flow from
// rejecting legacy users.
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
    maxAge: 60 * 60 * 24, // 24 hours — user may pause onboarding
    path: '/',
  })

  redirect('/onboarding/workspace')
}
