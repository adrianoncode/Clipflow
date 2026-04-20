import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getUser } from '@/lib/auth/get-user'

// Mirrors the auth shell so signup → onboarding feels like a single flow.
// Remapping shadcn tokens lets nested Card/Input/Button components inherit
// the paper palette without touching each step page.
const ONBOARD_STYLES = `
.lv2-onboard {
  --lv2o-bg: #FAF7F2; --lv2o-fg: #181511; --lv2o-fg-soft: #3a342c;
  --lv2o-muted: #7c7468; --lv2o-border: #E5DDCE; --lv2o-card: #FFFDF8;
  --lv2o-primary: #2A1A3D; --lv2o-primary-ink: #120920;
  --lv2o-accent: #D6FF3E; --lv2o-accent-ink: #1a2000;

  --background: 42 38% 96%; --foreground: 35 14% 9%;
  --card: 42 60% 99%; --card-foreground: 35 14% 9%;
  --popover: 42 60% 99%; --popover-foreground: 35 14% 9%;
  --primary: 273 40% 17%; --primary-foreground: 73 100% 62%;
  --muted: 42 24% 90%; --muted-foreground: 34 7% 45%;
  --accent: 73 100% 62%; --accent-foreground: 72 100% 6%;
  --border: 37 27% 85%; --input: 37 27% 85%; --ring: 273 40% 17%;

  background-color: var(--lv2o-bg);
  background-image: radial-gradient(circle at 2px 2px, rgba(120,90,40,.05) 1px, transparent 0);
  background-size: 24px 24px;
  color: var(--lv2o-fg); font-family: var(--font-inter), system-ui, sans-serif;
}
.lv2-onboard .lv2o-display { font-family: var(--font-instrument-serif), serif; letter-spacing: -.015em; font-weight: 400; }
.lv2-onboard .lv2o-mono { font-family: var(--font-jetbrains-mono), monospace; }
.lv2-onboard input, .lv2-onboard textarea {
  background: var(--lv2o-card) !important;
  border: 1px solid var(--lv2o-border) !important;
  border-radius: 10px !important; color: var(--lv2o-fg) !important;
  transition: border-color .15s, box-shadow .15s;
}
.lv2-onboard input:focus, .lv2-onboard textarea:focus {
  outline: none !important;
  border-color: var(--lv2o-primary) !important;
  box-shadow: 0 0 0 3px rgba(42,26,61,.12) !important;
}
.lv2-onboard button[type="submit"] {
  background: var(--lv2o-primary) !important;
  color: var(--lv2o-accent) !important;
  border-radius: 10px !important; font-weight: 700 !important;
  box-shadow: inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(42,26,61,.35) !important;
}
`

export default async function OnboardingGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ONBOARD_STYLES }} />
      <div className="lv2-onboard relative flex min-h-screen flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: -140, right: -100, width: 420, height: 420,
            background: 'var(--lv2o-accent)', borderRadius: '50%',
            filter: 'blur(60px)', opacity: 0.5, mixBlendMode: 'multiply',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: 200, left: -80, width: 320, height: 320,
            background: '#EFE9F5', borderRadius: '50%',
            filter: 'blur(70px)', opacity: 0.7,
          }}
        />

        <header className="relative flex items-center justify-between px-6 py-5 sm:px-10">
          <Link
            href="/"
            className="lv2o-display flex items-center gap-1.5 text-[22px] tracking-tight"
            style={{ color: 'var(--lv2o-primary)' }}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-md"
              style={{ background: 'var(--lv2o-primary)' }}
            >
              <span
                className="block h-2 w-2 rounded-sm"
                style={{ background: 'var(--lv2o-accent)' }}
              />
            </span>
            Clipflow
          </Link>
          <span
            className="lv2o-mono text-[10px] uppercase tracking-[0.2em]"
            style={{ color: 'var(--lv2o-muted)' }}
          >
            Setup · 2 minutes
          </span>
        </header>

        <main className="relative flex flex-1 items-start justify-center px-6 pb-20 pt-4 sm:pt-8">
          <div className="w-full max-w-lg">{children}</div>
        </main>
      </div>
    </>
  )
}
