'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Video,
  CheckSquare,
  Send,
  BarChart3,
  Wand2,
  PenTool,
  TrendingUp,
  Eye,
  Settings as SettingsIcon,
  CreditCard,
  Plus,
  LayoutDashboard,
  Plug,
  Users2,
  Layers,
  Clapperboard,
  LayoutTemplate,
  FolderKanban,
  Lightbulb,
  Rss,
} from 'lucide-react'

import { SignoutButton } from '@/components/auth/signout-button'
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'
import { GlobalSearch } from '@/components/workspace/global-search'
import { NotificationBell } from '@/components/workspace/notification-bell'
import { ReferralSidebarCard } from '@/components/workspace/referral-sidebar-card'
import { MobileMoreMenu } from '@/components/workspace/mobile-more-menu'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { FeedbackWidget } from '@/components/feedback-widget'
import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'
import type { BillingPlan } from '@/lib/billing/plans'

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
  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId)

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === href
    if (href === '/settings') return pathname === '/settings'
    // Workspace root should not light up for every sub-path
    if (href === `/workspace/${currentWorkspaceId}`) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isFree = currentPlan === 'free'
  // Personal workspaces are single-user by design — hide Members nav to reduce noise.
  // Upgrade to team/client workspace (or switch workspaces) to get it back.
  const showMembers = currentWorkspace?.type !== 'personal'

  // ── WORKFLOW — the core loop: import → edit → review → publish ──
  const workflowItems = [
    {
      href: `/workspace/${currentWorkspaceId}`,
      label: 'My Videos',
      icon: Video,
      locked: false,
    },
    {
      href: `/workspace/${currentWorkspaceId}/studio`,
      label: 'Studio',
      icon: Clapperboard,
      locked: isFree,
    },
    {
      href: `/workspace/${currentWorkspaceId}/pipeline`,
      label: 'Pipeline',
      icon: CheckSquare,
      locked: false,
    },
    {
      href: `/workspace/${currentWorkspaceId}/schedule`,
      label: 'Schedule',
      icon: Send,
      locked: false,
    },
  ]

  // ── WORKSPACE — org-level surfaces ──
  // Progressive disclosure: Members is hidden on personal workspaces
  // (single-user by design), visible on team/client workspaces.
  const workspaceItems = [
    {
      href: `/workspace/${currentWorkspaceId}/projects`,
      label: 'Projects',
      icon: FolderKanban,
      locked: false,
    },
    {
      href: `/workspace/${currentWorkspaceId}/ideas`,
      label: 'Ideas',
      icon: Lightbulb,
      locked: false,
    },
    {
      href: `/workspace/${currentWorkspaceId}/channels`,
      label: 'Channels',
      icon: Rss,
      locked: false,
    },
    ...(showMembers
      ? [
          {
            href: `/workspace/${currentWorkspaceId}/members`,
            label: 'Members',
            icon: Users2,
            locked: false,
          },
        ]
      : []),
  ]

  // ── AI TOOLS — text / research generation ──
  const toolItems = [
    {
      href: `/workspace/${currentWorkspaceId}/tools`,
      label: 'All AI Tools',
      icon: Wand2,
      locked: false,
    },
    {
      href: `/workspace/${currentWorkspaceId}/ghostwriter`,
      label: 'Ghostwriter',
      icon: PenTool,
      locked: false,
    },
    {
      href: `/workspace/${currentWorkspaceId}/batch`,
      label: 'Batch Generate',
      icon: Layers,
      locked: false,
    },
    {
      href: `/workspace/${currentWorkspaceId}/trends`,
      label: 'Trends',
      icon: TrendingUp,
      locked: isFree,
    },
    {
      href: `/workspace/${currentWorkspaceId}/research`,
      label: 'Research',
      icon: Eye,
      locked: isFree,
    },
    {
      href: `/settings/templates`,
      label: 'Templates',
      icon: LayoutTemplate,
      locked: false,
    },
  ]

  const bottomItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings/integrations', label: 'Integrations', icon: Plug },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
    { href: '/billing', label: 'Billing', icon: CreditCard },
  ]

  // Mobile primary nav: 4 core workflow actions + "More" drawer
  const mobileItems = [
    { href: `/workspace/${currentWorkspaceId}`, label: 'Videos', icon: Video },
    { href: `/workspace/${currentWorkspaceId}/studio`, label: 'Studio', icon: Clapperboard },
    { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Pipeline', icon: CheckSquare },
    { href: `/workspace/${currentWorkspaceId}/schedule`, label: 'Schedule', icon: Send },
  ]

  // Mobile "More" drawer — everything else lives here to stay reachable on phones
  const mobileMoreSections = [
    { title: 'Workspace', items: workspaceItems },
    { title: 'AI Tools', items: toolItems },
    {
      title: 'Overview',
      items: bottomItems.map((i) => ({ ...i, locked: false })),
    },
  ]

  // "More" is highlighted if the current route is in any of its drawer items
  const moreActive = mobileMoreSections.some((section) =>
    section.items.some(
      (item) =>
        pathname === item.href ||
        (item.href !== '/dashboard' &&
          item.href !== '/settings' &&
          pathname.startsWith(item.href + '/')),
    ),
  )

  // Helper to render a single nav section with consistent styling
  function renderNavSection(
    title: string,
    items: { href: string; label: string; icon: typeof Video; locked: boolean }[],
    opts: { numbered?: boolean } = {},
  ) {
    return (
      <div>
        <p className="px-3 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
          {title}
        </p>
        <div className="flex flex-col gap-0.5">
          {items.map((item, i) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[13px] transition-all duration-150 ${
                  active
                    ? 'bg-primary/10 font-semibold text-primary'
                    : item.locked
                      ? 'text-muted-foreground/40 hover:bg-accent/40 hover:text-muted-foreground/60'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                }`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                  />
                )}
                {opts.numbered ? (
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : item.locked
                          ? 'bg-border/30 text-muted-foreground/40'
                          : 'bg-border/50 text-muted-foreground/80 group-hover:bg-primary/15 group-hover:text-primary'
                    }`}
                  >
                    {i + 1}
                  </span>
                ) : (
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground/50 group-hover:text-foreground/70'
                    }`}
                  />
                )}
                <span className="flex-1 leading-tight">{item.label}</span>
                {item.locked && (
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                    Pro
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <KeyboardShortcuts workspaceId={currentWorkspaceId} />
      <FeedbackWidget />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/workspace/${currentWorkspaceId}`}
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
          <NotificationBell initialCount={0} />
          <span aria-hidden className="mx-1 hidden h-4 w-px bg-border/70 sm:block" />
          <SignoutButton />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ────────────────────────────────────────────── */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border/60 bg-[#fafafa] sm:flex">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">

            {/* Primary CTA — always visible */}
            <Link
              href={`/workspace/${currentWorkspaceId}/content/new`}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 active:translate-y-0"
            >
              <Plus className="h-4 w-4" />
              New video
            </Link>

            {renderNavSection('Workflow', workflowItems, { numbered: true })}
            {renderNavSection('Workspace', workspaceItems)}
            {renderNavSection('AI Tools', toolItems)}
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
          <div className="border-t border-border/60 px-3 py-3">
            <div className="flex flex-col gap-0.5">
              {bottomItems.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[13px] transition-all duration-150 ${
                      active
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                      />
                    )}
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-foreground/70'}`}
                    />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto pb-16 sm:pb-0">{children}</main>
      </div>

      {/* ── Mobile bottom nav ──────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border/60 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg sm:hidden">
        {mobileItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all ${
                active ? 'text-primary' : 'text-muted-foreground active:scale-95'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
        <MobileMoreMenu active={moreActive} sections={mobileMoreSections} />
      </nav>
    </div>
  )
}
