import { notFound } from 'next/navigation'

import { ContentDetailView } from '@/components/content/content-detail-view'
import { RealtimeStatusWatcher } from '@/components/content/realtime-status-watcher'
import { getContentItem } from '@/lib/content/get-content-item'
import { hasOutputs } from '@/lib/content/has-outputs'

/**
 * Force the page off the route cache so meta-refresh lands on a fresh
 * server render while transcription is in progress. (Simple for M3 —
 * swap for Realtime in M5.)
 */
export const dynamic = 'force-dynamic'

/**
 * Retries from the "failed" state run the Whisper pipeline again. Give
 * the platform the same 300s headroom as the new-content page so long
 * retries don't get cut off.
 */
export const maxDuration = 300

interface ContentItemPageProps {
  params: { id: string; contentId: string }
}

export async function generateMetadata({ params }: ContentItemPageProps) {
  const item = await getContentItem(params.contentId, params.id)
  return {
    title: item?.title ?? 'Content',
  }
}

export default async function ContentItemPage({ params }: ContentItemPageProps) {
  const item = await getContentItem(params.contentId, params.id)

  if (!item) {
    notFound()
  }

  const isPolling = item.status === 'uploading' || item.status === 'processing'
  const hasExistingOutputs =
    item.status === 'ready' ? await hasOutputs(params.contentId, params.id) : false

  return (
    <>
      {isPolling ? (
        // Realtime watcher replaces meta-refresh — no page flicker,
        // router.refresh() fires only when status actually changes.
        <RealtimeStatusWatcher contentId={item.id} workspaceId={params.id} />
      ) : null}
      <ContentDetailView
        item={item}
        workspaceId={params.id}
        hasExistingOutputs={hasExistingOutputs}
      />
    </>
  )
}
