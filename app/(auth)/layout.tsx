import type { Metadata } from 'next'
import Link from 'next/link'

// Every page in the auth segment (login, signup, magic-link, mfa) is a
// session wall — no SEO value, and indexing them risks a "Sign in" page
// outranking the marketing landing for brand searches. Setting
// `robots.index=false` here cascades to all child routes and is the
// authoritative signal Google honours (robots.txt is just a crawl hint).
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true, noimageindex: true },
  },
}

// Matches the Clipflow landing palette (paper / plum / lime) so signup →
// landing ↔ signup feels like the same product. The `.lv2-auth` scope
// overrides the app-wide shadcn tokens used by nested form primitives.
const AUTH_STYLES = `
.lv2-auth {
  --lv2a-bg: #FAF7F2; --lv2a-bg-2: #F3EDE3; --lv2a-fg: #181511;
  --lv2a-fg-soft: #3a342c; --lv2a-muted: #7c7468;
  --lv2a-border: #E5DDCE; --lv2a-border-strong: #CFC4AF; --lv2a-card: #FFFDF8;
  --lv2a-primary: #0F0F0F; --lv2a-primary-ink: #1A1A1A;
  --lv2a-accent: #F4D93D; --lv2a-accent-ink: #1a2000;

  /* Remap the shadcn theme tokens for descendants so Card/Button/etc use
     our paper palette inside the auth shell. */
  --background: 42 38% 96%;
  --foreground: 35 14% 9%;
  --card: 42 60% 99%;
  --card-foreground: 35 14% 9%;
  --popover: 42 60% 99%;
  --popover-foreground: 35 14% 9%;
  --primary: 273 40% 17%;
  --primary-foreground: 73 100% 62%;
  --muted: 42 24% 90%;
  --muted-foreground: 34 7% 45%;
  --accent: 73 100% 62%;
  --accent-foreground: 72 100% 6%;
  --border: 37 27% 85%;
  --input: 37 27% 85%;
  --ring: 273 40% 17%;

  background-color: var(--lv2a-bg);
  background-image: radial-gradient(circle at 2px 2px, rgba(120,90,40,.05) 1px, transparent 0);
  background-size: 24px 24px;
  color: var(--lv2a-fg);
  font-family: var(--font-inter), system-ui, sans-serif;
}
.lv2-auth .lv2a-display { font-family: var(--font-instrument-serif), serif; letter-spacing: -.015em; font-weight: 400; }
.lv2-auth .lv2a-mono { font-family: var(--font-jetbrains-mono), monospace; }

/* Re-skin shadcn inputs/buttons inside the form shell */
.lv2-auth input[type="email"],
.lv2-auth input[type="text"],
.lv2-auth input[type="password"],
.lv2-auth input:not([type]) {
  background: var(--lv2a-card) !important;
  border: 1px solid var(--lv2a-border) !important;
  border-radius: 10px !important;
  color: var(--lv2a-fg) !important;
  font-size: 14px !important;
  transition: border-color .15s, box-shadow .15s;
}
.lv2-auth input:focus {
  outline: none !important;
  border-color: var(--lv2a-primary) !important;
  box-shadow: 0 0 0 3px rgba(15,15,15,.12) !important;
}
.lv2-auth label { color: var(--lv2a-fg) !important; font-weight: 600 !important; }
.lv2-auth button[type="submit"],
.lv2-auth .lv2a-btn-primary {
  background: var(--lv2a-primary) !important;
  color: var(--lv2a-accent) !important;
  border-radius: 10px !important;
  font-weight: 700 !important;
  box-shadow: inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(15,15,15,.35) !important;
  transition: transform .15s, background .15s !important;
}
.lv2-auth button[type="submit"]:hover,
.lv2-auth .lv2a-btn-primary:hover {
  transform: translateY(-1px);
  background: var(--lv2a-primary-ink) !important;
}
.lv2-auth a { transition: color .15s; }
.lv2-auth a:hover { color: var(--lv2a-primary-ink) !important; }
`

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: AUTH_STYLES }} />
      <a
        href="#auth-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#0F0F0F] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#F4D93D] focus:shadow-lg"
      >
        Skip to main content
      </a>
      <div className="lv2-auth relative flex min-h-screen flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: -160,
            right: -120,
            width: 460,
            height: 460,
            background: 'var(--lv2a-accent)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            opacity: 0.55,
            mixBlendMode: 'multiply',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            bottom: -200,
            left: -120,
            width: 360,
            height: 360,
            background: '#EFE9F5',
            borderRadius: '50%',
            filter: 'blur(70px)',
            opacity: 0.8,
          }}
        />

        <header className="relative flex items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="lv2a-display flex items-center gap-1.5 text-[22px] tracking-tight"
            style={{ color: 'var(--lv2a-primary)' }}
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-md"
              style={{ background: 'var(--lv2a-primary)' }}
            >
              <span
                className="block h-2 w-2 rounded-sm"
                style={{ background: 'var(--lv2a-accent)' }}
              />
            </span>
            Clipflow
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold transition-colors"
            style={{ color: 'var(--lv2a-muted)' }}
          >
            ← Back to home
          </Link>
        </header>

        <main
          id="auth-main"
          className="relative flex flex-1 items-center justify-center px-6 pb-16"
        >
          <div className="w-full max-w-md">{children}</div>
        </main>

        <footer
          className="lv2a-mono relative flex items-center justify-center gap-2 py-5 text-[10px] uppercase tracking-[0.15em]"
          style={{ color: 'var(--lv2a-muted)' }}
        >
          <span className="h-1 w-1 rounded-full" style={{ background: '#0F6B4D' }} />
          secure · aes-256 encrypted
        </footer>
      </div>
    </>
  )
}
