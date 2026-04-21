'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import {
  BarChart3,
  CheckSquare,
  FileVideo,
  Home,
  Lock,
  LogOut,
  MoreHorizontal,
  Plug,
  Plus,
  Radio,
  ScrollText,
  Search,
  Send,
  Settings as SettingsIcon,
  Sparkles,
  Users2,
} from 'lucide-react'

import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'
import { GlobalSearch } from '@/components/workspace/global-search'
import { NotificationBell } from '@/components/workspace/notification-bell'
import { ReferralSidebarCard } from '@/components/workspace/referral-sidebar-card'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { FeedbackWidget } from '@/components/feedback-widget'
import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'
import {
  checkPlanAccess,
  FEATURE_MIN_PLAN,
  PLANS,
  type BillingPlan,
} from '@/lib/billing/plans'

interface NavItem {
  href: string
  label: string
  icon: typeof FileVideo
  requires?: keyof typeof FEATURE_MIN_PLAN
}

interface NavGroup {
  label: string
  items: NavItem[]
}

interface AppShellProps {
  user: { id: string; email: string }
  workspaces: WorkspaceSummary[]
  currentWorkspaceId: string
  referralLink: string | null
  referralStats: { pending: number; confirmed: number }
  currentPlan: BillingPlan
  children: React.ReactNode
}

// ── Plum/chartreuse shell styles. Scoped via `.lv2-shell` so individual
// screens inside can still ship their own palette if they want, but the
// chrome always reads as one family.
const SHELL_STYLES = `
.lv2-shell {
  --lv2s-bg: #FAF7F2; --lv2s-bg-2: #F3EDE3; --lv2s-fg: #181511;
  --lv2s-fg-soft: #3a342c; --lv2s-muted: #7c7468; --lv2s-muted-2: #ECE5D8;
  --lv2s-border: #E5DDCE; --lv2s-border-strong: #CFC4AF; --lv2s-card: #FFFDF8;
  --lv2s-sidebar: #F3EDE3;
  --lv2s-primary: #2A1A3D; --lv2s-primary-ink: #120920; --lv2s-primary-soft: #EDE6F5;
  --lv2s-accent: #D6FF3E; --lv2s-accent-ink: #1a2000;
  --lv2s-warn: #A0530B;
  background-color: var(--lv2s-bg);
  background-image: radial-gradient(circle at 2px 2px, rgba(120,90,40,.04) 1px, transparent 0);
  background-size: 24px 24px;
  color: var(--lv2s-fg);
  font-family: var(--font-inter), system-ui, sans-serif;
}
.lv2-shell .lv2s-display { font-family: var(--font-instrument-serif), serif; letter-spacing: -.01em; font-weight: 400; }
.lv2-shell .lv2s-sans-d { font-family: var(--font-inter-tight), sans-serif; letter-spacing: -.02em; }
.lv2-shell .lv2s-mono { font-family: var(--font-jetbrains-mono), monospace; }
.lv2-shell .lv2s-mono-label {
  font-family: var(--font-jetbrains-mono), monospace;
  font-size: 9px; letter-spacing: .18em; text-transform: uppercase;
  color: var(--lv2s-muted); opacity: .6;
}
.lv2-shell .lv2s-chip {
  display: inline-flex; align-items: center; gap: .25rem;
  border-radius: 999px; padding: 1px 7px;
  font-size: 10px; font-weight: 700; letter-spacing: .01em;
}
.lv2-shell .lv2s-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 10px; border-radius: 8px;
  font-size: 13px; color: var(--lv2s-fg-soft);
  transition: background .12s, color .12s;
  position: relative;
}
.lv2-shell .lv2s-nav-item:hover { background: rgba(24,21,17,.04); color: var(--lv2s-fg); }
.lv2-shell .lv2s-nav-item.active {
  color: var(--lv2s-accent); font-weight: 600;
}
.lv2-shell .lv2s-nav-indicator {
  position: absolute; inset: 0; z-index: 0; border-radius: 8px;
  background: var(--lv2s-primary);
  box-shadow: inset 0 0 0 1px rgba(214,255,62,.12), 0 4px 14px -6px rgba(42,26,61,.35);
}
.lv2-shell .lv2s-nav-indicator::before {
  content: ''; position: absolute; left: -10px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 16px; background: var(--lv2s-accent); border-radius: 2px;
}
.lv2-shell .lv2s-nav-item > * { position: relative; z-index: 1; }
.lv2-shell .lv2s-nav-item.locked { color: color-mix(in srgb, var(--lv2s-muted) 65%, transparent); }
.lv2-shell .lv2s-btn-accent {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  background: var(--lv2s-accent); color: var(--lv2s-accent-ink);
  font-weight: 800; font-size: 13px;
  padding: 9px 14px; border-radius: 10px;
  box-shadow: 0 2px 0 rgba(100,125,0,.25), inset 0 0 0 1px rgba(0,0,0,.06);
  transition: transform .15s ease;
}
.lv2-shell .lv2s-btn-accent:hover { transform: translateY(-1px); }
.lv2-shell .lv2s-btn-ghost {
  display: inline-flex; align-items: center; gap: .5rem;
  background: transparent; color: var(--lv2s-fg-soft);
  font-weight: 600; font-size: 12px;
  padding: 6px 10px; border-radius: 8px;
  transition: background .15s, color .15s;
}
.lv2-shell .lv2s-btn-ghost:hover { background: rgba(24,21,17,.04); color: var(--lv2s-fg); }
.lv2-shell .lv2s-kbd {
  font-family: var(--font-jetbrains-mono), monospace; font-size: 10px;
  border: 1px solid var(--lv2s-border); background: var(--lv2s-card);
  padding: 1px 5px; border-radius: 4px; color: var(--lv2s-muted);
}
@keyframes lv2s-pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
.lv2-shell .lv2s-pulse { animation: lv2s-pulse 2.4s ease-in-out infinite; }

/* Reskin embedded workspace-switcher <select> to match the topbar */
.lv2-shell .lv2s-switcher-slot > span,
.lv2-shell .lv2s-switcher-slot select {
  background: transparent !important;
  border: none !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  color: var(--lv2s-fg-soft) !important;
  padding: 4px 8px !important;
  height: auto !important;
  border-radius: 6px !important;
}
.lv2-shell .lv2s-switcher-slot select:hover,
.lv2-shell .lv2s-switcher-slot > span:hover { background: rgba(0,0,0,0.04) !important; }

/* Reskin the GlobalSearch input shell */
.lv2-shell .lv2s-search-slot input[type="text"],
.lv2-shell .lv2s-search-slot input:not([type]) {
  background: var(--lv2s-bg-2) !important;
  border: 1px solid var(--lv2s-border) !important;
  border-radius: 8px !important;
  font-size: 12px !important;
  color: var(--lv2s-fg) !important;
}
`

