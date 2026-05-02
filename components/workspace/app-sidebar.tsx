'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  Compass,
  Folder,
  Globe,
  Home,
  KeyRound,
  Palette,
  Settings as SettingsIcon,
  Workflow as WorkflowIcon,
  X,
} from 'lucide-react'

import { useMobileNav } from '@/components/workspace/mobile-nav-context'

/**
 * Editorial sidebar — Crextio-paper aesthetic.
 *
 * Two sections (Work / Setup), sticky to the viewport, 240px wide on
 * desktop. Active item is a solid charcoal pill with white text and a
 * yellow ordinal index. Section labels are mono caps.
 *
 * Replaces the horizontal pill nav (`AppTopNav`) and matches the
 * `clipflow.html` design handoff. All routes map to existing pages so
 * this is purely a visual + IA refactor — no logic changes.
 */

type NavItem = {
  id: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  href: (workspaceId: string) => string
}

type NavSection = {
  section: 'Work' | 'Setup'
  items: NavItem[]
}

const NAV: NavSection[] = [
  {
    section: 'Work',
    items: [
      { id: 'dashboard', label: 'Dashboard', Icon: Home, href: () => '/dashboard' },
      { id: 'workflow', label: 'Workflow', Icon: WorkflowIcon, href: (id) => `/workspace/${id}` },
      { id: 'library', label: 'Library', Icon: Folder, href: () => '/library' },
      { id: 'creators', label: 'Creators', Icon: Compass, href: (id) => `/workspace/${id}/research` },
    ],
  },
  {
    section: 'Setup',
    items: [
      { id: 'brand', label: 'Brand Kit', Icon: Palette, href: () => '/settings/brand-kit' },
      { id: 'aikeys', label: 'AI Keys', Icon: KeyRound, href: () => '/settings/ai-keys' },
      { id: 'channels', label: 'Channels', Icon: Globe, href: () => '/settings/channels' },
      { id: 'settings', label: 'Settings', Icon: SettingsIcon, href: () => '/settings' },
    ],
  },
]

