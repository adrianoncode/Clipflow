import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { PostHogProvider } from '@/components/analytics/posthog-provider'
import { getProfile } from '@/lib/auth/get-profile'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { InsightsTopNav } from '@/components/workspace/insights-top-nav'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * Layout for the Insights surface (currently /dashboard).
 *
 * Departs from the (app) shell: instead of a left sidebar, the chrome is
 * a horizontal pill nav at the top, sitting on a cream/yellow gradient
 * page bg. The dashboard page itself renders its own bento. This layout
 * is responsible for auth, workspace resolution, and rendering the
 * top-nav header.
 *
 * Why a separate route group? The sidebar lives in <AppShell> via
 * (app)/layout.tsx. Layouts compose, they don't override — so to drop
 * the sidebar entirely on /dashboard we move it out of (app) into its
 * own route group with a fresh layout. URL stays /dashboard either way.
 */
export default async function InsightsLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user) redirect('/login')

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

  // Page-level palette — same tokens as the dashboard page itself, kept
  // in JS here so background + frame stay consistent if the dashboard
  // tokens shift later.
  const pageBg = 'linear-gradient(125deg, #B5B8C2 0%, #D4D1BE 32%, #EDDB8B 100%)'

  return (
    <PostHogProvider userId={user.id} email={user.email ?? ''}>
      <div className="min-h-screen" style={{ background: pageBg }}>
        <InsightsTopNav
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspace.id}
          userEmail={user.email ?? ''}
        />
        <main id="main-content" className="px-4 pb-8 sm:px-8">
          {children}
        </main>
      </div>
    </PostHogProvider>
  )
}