export function AppShell({
  user: _user,
  workspaces,
  currentWorkspaceId,
  referralLink,
  referralStats,
  currentPlan,
  children,
}: AppShellProps) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === href
    // /settings stays highlighted for every settings sub-route EXCEPT the
    // two that get their own top-level sidebar entries (Channels and
    // Integrations). Otherwise clicking e.g. "Channels" would light both
    // the Channels row AND the Settings row simultaneously.
    if (href === '/settings')
      return (
        pathname.startsWith('/settings') &&
        !pathname.startsWith('/settings/integrations') &&
        !pathname.startsWith('/settings/channels') &&
        !pathname.startsWith('/settings/audit-log')
      )
    if (href === '/settings/integrations') return pathname.startsWith('/settings/integrations')
    if (href === '/settings/channels') return pathname.startsWith('/settings/channels')
    if (href === '/settings/audit-log') return pathname.startsWith('/settings/audit-log')
    if (href === `/workspace/${currentWorkspaceId}`) return pathname === href
    if (href === `/workspace/${currentWorkspaceId}/schedule`) {
      return pathname === href || pathname.startsWith(href + '/')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isAgency =
    checkPlanAccess(currentPlan, 'multiWorkspace') && workspaces.length > 1

  const groups: NavGroup[] = [
    {
      label: 'Workspace',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: `/workspace/${currentWorkspaceId}`, label: 'Content', icon: FileVideo },
        { href: `/workspace/${currentWorkspaceId}/content/new`, label: 'Import', icon: Sparkles },
        { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Drafts', icon: CheckSquare },
        {
          href: `/workspace/${currentWorkspaceId}/schedule`,
          label: 'Schedule',
          icon: Send,
          requires: 'scheduling',
        },
      ],
    },
    {
      label: 'Research',
      items: [
        {
          href: `/workspace/${currentWorkspaceId}/research`,
          label: 'Creators',
          icon: Search,
          requires: 'creatorResearch',
        },
      ],
    },
    ...(isAgency
      ? [
          {
            label: 'Clients',
            items: [
              {
                href: '/clients',
                label: 'All clients',
                icon: FileVideo,
                requires: 'multiWorkspace' as const,
              },
              {
                href: `/workspace/${currentWorkspaceId}/members`,
                label: 'Team',
                icon: Users2,
                requires: 'teamSeats' as const,
              },
              {
                href: '/settings/audit-log',
                label: 'Audit log',
                icon: ScrollText,
                requires: 'auditLog' as const,
              },
            ],
          },
        ]
      : []),
    {
      label: 'Insights',
      items: [
        { href: '/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/settings/channels', label: 'Channels', icon: Radio },
        { href: '/settings/integrations', label: 'Integrations', icon: Plug },
      ],
    },
  ]

  const bottomItems: NavItem[] = [
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  const mobileItems: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: `/workspace/${currentWorkspaceId}`, label: 'Content', icon: FileVideo },
    { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Drafts', icon: CheckSquare },
    {
      href: `/workspace/${currentWorkspaceId}/schedule`,
      label: 'Schedule',
      icon: Send,
      requires: 'scheduling',
    },
  ]

  const mobileMoreItems: NavItem[] = [
    ...groups.flatMap((g) => g.items).filter((i) => !mobileItems.some((m) => m.href === i.href)),
    ...bottomItems,
  ]

  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)

  function renderItem(item: NavItem) {
    const active = isActive(item.href)
    const Icon = item.icon
    const locked = item.requires ? !checkPlanAccess(currentPlan, item.requires) : false
    const href =
      locked && item.requires
        ? `/billing?plan=${FEATURE_MIN_PLAN[item.requires]}&feature=${item.requires}`
        : item.href
    const requiredPlanName = item.requires ? PLANS[FEATURE_MIN_PLAN[item.requires]].name : null
    return (
      <Link
        key={item.href}
        href={href}
        title={locked ? `Unlock ${item.label} with the ${requiredPlanName} plan` : undefined}
        className={`lv2s-nav-item ${active ? 'active' : ''} ${locked ? 'locked' : ''}`}
      >
        {active && (
          <motion.span
            layoutId="lv2s-nav-indicator"
            aria-hidden
            className="lv2s-nav-indicator"
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.6 }}
          />
        )}
        <Icon className="h-[15px] w-[15px] shrink-0" />
        <span className="flex-1 leading-none">{item.label}</span>
        {locked && (
          <Lock
            className="h-3 w-3 shrink-0 opacity-60"
            aria-label={`Requires ${requiredPlanName} plan`}
          />
        )}
      </Link>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHELL_STYLES }} />
      {/* h-screen + overflow-hidden pins the entire shell to exactly one
          viewport. Without this, a tall page (e.g. the Dashboard with
          its Suspense body + stats + pipeline + analytics) grew past
          100vh and the body itself scrolled, dragging the sidebar along
          for the ride. Now the sidebar stays put and only <main> scrolls
          via its own overflow-y-auto. The mobile bottom nav is
          fixed-positioned, so it sits outside this flex context and
          isn't affected. */}
      <div className="lv2-shell flex h-screen flex-col overflow-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
          style={{ background: 'var(--lv2s-primary)', color: 'var(--lv2s-accent)' }}
        >
          Skip to main content
        </a>

        <KeyboardShortcuts workspaceId={currentWorkspaceId} />
        <FeedbackWidget />

        {/* ── Topbar ─────────────────────────────────────────────── */}
        <header
          className="relative z-30 flex h-14 shrink-0 items-center justify-between px-4 sm:px-6"
          style={{
            background: 'var(--lv2s-card)',
            borderBottom: '1px solid var(--lv2s-border)',
          }}
        >
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="lv2s-display flex items-center gap-1.5 text-[22px] tracking-tight"
              style={{ color: 'var(--lv2s-primary)' }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md"
                style={{ background: 'var(--lv2s-primary)' }}
              >
                <span
                  className="block h-2 w-2 rounded-sm"
                  style={{ background: 'var(--lv2s-accent)' }}
                />
              </span>
              Clipflow
            </Link>
            <span
              aria-hidden
              className="hidden h-4 w-px sm:block"
              style={{ background: 'var(--lv2s-border)' }}
            />
            <div className="lv2s-switcher-slot hidden items-center gap-2 sm:flex">
              <span
                aria-hidden
                className="h-5 w-5 rounded-md"
                style={{ background: 'linear-gradient(135deg,#F5C75E,#E8756B)' }}
              />
              <WorkspaceSwitcher
                workspaces={workspaces}
                currentWorkspaceId={currentWorkspaceId}
              />
            </div>
            <div className="lv2s-search-slot ml-2 hidden md:block">
              <GlobalSearch workspaceId={currentWorkspaceId} />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationBell initialCount={0} workspaceId={currentWorkspaceId} />
            <Link
              href="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/[.04] sm:hidden"
              style={{ color: 'var(--lv2s-muted)' }}
              aria-label="Settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </Link>
            <span
              aria-hidden
              className="mx-1 hidden h-4 w-px sm:block"
              style={{ background: 'var(--lv2s-border)' }}
            />
            <form action="/api/auth/signout" method="post" className="hidden sm:block">
              <button
                type="submit"
                className="lv2s-btn-ghost"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
            <Link
              href="/settings/profile"
              aria-label="Account"
              className="h-7 w-7 rounded-full"
              style={{
                background: 'linear-gradient(135deg,#F5C75E,#E8756B)',
                boxShadow: '0 0 0 2px var(--lv2s-card)',
              }}
            />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Sidebar ──────────────────────────────────────────── */}
          <aside
            className="hidden w-52 shrink-0 flex-col overflow-hidden lg:flex"
            style={{
              background: 'var(--lv2s-sidebar)',
              borderRight: '1px solid var(--lv2s-border)',
            }}
          >
            {/* Scrollable only when short viewports force it — nav groups
                can flex-shrink without pushing the referral card + bottom
                items off-screen, so Settings is always reachable. The
                min-h-0 lets the flex child actually shrink instead of
                preferring its intrinsic content height. */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3">
              <NewContentMagnet href={`/workspace/${currentWorkspaceId}/content/new`} />

              <LayoutGroup>
                {groups.map((g, gi) => (
                  <div key={g.label} className={gi > 0 ? 'mt-4' : ''}>
                    <p className="lv2s-mono-label mb-1 px-2">{g.label}</p>
                    <nav className="flex flex-col gap-px">
                      {g.items.map(renderItem)}
                    </nav>
                  </div>
                ))}
              </LayoutGroup>
            </div>

            {referralLink && (
              <div className="shrink-0 m-3">
                <ReferralSidebarCard
                  link={referralLink}
                  pending={referralStats.pending}
                  confirmed={referralStats.confirmed}
                  currentPlan={currentPlan}
                />
              </div>
            )}

            <div
              className="shrink-0 px-3 py-2"
              style={{ borderTop: '1px solid var(--lv2s-border)' }}
            >
              <LayoutGroup id="bottom-nav">
                <nav className="flex flex-col gap-px">{bottomItems.map(renderItem)}</nav>
              </LayoutGroup>
            </div>
          </aside>

          <main
            id="main-content"
            className="flex-1 overflow-y-auto pb-16 sm:pb-0"
            tabIndex={-1}
          >
            <PageTransition pathname={pathname}>{children}</PageTransition>
          </main>
        </div>

        {/* ── Mobile bottom nav ────────────────────────────────── */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
          style={{
            borderColor: 'var(--lv2s-border)',
            background: 'color-mix(in srgb, var(--lv2s-card) 95%, transparent)',
          }}
        >
          {mobileItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            const locked = item.requires ? !checkPlanAccess(currentPlan, item.requires) : false
            const requiredPlanName = item.requires
              ? PLANS[FEATURE_MIN_PLAN[item.requires]].name
              : null
            const href =
              locked && item.requires
                ? `/billing?plan=${FEATURE_MIN_PLAN[item.requires]}&feature=${item.requires}`
                : item.href
            return (
              <Link
                key={item.href}
                href={href}
                title={locked ? `Unlock ${item.label} with the ${requiredPlanName} plan` : undefined}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all"
                style={{
                  color: active
                    ? 'var(--lv2s-primary)'
                    : locked
                    ? 'color-mix(in srgb, var(--lv2s-muted) 65%, transparent)'
                    : 'var(--lv2s-muted)',
                }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {locked && (
                  <Lock
                    className="absolute right-2 top-1.5 h-2.5 w-2.5 opacity-40"
                  />
                )}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMobileMoreOpen((v) => !v)}
            aria-expanded={mobileMoreOpen}
            aria-controls="mobile-more-sheet"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all"
            style={{
              color: mobileMoreOpen ? 'var(--lv2s-primary)' : 'var(--lv2s-muted)',
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
            More
          </button>
        </nav>

        {mobileMoreOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMoreOpen(false)}
            />
            <div
              id="mobile-more-sheet"
              role="dialog"
              aria-label="More navigation"
              className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 max-h-[60vh] overflow-y-auto rounded-t-2xl p-4 shadow-xl lg:hidden"
              style={{
                background: 'var(--lv2s-card)',
                borderTop: '1px solid var(--lv2s-border)',
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p
                  className="text-xs font-bold"
                  style={{ color: 'var(--lv2s-muted)' }}
                >
                  All features
                </p>
                <button
                  type="button"
                  onClick={() => setMobileMoreOpen(false)}
                  className="text-xs hover:text-[var(--lv2s-fg)]"
                  style={{ color: 'var(--lv2s-muted)' }}
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {mobileMoreItems.map((item) => {
                  const Icon = item.icon
                  const locked = item.requires ? !checkPlanAccess(currentPlan, item.requires) : false
                  const href =
                    locked && item.requires
                      ? `/billing?plan=${FEATURE_MIN_PLAN[item.requires]}&feature=${item.requires}`
                      : item.href
                  return (
                    <Link
                      key={item.href}
                      href={href}
                      onClick={() => setMobileMoreOpen(false)}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors hover:bg-black/[0.04] ${
                        locked ? 'opacity-60' : ''
                      }`}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: 'var(--lv2s-muted)' }}
                      />
                      <span className="text-[11px] font-medium">{item.label}</span>
                      {locked && (
                        <Lock className="absolute right-1.5 top-1.5 h-2.5 w-2.5 opacity-50" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// Wraps the primary sidebar CTA with a magnetic pull on hover. Keeps
// appearance identical to the plain `.lv2s-btn-accent` but adds spring
// translation toward the pointer when it's within a short radius.
function NewContentMagnet({ href }: { href: string }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLAnchorElement | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 240, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 240, damping: 18, mass: 0.4 })

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      const radius = 100
      if (dist < radius) {
        const k = (1 - dist / radius) * 0.28
        x.set(dx * k)
        y.set(dy * k)
      } else {
        x.set(0)
        y.set(0)
      }
    }
    const onLeave = () => {
      x.set(0)
      y.set(0)
    }
    window.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [x, y, reduce])

  return (
    <motion.div style={{ x: sx, y: sy }} className="mb-3">
      <Link ref={ref} href={href} className="lv2s-btn-accent w-full">
        <Plus className="h-[14px] w-[14px]" /> New content
      </Link>
    </motion.div>
  )
}

// Fades + slides the main content in on route change. Keyed on pathname so
// Next's App Router triggers the enter animation each navigation. Bypasses
// the animation under reduced motion so screens don't flash.
function PageTransition({
  children,
  pathname,
}: {
  children: React.ReactNode
  pathname: string
}) {
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
