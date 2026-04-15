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
  Users,
  Layers,
  Clapperboard,
  LayoutTemplate,
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
    // Exact-match for /settings to avoid it lighting up for /settings/templates etc.
    if (href === '/settings') return pathname === '/settings'
    return pathname === href || pathname.startsWith(href + '/')
  }

  // ── Workflow nav — mirrors the actual user flow ────────────────
  // 1. Import  2. Edit (Studio)  3. Review  4. Publish
  const isFree = currentPlan === 'free'

  const workflowItems = [
    {
      href: `/workspace/${currentWorkspaceId}`,
      label: 'My Videos',
      icon: Video,
      locked: false,
    },
    {
      href: `/workspace/${currentWorkspaceId}/studio`,
      label: 'Video Studio',
      icon: Clapperboard,
      locked: isFree,
    },
    {
      href: `/workspace/${currentWorkspaceId}/pipeline`,
      label: 'Review Drafts',
      icon: CheckSquare,
      locked: false,
    },
    {
      href: `/workspace/${currentWorkspaceId}/schedule`,
      label: 'Publish',
      icon: Send,
      locked: false,
    },
  ]

  // ── AI Tools — secondary, below the workflow ──────────────────
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
      href: `/workspace/${currentWorkspaceId}/competitors`,
      label: 'Competitors',
      icon: Eye,
      locked: isFree,
    },
    {
      href: `/workspace/${currentWorkspaceId}/creators`,
      label: 'Creator Search',
      icon: Users,
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

  // Mobile nav: the 5 most important items
  const mobileItems = [
    { href: `/workspace/${currentWorkspaceId}`, label: 'Videos', icon: Video },
    { href: `/workspace/${currentWorkspaceId}/studio`, label: 'Studio', icon: Clapperboard },
    { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Review', icon: CheckSquare },
    { href: `/workspace/${currentWorkspaceId}/schedule`, label: 'Publish', icon: Send },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

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
          <div className="flex flex-col gap-0 overflow-y-auto px-3 py-4 flex-1">

            {/* Primary CTA — always visible */}
            <Link
              href={`/workspace/${currentWorkspaceId}/content/new`}
              className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              New video
            </Link>

            {/* ── WORKFLOW ─────────────────────────────────────── */}
            <div className="mb-1">
              <p className="px-3 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
                Workflow
              </p>
              <div className="flex flex-col gap-0.5">
                {workflowItems.map((item, i) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
                        active
                          ? 'bg-primary/10 font-medium text-primary'
                          : item.locked
                            ? 'text-foreground/40 hover:bg-accent/40 hover:text-foreground/60'
                            : 'text-foreground/70 hover:bg-accent/60 hover:text-foreground'
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                        />
                      )}
                      {/* Step number */}
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          active
                            ? 'bg-primary text-white'
                            : item.locked
                              ? 'bg-border/40 text-muted-foreground/40'
                              : 'bg-border/60 text-muted-foreground'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 leading-tight">{item.label}</span>
                      {item.locked && (
                        <span className="rounded-sm bg-primary/10 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                          Pro
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="my-3 border-t border-border/50" />

            {/* ── AI TOOLS ─────────────────────────────────────── */}
            <div>
              <p className="px-3 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
                AI Tools
              </p>
              <div className="flex flex-col gap-0.5">
                {toolItems.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-all ${
                        active
                          ? 'bg-primary/10 font-medium text-primary'
                          : item.locked
                            ? 'text-muted-foreground/50 hover:bg-accent/40 hover:text-muted-foreground'
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
                        className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground'}`}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.locked && (
                        <span className="rounded-sm bg-primary/10 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                          Pro
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
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
                    className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
                      active
                        ? 'bg-primary/10 font-medium text-primary'
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
                      className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-foreground'}`}
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-white/95 backdrop-blur-lg sm:hidden">
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
