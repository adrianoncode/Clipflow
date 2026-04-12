import Link from 'next/link'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import type { WorkspaceType } from '@/lib/supabase/types'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: { id: string }
}

interface WorkspaceSummary {
  id: string
  name: string
  slug: string
  type: WorkspaceType
}

const workspaceNav = (id: string) => [
  { href: `/workspace/${id}`, label: 'Content' },
  { href: `/workspace/${id}/projects`, label: 'Projects' },
  { href: `/workspace/${id}/ideas`, label: 'Ideas' },
  { href: `/workspace/${id}/channels`, label: 'Channels' },
]

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const supabase = createClient()
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, name, slug, type')
    .eq('id', params.id)
    .returns<WorkspaceSummary[]>()
    .maybeSingle()

  if (error || !workspace) {
    notFound()
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b bg-muted/40 px-4 py-4 sm:px-8">
        <h2 className="text-lg font-semibold">{workspace.name}</h2>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{workspace.type}</p>
        <nav className="mt-3 flex gap-1">
          {workspaceNav(params.id).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
