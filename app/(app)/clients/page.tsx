export const dynamic = 'force-dynamic'
export const metadata = { title: 'Clients' }

import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth/get-user'
import { getClientWorkspaces } from '@/lib/workspaces/get-client-workspaces'

export default async function ClientsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const clientWorkspaces = await getClientWorkspaces(user.id)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">All your client workspaces in one place.</p>
        </div>
        <Button asChild>
          <Link href="/workspace/new">Create client workspace</Link>
        </Button>
      </div>

      {clientWorkspaces.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No client workspaces yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/workspace/new">Create client workspace</Link>
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
