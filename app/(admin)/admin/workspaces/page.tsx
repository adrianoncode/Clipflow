import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminWorkspacesPage() {
  const admin = createAdminClient()

  const { data: workspaces } = await admin
    .from('workspaces')
    .select('id, name, type, owner_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const workspaceIds = (workspaces ?? []).map((w) => w.id)
  const ownerIds = Array.from(new Set((workspaces ?? []).map((w) => w.owner_id)))

  const [ownerProfiles, subscriptions, contentCounts] = await Promise.all([
    ownerIds.length
      ? admin.from('profiles').select('id, email').in('id', ownerIds)
      : Promise.resolve({ data: [] as Array<{ id: string; email: string | null }> }),
    workspaceIds.length
      ? admin
          .from('subscriptions')
          .select('workspace_id, plan, status')
          .in('workspace_id', workspaceIds)
      : Promise.resolve({ data: [] as Array<{ workspace_id: string; plan: string; status: string }> }),
    workspaceIds.length
      ? admin
          .from('content_items')
          .select('workspace_id')
          .in('workspace_id', workspaceIds)
          .is('deleted_at', null)
      : Promise.resolve({ data: [] as Array<{ workspace_id: string }> }),
  ])

  const ownerEmailById = new Map(
    (ownerProfiles.data ?? []).map((p) => [p.id, p.email] as const),
  )
  const planByWorkspace = new Map(
    (subscriptions.data ?? []).map((s) => [s.workspace_id, `${s.plan} · ${s.status}`] as const),
  )
  const contentCountByWorkspace = new Map<string, number>()
  for (const row of contentCounts.data ?? []) {
    contentCountByWorkspace.set(
      row.workspace_id,
      (contentCountByWorkspace.get(row.workspace_id) ?? 0) + 1,
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Workspaces</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {workspaces?.length ?? 0} most recent workspaces (max 100).
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border/40 bg-muted/30">
            <tr>
              <Th>Name</Th>
              <Th>Owner</Th>
              <Th>Plan</Th>
              <Th>Type</Th>
              <Th className="text-right">Content</Th>
              <Th className="text-right">Created</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {(workspaces ?? []).map((w) => (
              <tr key={w.id} className="transition-colors hover:bg-muted/20">
                <Td className="font-semibold">{w.name}</Td>
                <Td className="font-mono text-xs text-muted-foreground">
                  {ownerEmailById.get(w.owner_id) ?? w.owner_id.slice(0, 8)}
                </Td>
                <Td className="font-mono text-[11px]">
                  {planByWorkspace.get(w.id) ?? 'free'}
                </Td>
                <Td>
                  <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {w.type}
                  </span>
                </Td>
                <Td className="text-right font-mono tabular-nums">
                  {contentCountByWorkspace.get(w.id) ?? 0}
                </Td>
                <Td className="text-right font-mono text-[11px] text-muted-foreground">
                  {new Date(w.created_at).toLocaleDateString()}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className ?? ''}`}
    >
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 ${className ?? ''}`}>{children}</td>
}
