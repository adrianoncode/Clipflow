import { notFound } from 'next/navigation'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/get-user'
import { AcceptInviteForm } from '@/components/members/accept-invite-form'

export const dynamic = 'force-dynamic'

interface InvitePageProps {
  params: { token: string }
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
  client: 'Client',
}

export default async function InvitePage({ params }: InvitePageProps) {
  const admin = createAdminClient()

  // Look up invite + workspace name
  const { data: invite } = await admin
    .from('workspace_invites')
    .select('id, role, is_accepted, expires_at, workspace_id')
    .eq('token', params.token)
    .maybeSingle()

  if (!invite) notFound()

  const isExpired = new Date(invite.expires_at) < new Date()

  const { data: workspace } = await admin
    .from('workspaces')
    .select('name')
    .eq('id', invite.workspace_id)
    .maybeSingle()

  const user = await getUser()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Clipflow</h1>
          <p className="text-sm text-muted-foreground">Workspace invite</p>
        </div>

        {invite.is_accepted ? (
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium">This invite has already been accepted.</p>
          </div>
        ) : isExpired ? (
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-destructive">This invite has expired.</p>
            <p className="text-xs text-muted-foreground">Ask the workspace owner to send a new invite.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-md border bg-muted/30 p-4 text-center space-y-1">
              <p className="text-sm text-muted-foreground">You&apos;ve been invited to join</p>
              <p className="text-lg font-semibold">{workspace?.name ?? 'a workspace'}</p>
              <p className="text-xs text-muted-foreground">
                as <span className="font-medium">{ROLE_LABELS[invite.role] ?? invite.role}</span>
              </p>
            </div>

            {!user ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  You need to be logged in to accept this invite.
                </p>
                <a
                  href={`/login?next=/invite/${params.token}`}
                  className="cf-btn-3d cf-btn-3d-primary inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm"
                >
                  Log in to accept
                </a>
                <a
                  href={`/signup?next=/invite/${params.token}`}
                  className="inline-flex h-9 w-full items-center justify-center rounded-md border px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
                >
                  Create account
                </a>
              </div>
            ) : (
              <AcceptInviteForm token={params.token} userEmail={user.email ?? ''} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
