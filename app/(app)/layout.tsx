import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AppShell } from '@/components/workspace/app-shell'
import { getProfile } from '@/lib/auth/get-profile'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getOwnReferralCode } from '@/lib/referrals/get-referral-code'
import { getReferralStats } from '@/lib/referrals/get-stats'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const [profile, workspaces, referralCode, referralStats] = await Promise.all([
    getProfile(),
    getWorkspaces(),
    getOwnReferralCode(),
    getReferralStats(user.id),
  ])

  // Onboarding gate: newly signed-up users must run the wizard before they
  // can reach the main app shell. Profile may also be null if RLS or timing
  // hides it (shouldn't happen post-M1, but be defensive).
  if (!profile || profile.onboarded_at === null) {
    redirect('/onboarding/role')
  }

  if (workspaces.length === 0) {
    // The signup trigger guarantees every user has at least their personal
    // workspace. If this runs we either failed to create it, or RLS blocks
    // the read — route the user somewhere harmless instead of rendering a
    // broken shell.
    redirect('/onboarding/role')
  }

  const cookieStore = cookies()
  const cookieWorkspaceId = cookieStore.get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal') ?? workspaces[0]!
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clipflow.to'
  const referralLink = referralCode ? `${baseUrl}/signup?ref=${referralCode}` : null

  // Know the plan so the referral card can tailor its wording — free users
  // have earned a discount that's waiting for them to upgrade.
  const currentPlan = await getWorkspacePlan(currentWorkspace.id)

  return (
    <AppShell
      user={{ id: user.id, email: user.email ?? '' }}
      workspaces={workspaces}
      currentWorkspaceId={currentWorkspace.id}
      referralLink={referralLink}
      referralStats={referralStats}
      currentPlan={currentPlan}
    >
      {children}
    </AppShell>
  )
}
