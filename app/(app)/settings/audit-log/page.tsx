import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Lock, Shield } from 'lucide-react'

import { PageHeading } from '@/components/workspace/page-heading'
import { AuditLogList } from '@/components/settings/audit-log-list'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess, PLANS, FEATURE_MIN_PLAN } from '@/lib/billing/plans'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Audit log' }
export const dynamic = 'force-dynamic'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * Workspace audit log — who did what, when.
 *
 * Studio-only. Owners see every row for their workspace; RLS on
 * `audit_log` keeps non-owners out even if this page is hit directly.
 *
 * Two-layer gate:
 *   1. Plan check (auditLog feature) → non-Studio users hit an upgrade
 *      nudge here instead of an empty table.
 *   2. Role check → non-owners on the Studio plan get a polite "owners
 *      only" explanation.
 *
 * We fetch the most recent 200 rows server-side; the list component
 * handles pagination-by-load-more if the user wants more history.
 */
export default async function AuditLogPage() {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">No workspace selected.</p>
      </div>
    )
  }

  const plan = await getWorkspacePlan(currentWorkspace.id)
  const hasFeature = checkPlanAccess(plan, 'auditLog')
  const isOwner = currentWorkspace.role === 'owner'

  // Plan gate — non-Studio workspaces see an upgrade nudge
  if (!hasFeature) {
    const requiredPlanName = PLANS[FEATURE_MIN_PLAN.auditLog].name
    return (
      <div className="space-y-8">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: '#EDE6F5' }}
          >
            <Shield className="h-4 w-4" style={{ color: '#2A1A3D' }} />
          </div>
          <PageHeading
            eyebrow="Settings · Audit log"
            title="Workspace audit log."
            body="Track every action in the workspace — invites, role changes, approvals, publishes, key rotations. Essential for agencies reporting to clients or proving compliance."
          />
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-8 text-center">
          <Lock className="mx-auto mb-3 h-6 w-6 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            Available on the {requiredPlanName} plan
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            Studio workspaces record every team action for 90 days with full
            context — actor, target, timestamp, IP. Required for most agency
            client contracts.
          </p>
          <Link
            href={`/billing?plan=agency&feature=auditLog`}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            Upgrade to {requiredPlanName}
          </Link>
        </div>
      </div>
    )
  }

  // Role gate — non-owners see a polite note instead of an RLS-empty table
  if (!isOwner) {
    return (
      <div className="space-y-8">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: '#EDE6F5' }}
          >
            <Shield className="h-4 w-4" style={{ color: '#2A1A3D' }} />
          </div>
          <PageHeading
            eyebrow="Settings · Audit log"
            title="Workspace audit log."
            body="Track every action in the workspace."
          />
        </div>
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Only the workspace owner can view the audit log.
          <div className="mt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Fetch — RLS also enforces workspace scope, but we filter explicitly
  // so the query plan is optimal (uses audit_log_workspace_created_idx).
  const supabase = createClient()
  const { data: rows } = await supabase
    .from('audit_log')
    .select(
      'id, action, actor_id, actor_email, target_type, target_id, metadata, ip, created_at',
    )
    .eq('workspace_id', currentWorkspace.id)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#EDE6F5' }}
        >
          <Shield className="h-4 w-4" style={{ color: '#2A1A3D' }} />
        </div>
        <PageHeading
          eyebrow="Settings · Audit log"
          title="Workspace audit log."
          body={`Everything that happened in ${currentWorkspace.name}, newest first. Showing the most recent ${rows?.length ?? 0} events.`}
        />
      </div>

      <AuditLogList
        rows={(rows ?? []).map((r) => ({
          ...r,
          metadata:
            r.metadata && typeof r.metadata === 'object' && !Array.isArray(r.metadata)
              ? (r.metadata as Record<string, unknown>)
              : null,
        }))}
      />
    </div>
  )
}
