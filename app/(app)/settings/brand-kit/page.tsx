import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { BrandKitForm } from '@/components/brand-kit/brand-kit-form'
import { PageHeading } from '@/components/workspace/page-heading'
import { getBrandKit } from '@/lib/brand-kit/get-brand-kit'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = { title: 'Brand Kit — Clipflow' }
export const dynamic = 'force-dynamic'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

export default async function BrandKitPage() {
  const user = await getUser()
  if (!user) notFound()

  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const workspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ??
    workspaces.find((w) => w.type === 'personal') ??
    workspaces[0]
  if (!workspace) notFound()

  const kit = await getBrandKit(workspace.id)
  const canEdit = workspace.role === 'owner' || workspace.role === 'editor'

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow={`${workspace.name} · Brand Kit`}
        title="Brand kit."
        body="Your logo, colors, and intro/outro copy — applied automatically to every clip Clipflow renders. Set once, stays on-brand forever."
      />
      <BrandKitForm workspaceId={workspace.id} initial={kit} canEdit={canEdit} />
    </div>
  )
}
