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

/**
 * Workspace layout — thin wrapper that guards the workspace exists and
 * is accessible. Nav lives in the parent (app) shell — `AppSidebar` +
 * `AppTopbar` — so we intentionally don't render a secondary nav here.
 */
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

  return <div className="flex min-h-full flex-col">{children}</div>
}
