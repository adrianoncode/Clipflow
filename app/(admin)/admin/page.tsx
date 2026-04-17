import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminOverviewPage() {
  const admin = createAdminClient()

  // Parallel stats fetch — admin client bypasses RLS.
  const [
    { count: totalUsers },
    { count: totalWorkspaces },
    { count: totalContent },
    { count: totalOutputs },
    { count: activeSubs },
    { count: totalScheduled },
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('workspaces').select('id', { count: 'exact', head: true }),
    admin
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    admin
      .from('outputs')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
    admin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'trialing']),
    admin
      .from('scheduled_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'scheduled'),
  ])

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Overview</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Platform-wide stats. Admin-only — read from service-role client.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Users" value={totalUsers ?? 0} />
        <StatCard label="Workspaces" value={totalWorkspaces ?? 0} />
        <StatCard label="Active subscriptions" value={activeSubs ?? 0} />
        <StatCard label="Content items" value={totalContent ?? 0} helper="active" />
        <StatCard label="Outputs" value={totalOutputs ?? 0} helper="active" />
        <StatCard label="Scheduled posts" value={totalScheduled ?? 0} helper="pending" />
      </div>
    </div>
  )
}

function StatCard({ label, value, helper }: { label: string; value: number; helper?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </p>
      {helper && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{helper}</p>}
    </div>
  )
}
