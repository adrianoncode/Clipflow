import 'server-only'

import { headers } from 'next/headers'

import { getUser } from '@/lib/auth/get-user'
import { log } from '@/lib/log'
import { extractClientIp } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

import type { AuditAction } from './actions'

interface AuditWriteParams {
  workspaceId: string
  action: AuditAction
  /** Subject of the action — 'member', 'workspace', 'output', etc. */
  targetType?: string
  /** Stringified target id. Free-form so we don't lose the row on hard-delete. */
  targetId?: string
  /** Per-action context — keep it small, no PII beyond what's already in the row. */
  metadata?: Record<string, unknown>
  /** Override the actor — used for system-initiated rows (webhooks, crons). */
  actor?: { id: string | null; email: string | null }
}

/**
 * Append a row to `audit_log`. Best-effort — if the write fails we log
 * and swallow so callers aren't blocked on an audit hiccup. The row is
 * the audit trail; losing one is acceptable, crashing the caller isn't.
 *
 * The admin client is used because RLS on the table has no insert
 * policy (see 20260421000200_audit_log.sql) — only the service role
 * may write, which stops end-users from forging rows.
 */
export async function writeAuditLog(params: AuditWriteParams): Promise<void> {
  try {
    const admin = createAdminClient()

    let actorId: string | null = params.actor?.id ?? null
    let actorEmail: string | null = params.actor?.email ?? null
    if (!actorId && !actorEmail) {
      const user = await getUser()
      actorId = user?.id ?? null
      actorEmail = user?.email ?? null
    }

    let ip: string | null = null
    let userAgent: string | null = null
    try {
      const h = headers()
      ip = extractClientIp(h) ?? null
      userAgent = h.get('user-agent') ?? null
    } catch {
      // `headers()` throws outside a request scope (e.g. crons). Silent
      // fallback — the audit row is still useful without ip/ua.
    }

    const { error } = await admin.from('audit_log').insert({
      workspace_id: params.workspaceId,
      actor_id: actorId,
      actor_email: actorEmail,
      action: params.action,
      target_type: params.targetType ?? null,
      target_id: params.targetId ?? null,
      metadata: (params.metadata ?? {}) as never,
      ip,
      user_agent: userAgent,
    })

    if (error) {
      log.error('audit-log insert failed', error, {
        workspaceId: params.workspaceId,
        action: params.action,
      })
    }
  } catch (err) {
    log.error('audit-log unexpected', err, {
      workspaceId: params.workspaceId,
      action: params.action,
    })
  }
}
