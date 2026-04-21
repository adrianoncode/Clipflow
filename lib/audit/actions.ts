/**
 * Canonical list of audit-log action strings.
 *
 * Every writer imports from here rather than hardcoding strings. The DB
 * column is plain text (no enum) so adding a new action doesn't require
 * a migration — but routing every new action through this file means
 * we get a typo-check for free.
 *
 * Organized loosely by subject. Values are stable on-the-wire —
 * renaming one would invalidate historical audit rows, so don't.
 */
export const AUDIT_ACTIONS = {
  // ── Workspace ────────────────────────────────────────────────────
  workspace_created: 'workspace.created',
  workspace_updated: 'workspace.updated',
  workspace_deleted: 'workspace.deleted',

  // ── Members ──────────────────────────────────────────────────────
  member_invited: 'member.invited',
  member_role_changed: 'member.role_changed',
  member_removed: 'member.removed',
  member_joined: 'member.joined',

  // ── Billing / Plan ───────────────────────────────────────────────
  plan_upgraded: 'plan.upgraded',
  plan_downgraded: 'plan.downgraded',
  subscription_cancelled: 'subscription.cancelled',

  // ── Content / Outputs ────────────────────────────────────────────
  content_deleted: 'content.deleted',
  output_approved: 'output.approved',
  output_rejected: 'output.rejected',
  output_published: 'output.published',
  output_scheduled: 'output.scheduled',

  // ── Keys / Connections ───────────────────────────────────────────
  ai_key_added: 'ai_key.added',
  ai_key_removed: 'ai_key.removed',
  brand_kit_updated: 'brand_kit.updated',
  brand_voice_updated: 'brand_voice.updated',

  // ── Review link ──────────────────────────────────────────────────
  review_link_created: 'review.link_created',
  review_feedback_submitted: 'review.feedback_submitted',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

/** Human-readable label for a given audit action. Used by the owner view. */
export function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    [AUDIT_ACTIONS.workspace_created]: 'Created workspace',
    [AUDIT_ACTIONS.workspace_updated]: 'Updated workspace',
    [AUDIT_ACTIONS.workspace_deleted]: 'Deleted workspace',
    [AUDIT_ACTIONS.member_invited]: 'Invited a member',
    [AUDIT_ACTIONS.member_role_changed]: 'Changed a member role',
    [AUDIT_ACTIONS.member_removed]: 'Removed a member',
    [AUDIT_ACTIONS.member_joined]: 'Joined the workspace',
    [AUDIT_ACTIONS.plan_upgraded]: 'Upgraded plan',
    [AUDIT_ACTIONS.plan_downgraded]: 'Downgraded plan',
    [AUDIT_ACTIONS.subscription_cancelled]: 'Cancelled subscription',
    [AUDIT_ACTIONS.content_deleted]: 'Deleted content',
    [AUDIT_ACTIONS.output_approved]: 'Approved a draft',
    [AUDIT_ACTIONS.output_rejected]: 'Rejected a draft',
    [AUDIT_ACTIONS.output_published]: 'Published a post',
    [AUDIT_ACTIONS.output_scheduled]: 'Scheduled a post',
    [AUDIT_ACTIONS.ai_key_added]: 'Added an AI key',
    [AUDIT_ACTIONS.ai_key_removed]: 'Removed an AI key',
    [AUDIT_ACTIONS.brand_kit_updated]: 'Updated brand kit',
    [AUDIT_ACTIONS.brand_voice_updated]: 'Updated brand voice',
    [AUDIT_ACTIONS.review_link_created]: 'Created a review link',
    [AUDIT_ACTIONS.review_feedback_submitted]: 'Client left review feedback',
  }
  return map[action] ?? action
}
