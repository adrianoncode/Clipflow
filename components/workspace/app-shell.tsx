'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Columns3,
  CalendarDays,
  Clock,
  PenTool,
  TrendingUp,
  Eye,
  Layers,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  CreditCard,
  Share2,
  Wand2,
  Plug,
  Mic,
  MessageSquare,
  Key,
} from 'lucide-react'

import { SignoutButton } from '@/components/auth/signout-button'
import { ThemeToggle } from '@/components/theme-toggle'
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

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export function AppShell({ user: _user, workspaces, currentWorkspaceId, referralLink, referralStats, currentPlan, children }: AppShellProps) {
  const pathname = usePathname()

  const navGroups: NavGroup[] = [
    {
      label: 'Content',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Pipeline', icon: Columns3 },
        { href: `/workspace/${currentWorkspaceId}/calendar`, label: 'Calendar', icon: CalendarDays },
        { href: `/workspace/${currentWorkspaceId}/schedule`, label: 'Scheduler', icon: Clock },
      ],
    },
    {
      label: 'AI',
      items: [
        { href: `/workspace/${currentWorkspaceId}/tools`, label: 'All Tools', icon: Wand2 },
        { href: `/workspace/${currentWorkspaceId}/ghostwriter`, label: 'Ghostwriter', icon: PenTool },
        { href: `/workspace/${currentWorkspaceId}/trends`, label: 'Trends', icon: TrendingUp },
        { href: `/workspace/${currentWorkspaceId}/competitors`, label: 'Competitors', icon: Eye },
        { href: '/settings/personas', label: 'AI Personas', icon: Mic },
        { href: '/settings/brand-voice', label: 'Brand Voice', icon: MessageSquare },
        { href: '/settings/ai-keys', label: 'API Keys', icon: Key },
      ],
    },
    {
      label: 'Publish',
      items: [
        { href: `/workspace/${currentWorkspaceId}/schedule/connect`, label: 'Channels', icon: Share2 },
        { href: '/settings/integrations', label: 'Integrations', icon: Plug },
      ],
    },
    {
      label: 'Research',
      items: [
        { href: `/workspace/${currentWorkspaceId}/creators`, label: 'Creator Search', icon: Users },
      ],
    },
    {
      label: 'Workspace',
      items: [
        { href: `/workspace/${currentWorkspaceId}/batch`, label: 'Batch', icon: Layers },
        { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
  ]

  const bottomItems: NavItem[] = [
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
    { href: '/billing', label: 'Billing', icon: CreditCard },
  ]

  // Flatten all items for mobile nav — pick the 5 most important
  const mobileItems: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: `/workspace/${currentWorkspaceId}/tools`, label: 'Tools', icon: Wand2 },
    { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Pipeline', icon: Columns3 },
    { href: '/settings/integrations', label: 'Connect', icon: Plug },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <KeyboardShortcuts workspaceId={currentWorkspaceId} />
      <FeedbackWidget />
      {/* Header — tightened. Email moved out (user menu covers identity),
          vertical divider between logo-area and nav-actions for rhythm. */}
      <header className="flex h-14 items-center justify-between border-b border-border/60 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="font-display text-lg font-semibold tracking-tight text-primary"
          >
            Clipflow
          </Link>
          <span aria-hidden className="h-4 w-px bg-border/80" />
          <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
          <Link
            href="/workspace/new"
            title="New workspace"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] text-muted-foreground/60 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            +
          </Link>
          <div className="hidden sm:block">
            <GlobalSearch workspaceId={currentWorkspaceId} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell initialCount={0} />
          <ThemeToggle />
          <span aria-hidden className="mx-1 hidden h-4 w-px bg-border/80 sm:inline-block" />
          <SignoutButton />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar — refined group labels + indented rail with a soft
            active indicator dot instead of a heavy left-border. */}
        <aside className="hidden w-52 shrink-0 flex-col border-r border-border/60 bg-[#fafafa] sm:flex">
          <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          active
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                        }`}
                      >
                        {active ? (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                          />
                        ) : null}
                        <item.icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            active ? 'text-primary' : 'text-muted-foreground/80 group-hover:text-foreground'
                          }`}
                        />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Referral share card — sits above the bottom nav so it's
              always visible without scrolling. */}
          {referralLink ? (
            <ReferralSidebarCard
              link={referralLink}
              pending={referralStats.pending}
              confirmed={referralStats.confirmed}
              currentPlan={currentPlan}
            />
          ) : null}

          {/* Bottom section */}
          <div className="border-t border-border/60 px-3 py-3">
            <div className="flex flex-col gap-0.5">
              {bottomItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                      active
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                    }`}
                  >
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                      />
                    ) : null}
                    <item.icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active ? 'text-primary' : 'text-muted-foreground/80 group-hover:text-foreground'
                      }`}
                    />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Main content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-white/95 backdrop-blur-lg sm:hidden">
        {mobileItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active ? 'text-primary' : 'text-muted-foreground active:scale-95'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
