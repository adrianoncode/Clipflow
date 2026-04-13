import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'

export default async function OnboardingGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="relative flex min-h-screen flex-col" style={{ background: '#050506' }}>
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: 600,
          height: 400,
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <header className="relative flex items-center justify-center px-6 py-8">
        <span
          className="text-lg font-bold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Clipflow
        </span>
      </header>

      {/* Content */}
      <main className="relative flex flex-1 items-start justify-center px-6 pb-16">
        <div className="w-full max-w-lg">{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative py-6 text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Takes less than 2 minutes to set up
      </footer>
    </div>
  )
}
