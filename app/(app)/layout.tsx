import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { PostHogProvider } from '@/components/analytics/posthog-provider'
import { SubscriptionStatusBanner } from '@/components/billing/subscription-status-banner'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { FeedbackWidget } from '@/components/feedback-widget'
import { AppTopNav } from '@/components/workspace/app-top-nav'
import { getProfile } from '@/lib/auth/get-profile'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

// Crextio-inspired page-level gradient. Replaces the old white-on-white
// AppShell aesthetic. Same tokens as (insights)/layout so chrome stays
// consistent if the dashboard tweaks them.
const PAGE_BG = 'linear-gradient(125deg, #B5B8C2 0%, #D4D1BE 32%, #EDDB8B 100%)'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const cookieStore = cookies()
  const cookieWorkspaceId = cookieStore.get(CURRENT_WORKSPACE_COOKIE)?.value

  const [profile, workspaces, speculativePlan] = await Promise.all([
    getProfile(),
    getWorkspaces(),
    cookieWorkspaceId
      ? getWorkspacePlan(cookieWorkspaceId)
      : Promise.resolve(null),
  ])

  if (!profile || profile.onboarded_at === null) redirect('/onboarding/role')
  if (workspaces.length === 0) redirect('/onboarding/role')

  const personal = workspaces.find((w) => w.type === 'personal') ?? workspaces[0]!
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal

  // Resolve plan — reuse the speculative fetch when the cookie matched
  // the workspace we ended up rendering, fall back otherwise.
  void (
    speculativePlan !== null && cookieWorkspaceId === currentWorkspace.id
      ? speculativePlan
      : await getWorkspacePlan(currentWorkspace.id)
  )

  return (
    <PostHogProvider userId={user.id} email={user.email ?? ''}>
      <div className="min-h-screen" style={{ background: PAGE_BG }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#0F0F0F] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>

        <KeyboardShortcuts workspaceId={currentWorkspace.id} />
        <FeedbackWidget />

        <AppTopNav
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspace.id}
          userEmail={user.email ?? ''}
        />

        <main id="main-content" className="px-4 pb-8 sm:px-8">
          <SubscriptionStatusBanner workspaceId={currentWorkspace.id} />
          {children}
        </main>
      </div>
    </PostHogProvider>
  )
}
