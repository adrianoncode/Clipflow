import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/get-user'

export type WorkspaceRole = 'owner' | 'editor' | 'reviewer'

export type MemberCheckResult =
  | { ok: true; userId: string; role: WorkspaceRole }
  | { ok: false; status: 401 | 403; message: string }

/**
 * Authz helper for API routes + server actions.
 *
 * Resolves the current user, then verifies they have a membership row
 * on the given workspace. Returns the role so callers can gate
 * further (e.g. "owner only" settings writes).
 *
 * Why it exists: we had a pattern where routes called `getUser()` and
 * then trusted a `workspace_id` from the client payload, relying on
 * RLS as the only backstop. A single policy regression would open
 * cross-tenant reads/writes. This guard makes the check explicit at
 * the entry point.
 *
 * Usage pattern for an API route:
 *
 *   const check = await requireWorkspaceMember(workspaceId)
 *   if (!check.ok) return NextResponse.json({ error: check.message }, { status: check.status })
 *
 * Usage pattern for a server action:
 *
 *   const check = await requireWorkspaceMember(workspaceId)
 *   if (!check.ok) return { ok: false, error: check.message }
 */
export async function requireWorkspaceMember(
  workspaceId: string | null | undefined,
): Promise<MemberCheckResult> {
  if (!workspaceId) {
    return { ok: false, status: 403, message: 'Workspace required.' }
  }

  const user = await getUser()
  if (!user) {
    return { ok: false, status: 401, message: 'Not authenticated.' }
  }

  const supabase = createClient()
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) {
    return {
      ok: false,
      status: 403,
      message: 'You are not a member of this workspace.',
    }
  }

  return { ok: true, userId: user.id, role: data.role as WorkspaceRole }
}
