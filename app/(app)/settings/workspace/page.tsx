import { redirect } from 'next/navigation'

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
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Workspace settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage <span className="font-medium">{workspace.name}</span>.
        </p>
      </div>

      <WorkspaceSettingsForm workspace={workspace} isOwner={isOwner} />
    </div>
  )
}
