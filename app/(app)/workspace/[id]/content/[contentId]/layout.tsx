import { notFound } from 'next/navigation'

import { CreateStepper } from '@/components/create/create-stepper'
import { PerVideoHeader } from '@/components/content/per-video-header'
import { PerVideoTabNav } from '@/components/content/per-video-tab-nav'
import { getContentItem } from '@/lib/content/get-content-item'

interface ContentLayoutProps {
  children: React.ReactNode
  params: { id: string; contentId: string }
}

/**
 * Shared chassis for the Per-Video pages (Source / Highlights / Drafts).
 *
 * Before this each child page rendered its own Stepper + breadcrumb +
 * page heading + ad-hoc back link, and they drifted apart visually. The
 * layout owns the chassis; each child renders just its tab body.
 *
 * Width is `max-w-5xl` — chosen as the widest of the three legacy pages
 * (outputs was 5xl, highlights 4xl, source 3xl). Drafts and Highlights
 * both benefit from the wider canvas; Source content is stable narrower
 * but the breathing room reads premium, not empty.
 *
 * `getContentItem` is React-cached so children that need the item fetch
 * the same row without an extra round-trip.
 */
export default async function ContentLayout({
  children,
  params,
}: ContentLayoutProps) {
  const item = await getContentItem(params.contentId, params.id)
  if (!item) notFound()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <CreateStepper workspaceId={params.id} contentId={params.contentId} />
      <PerVideoHeader item={item} workspaceId={params.id} />
      <PerVideoTabNav workspaceId={params.id} contentId={params.contentId} />
      {children}
    </div>
  )
}
