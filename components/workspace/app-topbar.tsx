'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Menu, Search } from 'lucide-react'
import { useMemo } from 'react'

import { useMobileNav } from '@/components/workspace/mobile-nav-context'
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'
import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'

/**
 * Editorial topbar — sits inside the main column, above page content.
 *
 * Sticky + blurred so it floats over scrolled content. Hosts the
 * workspace switcher, breadcrumb (workspace · current-page), search,
 * notifications, and avatar. Works alongside `AppSidebar` — the
 * sidebar owns nav, the topbar owns workspace context + global
 * actions.
 */

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/library': 'Library',
  '/billing': 'Billing',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
  '/settings/ai-keys': 'AI Keys',
  '/settings/channels': 'Channels',
  '/settings/brand-kit': 'Brand Kit',
  '/settings/brand-voice': 'Brand Voice',
  '/settings/templates': 'Templates',
  '/settings/workspace': 'Workspace',
  '/settings/security': 'Security',
  '/settings/audit-log': 'Audit Log',
  '/settings/referrals': 'Referrals',
  '/settings/extension': 'Extension',
}

export function AppTopbar({
  workspaces,
  currentWorkspaceId,
  workspaceName,
  userEmail,
}: {
  workspaces: WorkspaceSummary[]
  currentWorkspaceId: string
  workspaceName: string
  userEmail: string
}) {
  const pathname = usePathname()
  const { setOpen } = useMobileNav()
  const initial = (userEmail.trim().charAt(0) || 'C').toUpperCase()

  const pageTitle = useMemo(() => {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]!
    if (pathname.startsWith('/workspace/')) {
      const rest = pathname.split('/').slice(3).join('/')
      if (!rest) return 'Workflow'
      if (rest.startsWith('content')) return 'Workflow · Content'
      if (rest.startsWith('pipeline')) return 'Library'
      if (rest.startsWith('schedule') || rest.startsWith('calendar')) return 'Schedule'
      if (rest.startsWith('research')) return 'Creators'
      if (rest.startsWith('members')) return 'Members'
      return 'Workflow'
    }
    return ''
  }, [pathname])

  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between gap-3.5 border-b px-6 py-3.5"
      style={{
        background: 'rgba(255, 253, 248, 0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderColor: 'rgba(15,15,15,0.06)',
      }}
    >
      {/* ── Left: workspace · page-title breadcrumb ─────────────────── */}
      <div className="flex min-w-0 items-center gap-2.5">
        {/* Hamburger — opens the sidebar drawer on mobile */}
        <button
          type="button"
          aria-label="Open navigation"
          aria-controls="primary-navigation"
          onClick={() => setOpen(true)}
          className="grid h-8 w-8 place-items-center rounded-full border transition-colors hover:bg-[rgba(15,15,15,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 md:hidden"
          style={{
            borderColor: 'rgba(15,15,15,0.14)',
            background: 'rgba(255, 253, 248, 0.85)',
          }}
        >
          <Menu className="h-3.5 w-3.5" aria-hidden style={{ color: '#0F0F0F' }} />
        </button>

        <div className="hidden lg:block">
          <WorkspaceSwitcher
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspaceId}
          />
        </div>
        <span
          className="hidden text-[10px] font-semibold uppercase lg:inline"
          style={{
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            letterSpacing: '0.22em',
            color: '#7A7468',
          }}
        >
          {workspaceName}
        </span>
        {pageTitle && (
          <>
            {/* Belt-and-braces page heading for screen readers. Many
                authenticated routes (Schedule, Pipeline, Research, etc.)
                don't render a visible <h1> in their body — promoting
                the breadcrumb to a real heading guarantees AT users
                land on a labelled page on every navigation. Pages with
                their own visible h1 (Dashboard Hero, Library Hero,
                workspace home) end up with two h1s — valid in HTML5
                and a fair tradeoff for the routes that need it. */}
            <h1 className="sr-only">{pageTitle}</h1>
            <span
              aria-hidden="true"
              className="hidden text-[12px] lg:inline"
              style={{ color: '#7A7468' }}
            >
              /
            </span>
            <span
              aria-hidden="true"
              className="truncate text-[13px] font-semibold"
              style={{ color: '#0F0F0F' }}
            >
              {pageTitle}
            </span>
          </>
        )}
      </div>

      {/* ── Right: search + bell + avatar ───────────────────────────── */}
      <div className="flex items-center gap-2.5">
        {/*
          Search shell: focus-within mirrors the input focus to the
          parent so the whole pill picks up the focus ring instead of
          a thin keyboard ring on the bare input. The trigger (⌘K)
          isn't wired yet — we keep it visible as an affordance hint
          but mark the input as a no-op `type=search` form-less field
          until the global palette ships. Until then it's purely a
          placeholder, hence aria-disabled to tell AT it does nothing.
        */}
        <div
          className="hidden h-8 items-center gap-2 rounded-full border px-3 transition-shadow focus-within:ring-2 focus-within:ring-[#0F0F0F] focus-within:ring-offset-2 sm:flex"
          style={{
            borderColor: 'rgba(15,15,15,0.14)',
            background: 'rgba(255, 253, 248, 0.85)',
          }}
        >
          <Search className="h-3 w-3" aria-hidden style={{ color: '#7A7468' }} />
          <label htmlFor="topbar-search" className="sr-only">
            Search
          </label>
          <input
            id="topbar-search"
            type="search"
            name="q"
            placeholder="Search anything"
            aria-disabled="true"
            disabled
            className="w-[200px] border-0 bg-transparent text-[12px] outline-none placeholder:text-[#7A7468] disabled:cursor-not-allowed"
            style={{ color: '#0F0F0F' }}
          />
          <kbd
            aria-hidden="true"
            className="rounded border px-1.5 py-px text-[10px]"
            style={{
              borderColor: 'rgba(15,15,15,0.14)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              color: '#7A7468',
              background: '#FAF7F2',
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/*
          Notifications surface isn't wired yet — disable the trigger
          rather than render a fake button. Visual treatment matches
          the active state with a muted alpha so the chrome still
          reads as "this lives here, just not yet."
        */}
        <button
          type="button"
          aria-label="Notifications (coming soon)"
          aria-disabled="true"
          disabled
          className="grid h-8 w-8 place-items-center rounded-full border transition-colors hover:bg-[rgba(15,15,15,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderColor: 'rgba(15,15,15,0.14)' }}
        >
          <Bell className="h-3.5 w-3.5" aria-hidden style={{ color: '#0F0F0F' }} />
        </button>

        <Link
          href="/settings/profile"
          aria-label="Account settings"
          className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4D93D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF8] motion-reduce:transition-none motion-reduce:hover:scale-100"
          style={{
            background: '#0F0F0F',
            color: '#F4D93D',
          }}
        >
          {initial}
        </Link>
      </div>
    </div>
  )
}
