import { notFound } from 'next/navigation'

import { ContentDetailView } from '@/components/content/content-detail-view'
import { RealtimeStatusWatcher } from '@/components/content/realtime-status-watcher'
import { getContentItem } from '@/lib/content/get-content-item'
import { getSignedUrl } from '@/lib/content/get-signed-url'
import { hasOutputs } from '@/lib/content/has-outputs'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { createClient } from '@/lib/supabase/server'

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

  const needsSignedUrl =
    item.kind === 'video' &&
    item.source_url != null &&
    !item.source_url.startsWith('http')

  // The output-count query used to run sequentially after the main
  // Promise.all, adding one RTT to every content-detail page load when
  // outputs exist. Fold it in — the query is cheap (index-only count)
  // and we just ignore the result when hasExistingOutputs=false.
  const supabase = createClient()
  const [hasExistingOutputs, signedUrl, currentPlan, outputCountResult] =
    await Promise.all([
      item.status === 'ready'
        ? hasOutputs(params.contentId, params.id)
        : Promise.resolve(false),
      needsSignedUrl ? getSignedUrl(item.source_url!) : Promise.resolve(null),
      getWorkspacePlan(params.id),
      item.status === 'ready'
        ? supabase
            .from('outputs')
            .select('id', { count: 'exact', head: true })
            .eq('content_id', params.contentId)
            .eq('workspace_id', params.id)
        : Promise.resolve({ count: 0 }),
    ])

  const outputCount = hasExistingOutputs ? outputCountResult.count ?? 0 : 0

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
        outputCount={outputCount}
        signedUrl={signedUrl ?? undefined}
        currentPlan={currentPlan}
      />
    </>
  )
}
