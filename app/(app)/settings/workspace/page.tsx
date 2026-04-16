import { redirect } from 'next/navigation'
import { Building2 } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { WorkspaceSettingsForm } from '@/components/settings/workspace-settings-form'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Workspace settings',
}

export default async function WorkspaceSettingsPage({
  searchParams,
}: {
  searchParams: { workspace?: string }
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspaces()
  const workspaceId = searchParams.workspace ?? workspaces.find((w) => w.role === 'owner')?.id

  if (!workspaceId) redirect('/dashboard')

  const workspace = workspaces.find((w) => w.id === workspaceId)
  if (!workspace) redirect('/dashboard')

  const isOwner = workspace.role === 'owner'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
          <Building2 className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Workspace settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage <span className="font-semibold text-foreground">{workspace.name}</span> — rename,
            change type, or delete.
          </p>
        </div>
      </div>

      {/* Workspace form card */}
      <div className="max-w-xl rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <WorkspaceSettingsForm workspace={workspace} isOwner={isOwner} />
      </div>
    </div>
  )
}
