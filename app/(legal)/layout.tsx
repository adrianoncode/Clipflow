import Link from 'next/link'

// Shared shell for every /terms /privacy /cookies /dmca /imprint /help /changelog
// page. Gives the docs the same paper / plum / lime treatment as landing
// (instead of the violet shadcn defaults + prose-invert they had before).
//
// The style block also restyles the `prose` plugin's typography under
// .lv2-legal so every H2/p/ul/a the articles render inherits the Clipflow
// palette without needing per-page className surgery.
const LEGAL_STYLES = `
.lv2-legal {
  --lv2L-bg: #FAF7F2; --lv2L-fg: #181511; --lv2L-fg-soft: #3a342c;
  --lv2L-muted: #7c7468; --lv2L-border: #E5DDCE; --lv2L-card: #FFFDF8;
  --lv2L-primary: #2A1A3D; --lv2L-primary-ink: #120920;
  --lv2L-accent: #D6FF3E; --lv2L-accent-ink: #1a2000;
  background-color: var(--lv2L-bg);
  background-image: radial-gradient(circle at 2px 2px, rgba(120,90,40,.05) 1px, transparent 0);
  background-size: 24px 24px;
  color: var(--lv2L-fg);
  font-family: var(--font-inter), system-ui, sans-serif;
}
.lv2-legal .lv2L-display { font-family: var(--font-instrument-serif), serif; letter-spacing: -.015em; font-weight: 400; }
.lv2-legal .lv2L-mono { font-family: var(--font-jetbrains-mono), monospace; }

/* Typography overrides for every article page. */
.lv2-legal article h1 {
  font-family: var(--font-instrument-serif), serif;
  font-size: 56px; line-height: 1.02; letter-spacing: -.015em;
  color: var(--lv2L-primary); font-weight: 400; margin: 0 0 .6rem;
}
.lv2-legal article h2 {
  font-family: var(--font-instrument-serif), serif;
  font-size: 26px; line-height: 1.1; letter-spacing: -.01em;
  color: var(--lv2L-primary); font-weight: 400;
  margin: 2.25rem 0 .75rem;
  scroll-margin-top: 96px;
}
.lv2-legal article h3 {
  font-size: 16px; font-weight: 700;
  color: var(--lv2L-fg); margin: 1.5rem 0 .5rem;
  letter-spacing: -.005em;
}
.lv2-legal article p,
.lv2-legal article li {
  color: var(--lv2L-fg-soft);
  font-size: 15px; line-height: 1.65;
}
.lv2-legal article ul { padding-left: 1.2rem; margin: .5rem 0 1rem; }
.lv2-legal article li { margin: .25rem 0; }
.lv2-legal article strong { color: var(--lv2L-fg); font-weight: 600; }
.lv2-legal article a {
  color: var(--lv2L-primary); font-weight: 500;
  text-decoration: underline; text-underline-offset: 3px;
  text-decoration-color: rgba(42,26,61,.25);
  transition: text-decoration-color .15s, color .15s;
}
.lv2-legal article a:hover {
  color: var(--lv2L-primary-ink);
  text-decoration-color: var(--lv2L-primary);
}
.lv2-legal article hr {
  border: none; border-top: 1px solid var(--lv2L-border); margin: 2.5rem 0;
}
.lv2-legal article code {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 13px; padding: 2px 6px;
  background: var(--lv2L-card); border: 1px solid var(--lv2L-border);
  border-radius: 6px; color: var(--lv2L-fg);
}

/* Designer-grade eyebrow — matches the system used across settings,
   library, and creator-research. Hairline lead, Inter-Tight tracking
   wide caps in plum, no more grey-mono boilerplate. */
.lv2-legal .lv2L-eyebrow {
  display: inline-flex; align-items: center; gap: 10px;
  font-family: var(--font-inter-tight), var(--font-inter), system-ui, sans-serif;
  font-size: 10.5px; font-weight: 700;
  letter-spacing: .22em; text-transform: uppercase;
  color: color-mix(in srgb, var(--lv2L-primary) 80%, transparent);
  margin-bottom: 18px;
}
.lv2-legal .lv2L-eyebrow::before {
  content: ''; display: inline-block;
  width: 22px; height: 1px;
  background: color-mix(in srgb, var(--lv2L-primary) 38%, transparent);
}
.lv2-legal .lv2L-card {
  position: relative;
  background: var(--lv2L-card);
  border: 1px solid var(--lv2L-border);
  border-radius: 18px; padding: 18px 20px;
  overflow: hidden;
  box-shadow:
    0 1px 0 rgba(255,255,255,.55) inset,
    0 1px 2px rgba(24,21,17,.04),
    0 14px 32px -22px rgba(42,26,61,.22);
}
.lv2-legal .lv2L-card::after {
  content: ''; position: absolute; left: 1.25rem; right: 1.25rem; top: 0; height: 1px;
  background: linear-gradient(to right,
    transparent,
    color-mix(in srgb, var(--lv2L-primary) 30%, transparent),
    transparent);
  pointer-events: none;
}
`

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LEGAL_STYLES }} />
      <div className="lv2-legal relative flex min-h-screen flex-col overflow-hidden">
        {/* Ambient orbs matching the landing hero so the docs feel rooted
            in the same brand. Subtle — they sit behind the content. */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: -180, right: -120, width: 480, height: 480,
            background: 'var(--lv2L-accent)', borderRadius: '50%',
            filter: 'blur(70px)', opacity: 0.45, mixBlendMode: 'multiply',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            top: 260, left: -140, width: 360, height: 360,
            background: '#EFE9F5', borderRadius: '50%',
            filter: 'blur(80px)', opacity: 0.7,
          }}
        />

        <header className="relative border-b" style={{ borderColor: 'var(--lv2L-border)' }}>
          <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="lv2L-display flex items-center gap-1.5 text-[22px] tracking-tight"
              style={{ color: 'var(--lv2L-primary)' }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md"
                style={{ background: 'var(--lv2L-primary)' }}
              >
                <span
                  className="block h-2 w-2 rounded-sm"
                  style={{ background: 'var(--lv2L-accent)' }}
                />
              </span>
              Clipflow
            </Link>
            <nav
              className="hidden items-center gap-6 text-[13px] font-semibold sm:flex"
              style={{ color: 'var(--lv2L-fg-soft)' }}
            >
              <Link href="/privacy" className="hover:text-[var(--lv2L-primary)]">Privacy</Link>
              <Link href="/terms" className="hover:text-[var(--lv2L-primary)]">Terms</Link>
              <Link href="/cookies" className="hover:text-[var(--lv2L-primary)]">Cookies</Link>
              <Link href="/changelog" className="hover:text-[var(--lv2L-primary)]">Changelog</Link>
            </nav>
            <Link
              href="/"
              className="text-[12px] font-semibold"
              style={{ color: 'var(--lv2L-muted)' }}
            >
              ← Home
            </Link>
          </div>
        </header>

        <main className="relative flex-1">{children}</main>

        <footer
          className="relative border-t"
          style={{ borderColor: 'var(--lv2L-border)' }}
        >
          <div
            className="lv2L-mono mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-6 py-6 text-[11px]"
            style={{ color: 'var(--lv2L-muted)', letterSpacing: '.12em' }}
          >
            <span>© 2026 CLIPFLOW GMBH</span>
            <span className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: '#0F6B4D' }}
              />
              SECURE · AES-256 ENCRYPTED
            </span>
          </div>
        </footer>
      </div>
    </>
  )
}
