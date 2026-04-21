export const dynamic = 'force-dynamic'
export const metadata = { title: 'Clients' }

import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { PageHeading } from '@/components/workspace/page-heading'
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
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border/60 bg-muted/[0.06] py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden
            >
              <path d="M18 21a8 8 0 0 0-16 0" />
              <circle cx="10" cy="8" r="5" />
              <path d="M22 20v-2a4 4 0 0 0-3-3.87" />
              <path d="M17 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="max-w-md space-y-2 px-4">
            <p className="text-lg font-bold text-foreground">No client workspaces yet</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Create a dedicated workspace per client — each one gets its own
              brand kit, content library, review links, and team seats.
            </p>
          </div>
          <Button asChild>
            <Link href="/workspace/new?as=client">+ Create client workspace</Link>
          </Button>
        </div>
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
                <Stat label="Outputs" value={w.outputCount} />
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
