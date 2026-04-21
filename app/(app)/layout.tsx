import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AppShell } from '@/components/workspace/app-shell'
import { PostHogProvider } from '@/components/analytics/posthog-provider'
import { SubscriptionStatusBanner } from '@/components/billing/subscription-status-banner'
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

  // Read the cookie BEFORE the parallel batch so we can kick off
  // getWorkspacePlan for the user's active workspace in the same
  // Promise.all. Was previously sequential after the batch, adding
  // ~150ms of wait-time to every single authed page load.
  const cookieStore = cookies()
  const cookieWorkspaceId = cookieStore.get(CURRENT_WORKSPACE_COOKIE)?.value

  const [profile, workspaces, referralCode, referralStats, speculativePlan] =
    await Promise.all([
      getProfile(),
      getWorkspaces(),
      getOwnReferralCode(),
      getReferralStats(user.id),
      cookieWorkspaceId
        ? getWorkspacePlan(cookieWorkspaceId)
        : Promise.resolve(null),
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

  const personal = workspaces.find((w) => w.type === 'personal') ?? workspaces[0]!
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clipflow.to'
  const referralLink = referralCode ? `${baseUrl}/signup?ref=${referralCode}` : null

  // If the cookie-based speculative plan targeted the same workspace we
  // ended up rendering, reuse it — zero extra round-trip. Otherwise
  // (stale cookie, workspace rotated) fall back to a fresh fetch.
  // Thanks to React.cache() on getWorkspacePlan, the duplicate call
  // during this render still deduplicates with any later consumers.
  const currentPlan =
    speculativePlan !== null && cookieWorkspaceId === currentWorkspace.id
      ? speculativePlan
      : await getWorkspacePlan(currentWorkspace.id)

  return (
    <PostHogProvider userId={user.id} email={user.email ?? ''}>
      <AppShell
        user={{ id: user.id, email: user.email ?? '' }}
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspace.id}
        referralLink={referralLink}
        referralStats={referralStats}
        currentPlan={currentPlan}
      >
        {/* Billing-state banner above every page — past_due, unpaid, or
            cancel-scheduled subscriptions surface here so users notice
            before their plan actually flips to free. */}
        <SubscriptionStatusBanner workspaceId={currentWorkspace.id} />
        {children}
      </AppShell>
    </PostHogProvider>
  )
}
