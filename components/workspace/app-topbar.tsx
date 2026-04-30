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
          onClick={() => setOpen(true)}
          className="grid h-8 w-8 place-items-center rounded-full border md:hidden"
          style={{
            borderColor: 'rgba(15,15,15,0.14)',
            background: 'rgba(255, 253, 248, 0.85)',
          }}
        >
          <Menu className="h-3.5 w-3.5" style={{ color: '#0F0F0F' }} />
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
            <span className="hidden text-[12px] lg:inline" style={{ color: '#7A7468' }}>
              /
            </span>
            <span
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
        <div
          className="hidden h-8 items-center gap-2 rounded-full border px-3 sm:flex"
          style={{
            borderColor: 'rgba(15,15,15,0.14)',
            background: 'rgba(255, 253, 248, 0.85)',
          }}
        >
          <Search className="h-3 w-3" style={{ color: '#7A7468' }} />
          <input
            placeholder="Search anything"
            className="w-[200px] border-0 bg-transparent text-[12px] outline-none"
            style={{ color: '#0F0F0F' }}
          />
          <kbd
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

        <button
          type="button"
          aria-label="Notifications"
          className="grid h-8 w-8 place-items-center rounded-full border transition-colors hover:bg-[rgba(15,15,15,0.04)]"
          style={{ borderColor: 'rgba(15,15,15,0.14)' }}
        >
          <Bell className="h-3.5 w-3.5" style={{ color: '#0F0F0F' }} />
        </button>

        <Link
          href="/settings/profile"
          aria-label="Account"
          className="grid h-8 w-8 place-items-center rounded-full text-[11px] font-bold transition-transform hover:scale-105"
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
