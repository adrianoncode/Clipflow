'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileVideo,
  Sparkles,
  CheckSquare,
  Send,
  CalendarDays,
  PenLine,
  Zap,
  Clapperboard,
  TrendingUp,
  Search,
  Lightbulb,
  Plug,
  BarChart3,
  Settings as SettingsIcon,
  Plus,
} from 'lucide-react'

import { SignoutButton } from '@/components/auth/signout-button'
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'
import { GlobalSearch } from '@/components/workspace/global-search'
import { NotificationBell } from '@/components/workspace/notification-bell'
import { ReferralSidebarCard } from '@/components/workspace/referral-sidebar-card'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { FeedbackWidget } from '@/components/feedback-widget'
import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'
import type { BillingPlan } from '@/lib/billing/plans'

interface NavItem {
  href: string
  label: string
  icon: typeof FileVideo
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
    return pathname === href || pathname.startsWith(href + '/')
  }

  const groups: NavGroup[] = [
    {
      label: 'Workflow',
      items: [
        { href: `/workspace/${currentWorkspaceId}`, label: 'Content', icon: FileVideo },
        { href: `/workspace/${currentWorkspaceId}/content/new`, label: 'Import', icon: Sparkles },
        { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Pipeline', icon: CheckSquare },
        { href: `/workspace/${currentWorkspaceId}/schedule`, label: 'Schedule', icon: Send },
        { href: `/workspace/${currentWorkspaceId}/calendar`, label: 'Calendar', icon: CalendarDays },
      ],
    },
    {
      label: 'Create',
      items: [
        { href: `/workspace/${currentWorkspaceId}/ghostwriter`, label: 'Ghostwriter', icon: PenLine },
        { href: `/workspace/${currentWorkspaceId}/batch`, label: 'Batch', icon: Zap },
        { href: `/workspace/${currentWorkspaceId}/studio`, label: 'Studio', icon: Clapperboard },
      ],
    },
    {
      label: 'Discover',
      items: [
        { href: `/workspace/${currentWorkspaceId}/trends`, label: 'Trends', icon: TrendingUp },
        { href: `/workspace/${currentWorkspaceId}/research`, label: 'Research', icon: Search },
        { href: `/workspace/${currentWorkspaceId}/ideas`, label: 'Ideas', icon: Lightbulb },
      ],
    },
  ]

  const bottomItems: NavItem[] = [
    { href: '/settings/integrations', label: 'Integrations', icon: Plug },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  // Mobile: 5 core items
  const mobileItems: NavItem[] = [
    { href: `/workspace/${currentWorkspaceId}`, label: 'Content', icon: FileVideo },
    { href: `/workspace/${currentWorkspaceId}/content/new`, label: 'Import', icon: Sparkles },
    { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Pipeline', icon: CheckSquare },
    { href: `/workspace/${currentWorkspaceId}/schedule`, label: 'Schedule', icon: Send },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  function renderItem(item: NavItem) {
    const active = isActive(item.href)
    const Icon = item.icon
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-all duration-150 ${
          active
            ? 'bg-primary/10 font-semibold text-primary'
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
        <span className="leading-none">{item.label}</span>
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
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
              New video
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
        <main className="flex-1 overflow-y-auto pb-16 sm:pb-0">{children}</main>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────────── */}
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
      </nav>
    </div>
  )
}
