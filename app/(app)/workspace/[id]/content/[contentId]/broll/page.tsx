export const dynamic = 'force-dynamic'
export const metadata = { title: 'B-Roll' }

import { redirect } from 'next/navigation'

import { BrollClient } from '@/components/content/broll-client'
import { getContentItem } from '@/lib/content/get-content-item'
import { extractBrollKeywords } from '@/lib/broll/extract-broll-keywords'
import { searchPexelsVideos } from '@/lib/broll/search-pexels'

interface BrollPageProps {
  params: { id: string; contentId: string }
}

export default async function BrollPage({ params }: BrollPageProps) {
  const { id: workspaceId, contentId } = params

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
