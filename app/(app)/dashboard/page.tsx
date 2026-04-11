import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const [user, workspaces] = await Promise.all([getUser(), getWorkspaces()])
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'there'
  const personal = workspaces.find((w) => w.type === 'personal') ?? workspaces[0]

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome, {displayName}</h1>
        <p className="text-muted-foreground">
          {personal ? `You're in your "${personal.name}" workspace.` : 'No workspace yet.'}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload your first clip</CardTitle>
            <CardDescription>
              Drop in a video or paste a script to generate platform-specific drafts. Ships in
              Milestone 3.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add an AI key</CardTitle>
            <CardDescription>
              Bring your own OpenAI, Anthropic, or Google key. Ships in Milestone 2.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
        </Card>
      </div>
    </div>
  )
}
