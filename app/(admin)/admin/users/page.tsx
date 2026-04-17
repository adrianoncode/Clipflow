import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminUsersPage() {
  const admin = createAdminClient()

  // Fetch first 100 profiles + their workspace counts.
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const profileIds = (profiles ?? []).map((p) => p.id)
  const { data: memberships } = profileIds.length
    ? await admin
        .from('workspace_members')
        .select('user_id, workspace_id')
        .in('user_id', profileIds)
    : { data: [] as Array<{ user_id: string; workspace_id: string }> }

  const workspaceCountByUser = new Map<string, number>()
  for (const m of memberships ?? []) {
    workspaceCountByUser.set(m.user_id, (workspaceCountByUser.get(m.user_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Users</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {profiles?.length ?? 0} most recent profiles (max 100).
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border/40 bg-muted/30">
            <tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th className="text-right">Workspaces</Th>
              <Th className="text-right">Joined</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {(profiles ?? []).map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-muted/20">
                <Td className="font-mono text-xs">{p.email ?? '—'}</Td>
                <Td>{p.full_name ?? '—'}</Td>
                <Td className="text-right font-mono tabular-nums">
                  {workspaceCountByUser.get(p.id) ?? 0}
                </Td>
                <Td className="text-right font-mono text-[11px] text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString()}
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
