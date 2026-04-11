import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'

/**
 * Route-group layout for the onboarding wizard. Deliberately distinct from
 * (app)/layout.tsx: no AppShell, no workspace switcher, no onboarded-at
 * gate. All it does is enforce authentication.
 *
 * Returning users who already completed onboarding can still hit
 * /onboarding/* routes — they just re-run the wizard. The complete step is
 * idempotent.
 */
export default async function OnboardingGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-center px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">Clipflow</span>
      </header>
      <main className="flex flex-1 items-start justify-center px-6 pb-12">
        <div className="w-full max-w-xl">{children}</div>
      </main>
    </div>
  )
}
