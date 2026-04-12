import Link from 'next/link'
import { cookies } from 'next/headers'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AddAiKeyBanner } from '@/components/dashboard/add-ai-key-banner'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const [user, workspaces] = await Promise.all([getUser(), getWorkspaces()])
  const fullName =
    typeof user?.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : null
  const displayName = fullName ?? user?.email ?? 'there'

  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  const aiKeys = currentWorkspace ? await getAiKeys(currentWorkspace.id) : []
  const showAiKeyNudge =
    !!currentWorkspace && currentWorkspace.role === 'owner' && aiKeys.length === 0

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome, {displayName}</h1>
        <p className="text-muted-foreground">
          {currentWorkspace
            ? `You're in "${currentWorkspace.name}".`
            : 'No workspace yet.'}
        </p>
      </div>
      {showAiKeyNudge && currentWorkspace ? (
        <AddAiKeyBanner workspaceName={currentWorkspace.name} />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New content</CardTitle>
            <CardDescription>
              Upload a video or paste a script. Whisper transcribes it and you get a clean
              starting point for drafts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentWorkspace ? (
              <Link
                href={`/workspace/${currentWorkspace.id}/content/new`}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Start new content
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">No workspace selected.</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Output studio</CardTitle>
            <CardDescription>
              Edit, review, and approve platform-specific drafts. Move content from Draft to
              Approved before exporting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentWorkspace ? (
              <Link
                href={`/workspace/${currentWorkspace.id}`}
                className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
              >
                View workspace
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">No workspace selected.</span>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
