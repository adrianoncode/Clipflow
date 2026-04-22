import Link from 'next/link'

import { SmoothScroll } from '@/components/landing/smooth-scroll'
import { PlaybookSidebar } from '@/components/playbook/playbook-sidebar'
import { GUIDES, GUIDE_CATEGORIES } from '@/lib/landing/playbook'

/**
 * Shared chrome for every /playbook/* route. Three-column layout on
 * wide screens: left sidebar (grouped guide nav), center content,
 * right-rail TOC (mounted per-page). Mobile collapses the sidebar
 * into a <details> drawer at the top.
 *
 * Matches the ExploreLayout visual language but a separate surface
 * on purpose — Playbook content is operational ("how to use this"),
 * Explore content is marketing ("what does this do"). Keeping them
 * separate lets us evolve each independently.
 */
export function PlaybookLayout({
  children,
  right,
}: {
  children: React.ReactNode
  /** Optional right rail — the detail page slots its TOC here. */
  right?: React.ReactNode
}) {
  const categories = Object.values(GUIDE_CATEGORIES)

  return (
    <>
      <SmoothScroll />
      <InlineVars />

      <div
        className="lv2-root"
        style={{
          background: 'var(--lv2-bg, #FAF7F2)',
          color: 'var(--lv2-fg, #181511)',
          minHeight: '100vh',
        }}
      >
        {/* Header */}
        <header
          className="sticky top-0 z-40"
          style={{
            background: 'rgba(250,247,242,0.9)',
            backdropFilter: 'saturate(180%) blur(10px)',
            borderBottom: '1px solid var(--lv2-border)',
          }}
        >
          <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
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
                className="lv2-display text-[24px] leading-none"
                style={{ color: 'var(--lv2-primary)' }}
              >
                Clipflow
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-[13px] font-semibold">
              <Link
                href="/features"
                className="rounded-lg px-3 py-1.5 hover:bg-black/[.04]"
                style={{ color: 'var(--lv2-fg-soft)' }}
              >
                Features
              </Link>
              <Link
                href="/playbook"
                className="rounded-lg px-3 py-1.5 hover:bg-black/[.04]"
                style={{ color: 'var(--lv2-fg-soft)' }}
              >
                Playbook
              </Link>
              <Link
                href="/#pricing"
                className="rounded-lg px-3 py-1.5 hover:bg-black/[.04]"
                style={{ color: 'var(--lv2-fg-soft)' }}
              >
                Pricing
              </Link>
              <Link
                href="/signup"
                className="ml-2 rounded-xl px-4 py-2 text-[13px] font-bold"
                style={{
                  background: 'var(--lv2-primary)',
                  color: 'var(--lv2-accent)',
                }}
              >
                Start free
              </Link>
            </nav>
          </div>
        </header>

        {/* Body: sidebar + content + optional right rail */}
        <div
          className="mx-auto grid max-w-[1400px] gap-8 px-6 py-10 lg:grid-cols-[260px_minmax(0,1fr)_220px]"
        >
          <PlaybookSidebar categories={categories} guides={GUIDES} />
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
        --lv2-fg: #181511; --lv2-fg-soft: #3a342c;
        --lv2-muted: #7c7468; --lv2-muted-2: #ECE5D8;
        --lv2-border: #E5DDCE; --lv2-card: #FFFDF8;
        --lv2-primary: #2A1A3D; --lv2-primary-soft: #EDE6F5;
        --lv2-accent: #D6FF3E; --lv2-accent-ink: #1a2000;
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
