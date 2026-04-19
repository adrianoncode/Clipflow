'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileVideo,
  Sparkles,
  CheckSquare,
  Send,
  Search,
  Plug,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
  MoreHorizontal,
  Users2,
  Lock,
} from 'lucide-react'

import { SignoutButton } from '@/components/auth/signout-button'
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
  /** If set, requires this feature. Locked items are still rendered but
   * click routes to /billing instead of the destination. */
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
    if (href === '/settings') return pathname.startsWith('/settings') && !pathname.startsWith('/settings/integrations')
    if (href === '/settings/integrations') return pathname.startsWith('/settings/integrations')
    if (href === `/workspace/${currentWorkspaceId}`) return pathname === href
    // Schedule also matches /calendar (legacy route)
    if (href === `/workspace/${currentWorkspaceId}/schedule`) {
      return pathname === href || pathname.startsWith(href + '/') || pathname === `/workspace/${currentWorkspaceId}/calendar`
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Plan-driven visibility. Features the current plan supports show up
  // normally; features it doesn't still render with a lock + upsell so
  // users can see what's on the next tier (instead of us hiding it).
  //
  // The "Clients" group only appears when the user is actually running
  // multiple workspaces — a solo Studio-plan account with just one
  // workspace doesn't need a Clients nav group yet (the dashboard's
  // "Your clients" strip uses the same rule for the same reason).
  const isAgency =
    checkPlanAccess(currentPlan, 'multiWorkspace') && workspaces.length > 1

  const groups: NavGroup[] = [
    {
      label: 'Workflow',
      items: [
        { href: `/workspace/${currentWorkspaceId}`, label: 'Content', icon: FileVideo },
        { href: `/workspace/${currentWorkspaceId}/content/new`, label: 'Import', icon: Sparkles },
        { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Drafts', icon: CheckSquare },
        { href: `/workspace/${currentWorkspaceId}/schedule`, label: 'Schedule', icon: Send, requires: 'scheduling' },
      ],
    },
    {
      label: 'Research',
      items: [
        { href: `/workspace/${currentWorkspaceId}/research`, label: 'Creators', icon: Search, requires: 'creatorResearch' },
      ],
    },
    // Studio-only: client + team management. Hidden entirely for Creator
    // and Free plans — this group exists to serve the agency ICP and
    // showing it empty would just be noise for indie creators.
    ...(isAgency
      ? [
          {
            label: 'Clients',
            items: [
              { href: '/clients', label: 'All clients', icon: FileVideo, requires: 'multiWorkspace' as const },
              { href: `/workspace/${currentWorkspaceId}/members`, label: 'Team', icon: Users2, requires: 'teamSeats' as const },
            ],
          },
        ]
      : []),
    // Integrations + Analytics live inline with the other groups
    // instead of pinned to the sidebar floor. Previously the bottom
    // nav + `flex-1` layout created an awkward vertical gap for
    // Creator users (5 items up top, 3 items far below). Keeping them
    // in the main flow matches their frequency of use.
    {
      label: 'Insights',
      items: [
        { href: '/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/settings/integrations', label: 'Integrations', icon: Plug },
      ],
    },
  ]

  // Only Settings stays at the very bottom — it's the classic
  // account/config entry point, users expect to find it there.
  const bottomItems: NavItem[] = [
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  // Mobile: 4 core items + More
  const mobileItems: NavItem[] = [
    { href: `/workspace/${currentWorkspaceId}`, label: 'Content', icon: FileVideo },
    { href: `/workspace/${currentWorkspaceId}/content/new`, label: 'Import', icon: Sparkles },
    { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Drafts', icon: CheckSquare },
    { href: `/workspace/${currentWorkspaceId}/schedule`, label: 'Schedule', icon: Send, requires: 'scheduling' },
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
    // Locked items route to /billing with the plan hint so we get one
    // consistent upsell page instead of a dozen different mini-modals.
    const href = locked && item.requires
      ? `/billing?plan=${FEATURE_MIN_PLAN[item.requires]}&feature=${item.requires}`
      : item.href
    const requiredPlanName = item.requires ? PLANS[FEATURE_MIN_PLAN[item.requires]].name : null
    return (
      <Link
        key={item.href}
        href={href}
        title={locked ? `${item.label} — ${requiredPlanName} plan` : undefined}
        className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-all duration-150 ${
          active
            ? 'bg-primary/10 font-semibold text-primary'
            : locked
              ? 'text-muted-foreground/60 hover:bg-accent/30 hover:text-muted-foreground'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
        }`}
      >
        {active && (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
          />
        )}
        <Icon
          className={`h-[15px] w-[15px] shrink-0 ${
            active ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-foreground/70'
          }`}
        />
        <span className="flex-1 leading-none">{item.label}</span>
        {locked && <Lock className="h-3 w-3 shrink-0 text-muted-foreground/40" aria-label={`Requires ${requiredPlanName} plan`} />}
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip to main content — keyboard users tab-land here first and
          can jump past the global nav instead of walking it on every
          page. Visible only when focused so it doesn't clutter the UI. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>

      <KeyboardShortcuts workspaceId={currentWorkspaceId} />
      <FeedbackWidget />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="font-display text-lg font-semibold tracking-tight text-primary"
          >
            Clipflow
          </Link>
          <span aria-hidden className="h-4 w-px bg-border/70" />
          <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
          <div className="hidden sm:block">
            <GlobalSearch workspaceId={currentWorkspaceId} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell initialCount={0} workspaceId={currentWorkspaceId} />
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:hidden"
            aria-label="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </Link>
          <span aria-hidden className="mx-1 hidden h-4 w-px bg-border/70 sm:block" />
          <SignoutButton />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ───────────────────────────────────────────── */}
        <aside className="hidden w-48 shrink-0 flex-col border-r border-border/60 bg-[#fafafa] sm:flex">
          <div className="flex flex-1 flex-col overflow-y-auto px-2 py-3">

            {/* Primary CTA */}
            <Link
              href={`/workspace/${currentWorkspaceId}/content/new`}
              className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:bg-primary/90 hover:shadow-md active:translate-y-0"
            >
              <Plus className="h-4 w-4" />
              New content
            </Link>

            {/* Grouped navigation */}
            {groups.map((group, gi) => (
              <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
                <p className="mb-1 px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">
                  {group.label}
                </p>
                <nav className="flex flex-col gap-px">
                  {group.items.map(renderItem)}
                </nav>
              </div>
            ))}
          </div>

          {/* Referral card */}
          {referralLink && (
            <ReferralSidebarCard
              link={referralLink}
              pending={referralStats.pending}
              confirmed={referralStats.confirmed}
              currentPlan={currentPlan}
            />
          )}

          {/* Bottom nav */}
          <div className="border-t border-border/60 px-2 py-2">
            <nav className="flex flex-col gap-px">
              {bottomItems.map(renderItem)}
            </nav>
          </div>
        </aside>

        {/* ── Main content ───────────────────────────────────────── */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto pb-16 sm:pb-0"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border/60 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg sm:hidden">
        {mobileItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          const locked = item.requires ? !checkPlanAccess(currentPlan, item.requires) : false
          const href = locked && item.requires
            ? `/billing?plan=${FEATURE_MIN_PLAN[item.requires]}&feature=${item.requires}`
            : item.href
          return (
            <Link
              key={item.href}
              href={href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all ${
                active ? 'text-primary' : locked ? 'text-muted-foreground/60' : 'text-muted-foreground active:scale-95'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {locked && (
                <Lock className="absolute right-2 top-1.5 h-2.5 w-2.5 text-muted-foreground/40" />
              )}
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setMobileMoreOpen((v) => !v)}
          aria-expanded={mobileMoreOpen}
          aria-controls="mobile-more-sheet"
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all ${
            mobileMoreOpen ? 'text-primary' : 'text-muted-foreground active:scale-95'
          }`}
        >
          <MoreHorizontal className="h-4 w-4" />
          More
        </button>
      </nav>

      {/* ── Mobile More sheet ─────────────────────────────────────── */}
      {mobileMoreOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm sm:hidden"
            onClick={() => setMobileMoreOpen(false)}
          />
          <div
            id="mobile-more-sheet"
            role="dialog"
            aria-label="More navigation"
            className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-border/60 bg-white p-4 shadow-xl sm:hidden"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold text-muted-foreground">All features</p>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {mobileMoreItems.map((item) => {
                const Icon = item.icon
                const locked = item.requires ? !checkPlanAccess(currentPlan, item.requires) : false
                const href = locked && item.requires
                  ? `/billing?plan=${FEATURE_MIN_PLAN[item.requires]}&feature=${item.requires}`
                  : item.href
                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={() => setMobileMoreOpen(false)}
                    className={`relative flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors hover:bg-accent ${
                      locked ? 'opacity-60' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[11px] font-medium">{item.label}</span>
                    {locked && (
                      <Lock className="absolute right-1.5 top-1.5 h-2.5 w-2.5 text-muted-foreground/50" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
