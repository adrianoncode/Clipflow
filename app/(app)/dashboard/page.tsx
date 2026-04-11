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
    <div className="mx-auto w-full max-w-4xl space-y-6 p-8">
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
            <CardTitle>Upload your first clip</CardTitle>
            <CardDescription>
              Drop in a video or paste a script to generate platform-specific drafts. Ships
              in Milestone 3.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Output studio</CardTitle>
            <CardDescription>
              Review and approve platform-specific drafts in one place. Ships in Milestone 5.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
        </Card>
      </div>
    </div>
  )
}
