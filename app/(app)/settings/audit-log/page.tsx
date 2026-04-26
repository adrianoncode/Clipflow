import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Download, Lock } from 'lucide-react'

import { AuditLogList } from '@/components/settings/audit-log-list'
import {
  SettingsFootnote,
  SettingsRow,
  SettingsSection,
} from '@/components/settings/section'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess, PLANS, FEATURE_MIN_PLAN } from '@/lib/billing/plans'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Audit log' }
export const dynamic = 'force-dynamic'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

const TRACKED_CATEGORIES = [
  {
    label: 'Members',
    description: 'Invites, role changes, removals, joins.',
  },
  {
    label: 'Content',
    description: 'Approvals, rejections, publishes, schedules, deletions.',
  },
  {
    label: 'Billing',
    description: 'Plan upgrades, downgrades, subscription cancellations.',
  },
  {
    label: 'Security',
    description: 'AI key rotations, brand kit / voice updates, review links.',
  },
] as const

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
        <SettingsSection title="Audit log" hint={`available on the ${requiredPlanName} plan`}>
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
        <SettingsSection title="Audit log" hint="owner-only">
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
  const isEmpty = count === 0

  const normalizedRows = (rows ?? []).map((r) => ({
    ...r,
    metadata:
      r.metadata && typeof r.metadata === 'object' && !Array.isArray(r.metadata)
        ? (r.metadata as Record<string, unknown>)
        : null,
  }))

  return (
    <div className="space-y-7">
      {/* ── 01 · Activity ─────────────────────────────────────── */}
      <SettingsSection
        title={isEmpty ? 'Activity' : 'Recent activity'}
        hint={
          isEmpty
            ? `${currentWorkspace.name} · waiting for the first event`
            : `${currentWorkspace.name} · most recent ${count} event${count === 1 ? '' : 's'}, newest first`
        }
      >
        {isEmpty ? (
          <div className="flex flex-col gap-2 px-4 py-6 sm:px-5">
            <p className="text-[13px] font-semibold text-foreground">
              Nothing tracked yet.
            </p>
            <p className="max-w-xl text-[12.5px] leading-relaxed text-muted-foreground">
              The next time someone invites a teammate, approves a draft, publishes a
              post, or rotates a key in <span className="font-bold text-foreground">{currentWorkspace.name}</span>,
              it shows up here with the actor, target, timestamp, and IP.
            </p>
          </div>
        ) : (
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <AuditLogList rows={normalizedRows} />
          </div>
        )}
      </SettingsSection>

      {/* ── 02 · Coverage ─────────────────────────────────────── */}
      <SettingsSection title="What we track" hint="four categories, every workspace action">
        {TRACKED_CATEGORIES.map((cat) => (
          <SettingsRow
            key={cat.label}
            label={cat.label}
            description={cat.description}
            control={
              <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Logged
              </span>
            }
          />
        ))}
      </SettingsSection>

      {/* ── 03 · Retention & export ──────────────────────────── */}
      <SettingsSection title="Retention & export" hint="agency-contract ready">
        <SettingsRow
          label="Retention"
          description="Events stay queryable for 90 days, then archive cold for another 12 months."
          control={
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
              90d · 365d cold
            </span>
          }
        />
        <SettingsRow
          label="Export"
          description="Download every event as CSV — actor, target, metadata, IP, timestamp."
          control={
            isEmpty ? (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
                <Download className="h-3 w-3" />
                Available once events exist
              </span>
            ) : (
              <a
                href={`/api/audit-log/export?workspace=${currentWorkspace.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-[12px] font-bold text-foreground transition-all hover:-translate-y-px hover:border-border hover:shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV
              </a>
            )
          }
        />
      </SettingsSection>

      <SettingsFootnote>
        Rows are write-only · RLS pins reads to the workspace owner · IP is hashed before storage.
      </SettingsFootnote>
    </div>
  )
}