export function AppSidebar({
  currentWorkspaceId,
  trialDaysLeft,
}: {
  currentWorkspaceId: string
  trialDaysLeft?: number | null
}) {
  const pathname = usePathname()
  const { open, setOpen } = useMobileNav()

  // ESC closes the mobile drawer (standard dialog/menu behaviour). Only
  // bound while the drawer is open so we don't intercept keystrokes
  // anywhere else in the app.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  return (
    <>
      {/* ── Mobile backdrop — fades behind the slide-in drawer ──────── */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-30 transition-opacity duration-200 md:hidden"
        style={{
          background: 'rgba(15,15,15,0.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      <aside
        id="primary-navigation"
        aria-label="Primary navigation"
        className={[
          'fixed left-0 top-0 z-40 flex h-screen shrink-0 flex-col gap-2.5 overflow-hidden border-r px-3.5 py-5',
          'transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          // Desktop: sticky column, always visible. The `!important`
          // override beats the mobile-only `-translate-x-full` so the
          // drawer state can't accidentally hide it.
          'md:sticky md:top-0 md:!translate-x-0',
        ].join(' ')}
        style={{
          width: 240,
          background: 'rgba(255, 253, 248, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderColor: 'rgba(15,15,15,0.14)',
        }}
      >
        {/* ── Mobile close button (visible only on mobile) ────────── */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-[rgba(15,15,15,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 md:hidden"
          style={{
            background: 'rgba(15,15,15,0.06)',
            border: '1px solid rgba(15,15,15,0.14)',
          }}
        >
          <X className="h-3.5 w-3.5" style={{ color: '#0F0F0F' }} />
        </button>

      {/* ── Logo ────────────────────────────────────────────────────── */}
      <Link
        href="/dashboard"
        aria-label="Clipflow — go to dashboard"
        className="flex items-center gap-2 rounded-md px-2 py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2"
      >
        <span
          aria-hidden
          className="grid place-items-center text-[13px] font-extrabold"
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: '#0F0F0F',
            color: '#F4D93D',
          }}
        >
          C
        </span>
        <span
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 22,
            color: '#0F0F0F',
            letterSpacing: '-0.01em',
          }}
        >
          Clipflow
        </span>
      </Link>

      {/* ── Sections ───────────────────────────────────────────────── */}
      {NAV.map((section, sIdx) => {
        const offset = NAV.slice(0, sIdx).reduce((a, b) => a + b.items.length, 0)
        return (
          <div key={section.section} className="flex flex-col gap-0.5">
            <span
              className="px-3 pb-1.5 pt-3.5 text-[9px] font-semibold uppercase"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                letterSpacing: '0.22em',
                color: '#7A7468',
              }}
            >
              {section.section}
            </span>
            {section.items.map((item, i) => {
              const href = item.href(currentWorkspaceId)
              const idx = offset + i + 1
              const active = isItemActive(pathname, item.id, currentWorkspaceId)
              return (
                <Link
                  key={item.id}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'group flex h-9 items-center gap-2.5 rounded-lg border border-transparent px-3 text-[13px]',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2',
                    active
                      ? 'font-semibold text-white'
                      : 'font-medium text-[#2A2A2A] hover:bg-[rgba(15,15,15,0.04)]',
                  ].join(' ')}
                  style={{
                    background: active ? '#0F0F0F' : undefined,
                  }}
                >
                  <item.Icon className="h-[15px] w-[15px] shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                  <span
                    aria-hidden="true"
                    className="ml-auto text-[10px] tabular-nums"
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                      color: active ? '#F4D93D' : '#7A7468',
                    }}
                  >
                    {String(idx).padStart(2, '0')}
                  </span>
                </Link>
              )
            })}
          </div>
        )
      })}

      {/* ── Trial card pinned to bottom ────────────────────────────── */}
      {typeof trialDaysLeft === 'number' && trialDaysLeft > 0 && (
        <div className="mt-auto">
          <div
            className="flex flex-col gap-2.5 p-3.5"
            style={{
              borderRadius: 16,
              background: '#0F0F0F',
              color: '#FFFFFF',
            }}
          >
            <span
              className="text-[10px] font-semibold uppercase"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                letterSpacing: '0.22em',
                color: '#F4D93D',
              }}
            >
              Trial
            </span>
            <span
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontSize: 22,
                lineHeight: 1,
                color: '#FFFFFF',
              }}
            >
              {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
            </span>
            <Link
              href="/billing"
              className="inline-flex h-7 items-center justify-center rounded-full px-3 text-[11px] font-bold transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4D93D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F] motion-reduce:transition-none motion-reduce:hover:scale-100"
              style={{ background: '#F4D93D', color: '#0F0F0F' }}
            >
              Upgrade plan
            </Link>
          </div>
        </div>
      )}
      </aside>
    </>
  )
}

/**
 * Active state matches the *concept* the user is in, not just the URL.
 * Workflow covers every step + pipeline + schedule. Library is the
 * pipeline content list. Creators is research. Settings catches every
 * /settings/* sub-route except the ones promoted to top-level.
 */
function isItemActive(pathname: string, id: string, workspaceId: string): boolean {
  const ws = `/workspace/${workspaceId}`
  switch (id) {
    case 'dashboard':
      return pathname === '/dashboard'
    case 'workflow':
      return (
        pathname === ws ||
        pathname.startsWith(`${ws}/content`) ||
        pathname.startsWith(`${ws}/schedule`) ||
        pathname.startsWith(`${ws}/calendar`)
      )
    case 'library':
      return pathname === '/library' || pathname.startsWith('/library/')
    case 'creators':
      return pathname.startsWith(`${ws}/research`)
    case 'brand':
      return (
        pathname.startsWith('/settings/brand-kit') ||
        pathname.startsWith('/settings/brand-voice') ||
        pathname.startsWith('/settings/templates')
      )
    case 'aikeys':
      return pathname.startsWith('/settings/ai-keys')
    case 'channels':
      return pathname.startsWith('/settings/channels')
    case 'settings':
      return (
        pathname === '/settings' ||
        (pathname.startsWith('/settings/') &&
          !pathname.startsWith('/settings/brand-kit') &&
          !pathname.startsWith('/settings/brand-voice') &&
          !pathname.startsWith('/settings/templates') &&
          !pathname.startsWith('/settings/ai-keys') &&
          !pathname.startsWith('/settings/channels'))
      )
    default:
      return false
  }
}
