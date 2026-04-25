import Link from 'next/link'

import { SmoothScroll } from '@/components/landing/smooth-scroll'
import { PlaybookSearch } from './playbook-search'
import { PlaybookPathSidebar } from './playbook-path-sidebar'
import { PlaybookProgressBar } from './playbook-progress-bar'
import {
  GUIDES,
  GUIDE_CATEGORIES,
  PATHS,
  PATH_ORDER,
} from '@/lib/landing/playbook'

/**
 * Editorial shell for the entire /playbook surface.
 *
 * Layout (desktop ≥ lg):
 *   ┌────────── slim top bar ──────────┐
 *   │ Logo · spacer · Search ⌘K · CTA  │
 *   ├──────────────────────────────────┤
 *   │ ░░ reading-progress strip (only on guides) ░░
 *   ├──────────────────────────────────┤
 *   │ Path sidebar │ Content │ TOC rail │
 *   └──────────────────────────────────┘
 *
 * Mobile collapses sidebar + TOC; everything else stays.
 */

interface PlaybookShellProps {
  children: React.ReactNode
  /** Right rail node (the per-page TOC). */
  right?: React.ReactNode
  /** Active path id, if the page is rendered in a path context. */
  activePathId?: string | null
  /** Slug of the currently-open guide, for the sidebar marker. */
  currentSlug?: string
  /** When set, mounts the reading-progress strip + marks-on-scroll. */
  guideId?: string
}

export function PlaybookShell({
  children,
  right,
  activePathId = null,
  currentSlug,
  guideId,
}: PlaybookShellProps) {
  const categories = Object.values(GUIDE_CATEGORIES)
  const paths = PATH_ORDER.map((id) => PATHS[id])
  const guidesById = Object.fromEntries(GUIDES.map((g) => [g.id, g]))

  return (
    <>
      <SmoothScroll />
      <InlineVars />

      {guideId ? <PlaybookProgressBar guideId={guideId} /> : null}

      <div
        className="lv2-root"
        style={{
          background: 'var(--lv2-bg, #FAF7F2)',
          color: 'var(--lv2-fg, #181511)',
          minHeight: '100vh',
        }}
      >
        {/* Slim top bar */}
        <header
          className="sticky top-0 z-40"
          style={{
            background: 'rgba(250,247,242,0.9)',
            backdropFilter: 'saturate(180%) blur(12px)',
            WebkitBackdropFilter: 'saturate(180%) blur(12px)',
            borderBottom: '1px solid var(--lv2-border)',
          }}
        >
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="group flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform group-hover:-rotate-[8deg]"
                  style={{ background: 'var(--lv2-primary)' }}
                >
                  <span
                    className="block h-3 w-3 rounded-[3px]"
                    style={{ background: 'var(--lv2-accent)' }}
                  />
                </span>
                <span
                  className="lv2-display text-[22px] leading-none"
                  style={{ color: 'var(--lv2-primary)' }}
                >
                  Clipflow
                </span>
              </Link>
              <span
                aria-hidden
                className="hidden h-4 w-px sm:block"
                style={{ background: 'var(--lv2-border)' }}
              />
              <Link
                href="/playbook"
                className="lv2-mono hidden text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:text-[var(--lv2-fg)] sm:inline"
                style={{ color: 'var(--lv2-muted)' }}
              >
                Playbook
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <PlaybookSearch
                guides={GUIDES}
                categories={categories}
                paths={paths}
              />
              <Link
                href="/signup"
                className="hidden rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all hover:-translate-y-px sm:inline-block"
                style={{
                  background: 'var(--lv2-primary)',
                  color: 'var(--lv2-accent)',
                }}
              >
                Start free
              </Link>
            </div>
          </div>
        </header>

        {/* Body grid — sidebars only on desktop, content owns small screens */}
        <div
          className="mx-auto grid max-w-[1400px] gap-8 px-6 py-10 lg:grid-cols-[260px_minmax(0,1fr)_220px]"
        >
          <div className="hidden lg:block">
            <PlaybookPathSidebar
              paths={paths}
              guidesById={guidesById}
              activePathId={activePathId}
              currentSlug={currentSlug}
            />
          </div>
          <main className="min-w-0">{children}</main>
          <div className="hidden lg:block">{right ?? null}</div>
        </div>
      </div>
    </>
  )
}

function InlineVars() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      .lv2-root {
        --lv2-bg: #FAF7F2; --lv2-bg-2: #F3EDE3;
        --lv2-fg: #181511; --lv2-fg-soft: #2c2620;
        --lv2-muted: #5f5850; --lv2-muted-2: #ECE5D8;
        --lv2-border: #E5DDCE; --lv2-card: #FFFDF8;
        --lv2-primary: #2A1A3D; --lv2-primary-soft: #EDE6F5;
        --lv2-accent: #D6FF3E; --lv2-accent-ink: #1a2000;
        --lv2-tip-bg: #F0F8E8; --lv2-tip-border: #BFD98F;
        --lv2-warn-bg: #FFF5E6; --lv2-warn-border: #F2C374;
        --lv2-pro-bg: #EDE6F5;  --lv2-pro-border: #B19FD6;
        font-family: var(--font-inter), system-ui, sans-serif;
      }
      .lv2-root .lv2-display { font-family: var(--font-instrument-serif), 'Times New Roman', serif; letter-spacing: -.015em; }
      .lv2-root .lv2-sans-d { font-family: var(--font-inter-tight), var(--font-inter), system-ui, sans-serif; letter-spacing: -.015em; }
      .lv2-root .lv2-mono { font-family: var(--font-jetbrains-mono), monospace; }
      .lv2-root .lv2-mono-label {
        font-family: var(--font-jetbrains-mono), monospace;
        font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
        color: var(--lv2-muted); font-weight: 600; display: inline-block;
      }
    `,
      }}
    />
  )
}
