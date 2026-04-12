import Link from 'next/link'

import { SignoutButton } from '@/components/auth/signout-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'
import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'

interface AppShellProps {
  user: { id: string; email: string }
  workspaces: WorkspaceSummary[]
  currentWorkspaceId: string
  children: React.ReactNode
}

export function AppShell({ user, workspaces, currentWorkspaceId, children }: AppShellProps) {
  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: `/workspace/${currentWorkspaceId}/pipeline`, label: 'Pipeline' },
    { href: `/workspace/${currentWorkspaceId}/ghostwriter`, label: 'Ghostwriter' },
    { href: `/workspace/${currentWorkspaceId}/batch`, label: 'Batch' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/clients', label: 'Clients' },
    { href: '/settings', label: 'Settings' },
    { href: '/billing', label: 'Billing' },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Clipflow
          </Link>
          <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
          <Link
            href="/workspace/new"
            title="New workspace"
            className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <span className="text-base leading-none">+</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
          <SignoutButton />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-48 shrink-0 border-r bg-muted/30 p-4 sm:block">
          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 font-medium hover:bg-accent hover:text-accent-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        {/* Extra bottom padding on mobile so content clears the bottom nav */}
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>
      </div>
      {/* Mobile bottom nav — only visible on small screens */}
      <nav className="fixed bottom-0 left-0 right-0 flex border-t bg-background sm:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 items-center justify-center py-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
