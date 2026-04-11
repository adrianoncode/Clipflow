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
      <div className="border-b bg-muted/40 px-8 py-4">
        <h2 className="text-lg font-semibold">{workspace.name}</h2>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{workspace.type}</p>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
