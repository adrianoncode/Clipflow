import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

// Workspace shell — every route under (app) is auth-gated user data.
// Hard-noindex at the layout level so /dashboard, /workspace/*,
// /settings/*, /content/*, /library, etc. all inherit the directive.
// robots.txt also disallows the prefixes but the meta-tag is what
// actually de-indexes a page that already crept into Google's index.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

import { PostHogProvider } from '@/components/analytics/posthog-provider'
import { SubscriptionStatusBanner } from '@/components/billing/subscription-status-banner'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { FeedbackWidget } from '@/components/feedback-widget'
import { AppSidebar } from '@/components/workspace/app-sidebar'
import { AppTopbar } from '@/components/workspace/app-topbar'
import { MobileNavProvider } from '@/components/workspace/mobile-nav-context'
import { getProfile } from '@/lib/auth/get-profile'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getSubscription } from '@/lib/billing/get-subscription'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

// Crextio-inspired page-level gradient. Replaces the old white-on-white
// AppShell aesthetic. Same tokens as (insights)/layout so chrome stays
// consistent if the dashboard tweaks them.
const PAGE_BG = 'linear-gradient(125deg, #B5B8C2 0%, #D4D1BE 32%, #EDDB8B 100%)'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // The middleware already ran a verified `auth.getUser()` and forwarded
  // the resulting identity via request headers. Reading them is a local
  // operation — saves us a second JWT-verify round-trip to Supabase.
  const headerList = headers()
  const userId = headerList.get('x-clipflow-user-id')
  const userEmail = headerList.get('x-clipflow-user-email')
  if (!userId) redirect('/login')
  const user = { id: userId, email: userEmail ?? '' }

  const cookieStore = cookies()
  const cookieWorkspaceId = cookieStore.get(CURRENT_WORKSPACE_COOKIE)?.value

  const [profile, workspaces] = await Promise.all([
    getProfile(),
    getWorkspaces(),
  ])

  if (!profile || profile.onboarded_at === null) redirect('/onboarding/role')
  if (workspaces.length === 0) redirect('/onboarding/role')

  const personal = workspaces.find((w) => w.type === 'personal') ?? workspaces[0]!
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal

  // Show the trial card in the sidebar only while the subscription is in
  // a `trialing` state. `current_period_end` is the trial end-date during
  // that window. Outside of trial we leave the slot empty rather than
  // showing a synthetic "0 days" footer.
  const subscription = await getSubscription(currentWorkspace.id)
  let trialDaysLeft: number | null = null
  if (subscription.status === 'trialing' && subscription.current_period_end) {
    const ms = new Date(subscription.current_period_end).getTime() - Date.now()
    if (ms > 0) trialDaysLeft = Math.ceil(ms / (1000 * 60 * 60 * 24))
  }

  return (
    <PostHogProvider userId={user.id} email={user.email ?? ''}>
      <MobileNavProvider>
        <div className="flex min-h-screen" style={{ background: PAGE_BG }}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#0F0F0F] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
          >
            Skip to main content
          </a>

          <KeyboardShortcuts workspaceId={currentWorkspace.id} />
          <FeedbackWidget />

          <AppSidebar
            currentWorkspaceId={currentWorkspace.id}
            trialDaysLeft={trialDaysLeft}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <AppTopbar
              workspaces={workspaces}
              currentWorkspaceId={currentWorkspace.id}
              workspaceName={currentWorkspace.name}
              userEmail={user.email ?? ''}
            />
            <main id="main-content" className="flex-1 px-4 pb-8 sm:px-8">
              <SubscriptionStatusBanner workspaceId={currentWorkspace.id} />
              {children}
            </main>
          </div>
        </div>
      </MobileNavProvider>
    </PostHogProvider>
  )
}
