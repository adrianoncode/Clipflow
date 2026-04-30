'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Settings as SettingsIcon } from 'lucide-react'

import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'
import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'

/**
 * Crextio-style horizontal pill nav for the Insights surface.
 *
 * Logo (left, pill-bordered) · centered pill group · right actions
 * (Setting + Bell + Avatar). Active item is a solid charcoal pill with
 * white text. Inactive items are transparent with dark text + soft
 * hover bg.
 *
 * Not the (app) sidebar — this only renders inside (insights)/layout.
 */

const NAV_ITEMS: Array<{ label: string; href: (workspaceId: string) => string }> = [
  { label: 'Dashboard', href: () => '/dashboard' },
  { label: 'Workflow', href: (id) => `/workspace/${id}` },
  { label: 'Templates', href: () => '/settings/templates' },
  { label: 'Creators', href: (id) => `/workspace/${id}/research` },
  { label: 'Channels', href: () => '/settings/channels' },
  { label: 'AI keys', href: () => '/settings/ai-keys' },
]

export function InsightsTopNav({
  workspaces,
  currentWorkspaceId,
  userEmail,
}: {
  workspaces: WorkspaceSummary[]
  currentWorkspaceId: string
  userEmail: string
}) {
  const pathname = usePathname()
  const initial = (userEmail.trim().charAt(0) || 'C').toUpperCase()

  return (
    <header className="px-4 pt-4 sm:px-8 sm:pt-6">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3">
        {/* ── Left: Logo (pill) + workspace switcher ─────────────────── */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Clipflow"
            className="flex h-9 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors hover:bg-[rgba(15,15,15,0.04)]"
            style={{
              border: '1px solid rgba(15,15,15,0.14)',
              color: '#0F0F0F',
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontWeight: 400,
              letterSpacing: '-0.015em',
            }}
          >
            <span
              aria-hidden
              className="block h-2 w-2 rounded-full"
              style={{ background: '#0F0F0F' }}
            />
            <span className="text-[15px]">Clipflow</span>
          </Link>
          <div className="hidden lg:block">
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentWorkspaceId={currentWorkspaceId}
            />
          </div>
        </div>

        {/* ── Center: pill nav group ─────────────────────────────────── */}
        <nav
          aria-label="Primary"
          className="hidden flex-1 justify-center md:flex"
        >
          <ul className="flex items-center gap-0">
            {NAV_ITEMS.map((item) => {
              const href = item.href(currentWorkspaceId)
              const isActive = isItemActive(pathname, href)
              return (
                <li key={item.label}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium transition-all duration-150"
                    style={{
                      background: isActive ? '#0F0F0F' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#0F0F0F',
                      fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* ── Right: Setting + Bell + Avatar ─────────────────────────── */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/settings"
            aria-label="Settings"
            className="hidden h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors hover:bg-[rgba(15,15,15,0.04)] sm:inline-flex"
            style={{
              border: '1px solid rgba(15,15,15,0.14)',
              color: '#0F0F0F',
              fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            <SettingsIcon className="h-3.5 w-3.5" />
            <span>Setting</span>
          </Link>
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgba(15,15,15,0.04)]"
            style={{ border: '1px solid rgba(15,15,15,0.14)' }}
          >
            <Bell className="h-3.5 w-3.5" style={{ color: '#0F0F0F' }} />
          </button>
          <Link
            href="/settings/profile"
            aria-label="Account"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold transition-transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #F5C75E, #E8756B)',
              boxShadow: '0 0 0 1.5px rgba(15,15,15,0.06)',
              color: '#0F0F0F',
              fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            {initial}
          </Link>
        </div>
      </div>
    </header>
  )
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  if (href.startsWith('/workspace/')) {
    // The Workflow entry should match the workspace home AND every step.
    if (href.endsWith('/research')) {
      return pathname.endsWith('/research')
    }
    if (pathname.endsWith('/research')) return false
    return (
      pathname === href ||
      pathname.startsWith(`${href}/content`) ||
      pathname.startsWith(`${href}/pipeline`) ||
      pathname.startsWith(`${href}/schedule`)
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
