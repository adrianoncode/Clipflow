import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { LibraryClient } from '@/components/library/library-client'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getLibraryItems } from '@/lib/library/get-library-items'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Library' }

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

/**
 * Library — global asset browser across the active workspace.
 *
 * Mirrors the editorial design from the Claude Design handoff:
 * Hero ("Everything you've made.") + Toolbar (search · type filter ·
 * grid/list toggle) + 4 mini stat cards + responsive grid or list of
 * items. Server fetches the data; the LibraryClient owns filter/view
 * state.
 */
export default async function LibraryPage() {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const workspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ??
    workspaces.find((w) => w.type === 'personal') ??
    workspaces[0]
  if (!workspace) notFound()

  const { items, stats } = await getLibraryItems(workspace.id)

  return (
    <div className="min-h-full p-4 sm:p-8">
      <div className="mx-auto w-full max-w-[1280px]">
        <LibraryClient
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          items={items}
          stats={stats}
        />
      </div>
    </div>
  )
}
