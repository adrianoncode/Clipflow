import { cookies } from 'next/headers'

import { AddAiKeyDialog } from '@/components/ai-keys/add-ai-key-dialog'
import { AiKeyList } from '@/components/ai-keys/ai-key-list'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = {
  title: 'AI keys',
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

export default async function AiKeysPage() {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">AI keys</h1>
        <p className="text-sm text-muted-foreground">No workspace selected.</p>
      </div>
    )
  }

  const keys = await getAiKeys(currentWorkspace.id)
  const isOwner = currentWorkspace.role === 'owner'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">AI keys</h1>
          <p className="text-sm text-muted-foreground">
            BYOK keys for <span className="font-medium">{currentWorkspace.name}</span>.
            Only workspace owners can see or change these.
          </p>
        </div>
        {isOwner ? <AddAiKeyDialog workspaceId={currentWorkspace.id} /> : null}
      </div>
      {isOwner ? (
        <AiKeyList keys={keys} workspaceId={currentWorkspace.id} />
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Only owners of this workspace can manage AI keys.
        </div>
      )}
    </div>
  )
}
