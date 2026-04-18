export const dynamic = 'force-dynamic'
export const metadata = { title: 'B-Roll' }

import { redirect } from 'next/navigation'

import { BrollClient } from '@/components/content/broll-client'
import { getContentItem } from '@/lib/content/get-content-item'
import { extractBrollKeywords } from '@/lib/broll/extract-broll-keywords'
import { searchPexelsVideos } from '@/lib/broll/search-pexels'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess } from '@/lib/billing/plans'

interface BrollPageProps {
  params: { id: string; contentId: string }
}

export default async function BrollPage({ params }: BrollPageProps) {
  const { id: workspaceId, contentId } = params

  // Server-level plan gate — URL paste would otherwise bypass the
  // tools-tab client gate.
  const plan = await getWorkspacePlan(workspaceId)
  if (!checkPlanAccess(plan, 'brollAutomation')) {
    redirect(`/billing?workspace_id=${workspaceId}&plan=solo&feature=brollAutomation`)
  }

  const item = await getContentItem(contentId, workspaceId)

  if (!item || item.status !== 'ready' || !item.transcript) {
    redirect(`/workspace/${workspaceId}/content/${contentId}`)
  }

  const keywords = await extractBrollKeywords(workspaceId, item.transcript)

  const firstKeyword = keywords[0] ?? item.title ?? 'lifestyle'
  const initialVideos = await searchPexelsVideos(firstKeyword, 9)

  return (
    <BrollClient
      workspaceId={workspaceId}
      contentId={contentId}
      initialKeywords={keywords}
      initialVideos={initialVideos}
    />
  )
}
