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
  Sparkles,
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

export function AppShell({ user, workspaces, currentWorkspaceId, referralLink, referralStats, currentPlan, children }: AppShellProps) {
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
        { href: '/settings/ai-keys', label: 'AI Keys', icon: Key },
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
        { href: '/changelog', label: "What's New", icon: Sparkles },
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
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-display text-lg font-semibold tracking-tight text-primary">
            Clipflow
          </Link>
          <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
          <Link
            href="/workspace/new"
            title="New workspace"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-muted-foreground/60 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            +
          </Link>
          <div className="hidden sm:block">
            <GlobalSearch workspaceId={currentWorkspaceId} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell initialCount={0} />
          <ThemeToggle />
          <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
          <SignoutButton />
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 flex-col border-r bg-[#fafafa] sm:flex">
          <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          active
                            ? 'border-l-2 border-l-primary bg-primary/10 font-medium text-foreground'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
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
          <div className="border-t px-3 py-3">
            <div className="flex flex-col gap-0.5">
              {bottomItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? 'border-l-2 border-l-primary bg-primary/10 font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : ''}`} />
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
