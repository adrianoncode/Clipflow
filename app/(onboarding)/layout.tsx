import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getUser } from '@/lib/auth/get-user'

export default async function OnboardingGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      {/* Ambient violet wash + dot-grid — same texture as landing hero
          so the onboarding feels rooted in the brand from step one. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-dots-subtle opacity-60"
        style={{
          maskImage:
            'radial-gradient(ellipse 100% 70% at 50% 0%, #000 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 100% 70% at 50% 0%, #000 30%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(50% 40% at 50% 0%, rgba(124, 58, 237, 0.08), transparent 70%),
            radial-gradient(30% 30% at 85% 20%, rgba(124, 58, 237, 0.05), transparent 70%)
          `,
        }}
      />

      {/* Header — minimal, matches auth */}
      <header className="relative flex items-center justify-between px-6 py-5 sm:px-10">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight text-primary"
        >
          Clipflow
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Setup · 2 minutes
        </span>
      </header>

      {/* Content — centered, generous vertical breathing room */}
      <main className="relative flex flex-1 items-start justify-center px-6 pb-20 pt-4 sm:pt-8">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  )
}
