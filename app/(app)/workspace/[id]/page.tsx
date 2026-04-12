import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { ContentList } from '@/components/content/content-list'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getContentItems } from '@/lib/content/get-content-items'

interface WorkspaceHomePageProps {
  params: { id: string }
}

export default async function WorkspaceHomePage({ params }: WorkspaceHomePageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) {
    notFound()
  }

  const items = await getContentItems(params.id, { limit: 50 })
  const canCreate = workspace.role === 'owner' || workspace.role === 'editor'
  const atLimit = items.length === 50

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
          <p className="text-sm text-muted-foreground">
            Everything in <span className="font-medium">{workspace.name}</span>.
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href={`/workspace/${params.id}/content/new`}>New content</Link>
          </Button>
        ) : null}
      </div>
      {atLimit ? (
        <p className="text-xs text-muted-foreground">Showing the 50 most recent items.</p>
      ) : null}
      <ContentList items={items} workspaceId={params.id} />
    </div>
  )
}
