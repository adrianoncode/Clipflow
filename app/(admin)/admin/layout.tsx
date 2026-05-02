import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LayoutDashboard, Users, Building2, AlertOctagon } from 'lucide-react'

import { isAdmin } from '@/lib/auth/is-admin'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Admin · Clipflow',
  // Admin tools must never be indexed — the route 404s for non-admins,
  // but the meta tag is the belt-and-braces signal in case a stray
  // crawler authenticates via residual session cookie.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
}

/**
 * Admin-only layout. Any non-admin visitor gets a 404 — we return
 * notFound() rather than redirect so the route doesn't even appear to
 * exist from outside.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const allowed = await isAdmin()
  if (!allowed) notFound()

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 shrink-0 border-r border-border/50 bg-card">
        <div className="flex h-14 items-center gap-2 border-b border-border/50 px-4">
          <AlertOctagon className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-tight">Admin</span>
        </div>
        <nav className="p-3">
          <ul className="space-y-0.5">
            <NavItem href="/admin" label="Overview" Icon={LayoutDashboard} />
            <NavItem href="/admin/users" label="Users" Icon={Users} />
            <NavItem href="/admin/workspaces" label="Workspaces" Icon={Building2} />
          </ul>
        </nav>
        <div className="p-3 pt-6">
          <Link
            href="/dashboard"
            className="block rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to app
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function NavItem({
  href,
  label,
  Icon,
}: {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </li>
  )
}
