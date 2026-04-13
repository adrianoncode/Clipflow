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
    <div className="relative flex min-h-screen flex-col bg-[#f8f6ff]">
      {/* Header */}
      <header className="relative flex items-center justify-center px-6 py-8">
        <span className="text-lg font-extrabold tracking-tight text-primary">
          Clipflow
        </span>
      </header>

      {/* Content */}
      <main className="relative flex flex-1 items-start justify-center px-6 pb-16">
        <div className="w-full max-w-lg">{children}</div>
      </main>

      <footer className="relative py-4 text-center text-xs text-muted-foreground/50">
        Takes less than 2 minutes to set up
      </footer>
    </div>
  )
}
