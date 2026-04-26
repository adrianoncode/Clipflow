import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'

import { AuditLogList } from '@/components/settings/audit-log-list'
import { SettingsSection } from '@/components/settings/section'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess, PLANS, FEATURE_MIN_PLAN } from '@/lib/billing/plans'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Audit log' }
export const dynamic = 'force-dynamic'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

export default async function AuditLogPage() {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">No workspace selected.</p>
      </div>
    )
  }

  const plan = await getWorkspacePlan(currentWorkspace.id)
  const hasFeature = checkPlanAccess(plan, 'auditLog')
  const isOwner = currentWorkspace.role === 'owner'

  // Plan gate
  if (!hasFeature) {
    const requiredPlanName = PLANS[FEATURE_MIN_PLAN.auditLog].name
    return (
      <div className="space-y-7">
        <SettingsSection num="01" title="Audit log" hint={`available on the ${requiredPlanName} plan`}>
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center sm:px-8">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-4 w-4" />
            </span>
            <div className="space-y-1">
              <p className="text-[14px] font-bold text-foreground">
                Track every action in the workspace
              </p>
              <p className="mx-auto max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
                Studio records invites, role changes, approvals, publishes, and key rotations
                for 90 days with full context — actor, target, timestamp, IP. Required for
                most agency client contracts.
              </p>
            </div>
            <Link
              href={`/billing?plan=agency&feature=auditLog`}
              className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:shadow-md"
            >
              Upgrade to {requiredPlanName}
            </Link>
          </div>
        </SettingsSection>
      </div>
    )
  }

  // Role gate
  if (!isOwner) {
    return (
      <div className="space-y-7">
        <SettingsSection num="01" title="Audit log" hint="owner-only">
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center sm:px-8">
            <p className="text-[13.5px] font-bold text-foreground">
              Only the workspace owner can view the audit log.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to dashboard
            </Link>
          </div>
        </SettingsSection>
      </div>
    )
  }

  const supabase = createClient()
  const { data: rows } = await supabase
    .from('audit_log')
    .select(
      'id, action, actor_id, actor_email, target_type, target_id, metadata, ip, created_at',
    )
    .eq('workspace_id', currentWorkspace.id)
    .order('created_at', { ascending: false })
    .limit(200)

  const count = rows?.length ?? 0

  return (
    <div className="space-y-7">
      <SettingsSection
        num="01"
        title="Recent activity"
        hint={`${currentWorkspace.name} · most recent ${count} event${count === 1 ? '' : 's'}, newest first`}
      >
        <div className="px-4 py-4 sm:px-5 sm:py-5">
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
      </SettingsSection>
    </div>
  )
}
