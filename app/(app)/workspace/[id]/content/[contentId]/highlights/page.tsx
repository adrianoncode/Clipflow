import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Sparkles } from 'lucide-react'

import { FindMomentsButton } from '@/components/highlights/find-moments-button'
import { HighlightsList } from '@/components/highlights/highlights-list'
import { PageHeading } from '@/components/workspace/page-heading'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { getContentItem } from '@/lib/content/get-content-item'
import { listHighlights } from '@/lib/highlights/list-highlights'

interface HighlightsPageProps {
  params: { id: string; contentId: string }
}

// Detection + rendering can be 30-60s; keep headroom.
export const maxDuration = 120
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: HighlightsPageProps) {
  const item = await getContentItem(params.contentId, params.id)
  return {
    title: item?.title ? `Viral moments · ${item.title}` : 'Viral moments',
  }
}

export default async function HighlightsPage({ params }: HighlightsPageProps) {
  const member = await requireWorkspaceMember(params.id)
  if (!member.ok) notFound()

  const item = await getContentItem(params.contentId, params.id)
  if (!item) notFound()

  const highlights = await listHighlights(params.contentId, params.id)

  const canEdit = member.role === 'owner' || member.role === 'editor'
  const hasTranscript = Boolean(item.transcript && item.transcript.trim().length >= 200)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      {/* Breadcrumb */}
      <nav
        className="flex flex-wrap items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link
          href={`/workspace/${params.id}`}
          className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          Content
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <Link
          href={`/workspace/${params.id}/content/${params.contentId}`}
          className="max-w-[220px] truncate rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          {item.title ?? 'Untitled'}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        <span className="rounded-md px-1.5 py-0.5 font-semibold text-foreground">
          Viral moments
        </span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading
          eyebrow="AI · Highlight clips"
          title={
            <span className="flex items-baseline gap-3">
              Viral moments.
              <Sparkles className="h-6 w-6 text-primary/40" aria-hidden />
            </span>
          }
          body={
            highlights.length === 0
              ? 'Let Clipflow scan the transcript and pick the 3–8 most postable 20–60s clips.'
              : `${highlights.length} clip${
                  highlights.length === 1 ? '' : 's'
                } · Highest-scoring first.`
          }
        />

        {canEdit && hasTranscript && (
          <FindMomentsButton
            workspaceId={params.id}
            contentId={params.contentId}
            hasExisting={highlights.length > 0}
          />
        )}
      </div>

      {!hasTranscript && (
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 text-sm text-amber-900">
          <p className="font-semibold">Transcript not ready yet</p>
          <p className="mt-1 text-xs opacity-80">
            Viral-moment detection needs the Whisper transcript. Head back to{' '}
            <Link
              href={`/workspace/${params.id}/content/${params.contentId}`}
              className="font-semibold underline"
            >
              the content page
            </Link>{' '}
            and wait for transcription to complete (or retry if it failed).
          </p>
        </div>
      )}

      <HighlightsList
        workspaceId={params.id}
        contentId={params.contentId}
        items={highlights}
        canEdit={canEdit}
      />
    </div>
  )
}
