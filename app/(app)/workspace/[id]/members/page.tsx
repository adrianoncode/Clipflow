import { notFound, redirect } from 'next/navigation'

import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess } from '@/lib/billing/plans'
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

  // Server gate — teamSeats is Studio-only. Matches the sidebar
  // `requires: 'teamSeats'` rule but guards URL paste too.
  const plan = await getWorkspacePlan(params.id)
  if (!checkPlanAccess(plan, 'teamSeats')) {
    redirect(`/billing?workspace_id=${params.id}&plan=agency&feature=teamSeats`)
  }

  const isOwner = workspace.role === 'owner'

  const [members, invites] = await Promise.all([
    getWorkspaceMembers(params.id),
    isOwner ? getWorkspaceInvites(params.id) : Promise.resolve([]),
  ])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          Invite teammates and manage who can edit <span className="font-medium">{workspace.name}</span>.
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
