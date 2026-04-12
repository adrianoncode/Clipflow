import { notFound } from 'next/navigation'

import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspaceMembers, getWorkspaceInvites } from '@/lib/members/get-workspace-members'
import { MembersPanel } from '@/components/members/members-panel'

export const dynamic = 'force-dynamic'

interface MembersPageProps {
  params: { id: string }
}

export default async function MembersPage({ params }: MembersPageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  const isOwner = workspace.role === 'owner'

  const [members, invites] = await Promise.all([
    getWorkspaceMembers(params.id),
    isOwner ? getWorkspaceInvites(params.id) : Promise.resolve([]),
  ])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          Manage who has access to <span className="font-medium">{workspace.name}</span>.
        </p>
      </div>

      <MembersPanel
        workspaceId={params.id}
        members={members}
        invites={invites}
        isOwner={isOwner}
      />
    </div>
  )
}
