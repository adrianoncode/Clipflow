export const dynamic = 'force-dynamic'
export const metadata = { title: 'Clients' }

import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { Users2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/workspace/page-heading'
import { ClientsEmptyPreview } from '@/components/workspaces/clients-empty-preview'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess } from '@/lib/billing/plans'
import { getClientWorkspaces } from '@/lib/workspaces/get-client-workspaces'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'

export default async function ClientsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  // Server gate — Clients is a Studio-plan surface. Sidebar hides it
  // for non-agency users but a pasted /clients URL would otherwise
  // reach it. Resolve the active workspace to check its plan.
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(WORKSPACE_COOKIE)?.value
  const active =
    workspaces.find((w) => w.id === cookieWorkspaceId) ??
    workspaces.find((w) => w.type === 'personal') ??
    workspaces[0]
  if (!active) redirect('/dashboard')
  const plan = await getWorkspacePlan(active.id)
  if (!checkPlanAccess(plan, 'multiWorkspace')) {
    redirect(`/billing?workspace_id=${active.id}&plan=agency&feature=multiWorkspace`)
  }

  const clientWorkspaces = await getClientWorkspaces(user.id)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeading
          eyebrow="Agency · Workspaces"
          title="Clients."
          body="All your client workspaces in one place."
        />
        <Button asChild>
          <Link href="/workspace/new?as=client">Create client workspace</Link>
        </Button>
      </div>

      {clientWorkspaces.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="One workspace per client."
          description="Create a dedicated workspace for every brand you run — each one ships with its own brand kit, content library, review links, and team seats. Switch between them from the workspace picker in the top bar."
          actionLabel="Create client workspace"
          actionHref="/workspace/new?as=client"
          secondaryLabel="See the playbook →"
          secondaryHref="/playbook/your-first-24-hours-with-clipflow"
          preview={<ClientsEmptyPreview />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientWorkspaces.map((w) => (
            <div key={w.id} className="rounded-lg border bg-card p-5 shadow-sm flex flex-col gap-4">
              <div>
                <h2 className="font-semibold truncate">{w.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Created {new Date(w.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Stat label="Members" value={w.memberCount} />
                <Stat label="Content" value={w.contentCount} />
                <Stat label="Drafts" value={w.outputCount} />
                <Stat label="Approved" value={w.approvedCount} />
              </div>
              <Button asChild variant="outline" size="sm" className="mt-auto">
                <Link href={`/workspace/${w.id}`}>Open workspace</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/40 p-2 text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
