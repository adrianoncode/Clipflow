import Link from 'next/link'

import { SignoutButton } from '@/components/auth/signout-button'
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'
import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'

interface AppShellProps {
  user: { id: string; email: string }
  workspaces: WorkspaceSummary[]
  currentWorkspaceId: string
  children: React.ReactNode
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/settings', label: 'Settings' },
]

export function AppShell({ user, workspaces, currentWorkspaceId, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-background px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Clipflow
          </Link>
          <WorkspaceSwitcher workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
        </div>
        <div className="flex items-center gap-3">
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
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
