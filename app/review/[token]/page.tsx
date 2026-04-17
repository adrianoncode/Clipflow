import { notFound } from 'next/navigation'

import { getReviewPageData } from '@/lib/review/get-review-page-data'
import { ReviewCommentForm } from '@/components/review/review-comment-form'
import { ReviewOutputCard } from '@/components/review/review-output-card'
import { PLATFORM_LONG_LABELS as PLATFORM_LABELS } from '@/lib/platforms'

export const dynamic = 'force-dynamic'

interface ReviewPageProps {
  params: { token: string }
}

export async function generateMetadata({ params: _params }: ReviewPageProps) {
  return { title: 'Review Drafts — Clipflow' }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const data = await getReviewPageData(params.token)
  if (!data) notFound()

  const { reviewLinkId, label, contentTitle, outputs, comments } = data

  // Group comments by output_id
  const commentsByOutput = new Map<string | null, typeof comments>()
  for (const c of comments) {
    const key = c.output_id ?? '__general__'
    if (!commentsByOutput.has(key)) commentsByOutput.set(key, [])
    commentsByOutput.get(key)!.push(c)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight">Clipflow</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">Client Review</span>
          </div>
          {contentTitle && (
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{contentTitle}</h1>
          )}
          {label && <p className="mt-1 text-sm text-muted-foreground">{label}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-8">
        {outputs.length === 0 ? (
          <p className="text-muted-foreground">No outputs have been generated yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {outputs.map((output) => (
              <ReviewOutputCard
                key={output.id}
                output={output}
                platformLabel={PLATFORM_LABELS[output.platform] ?? output.platform}
                comments={commentsByOutput.get(output.id) ?? []}
                reviewLinkId={reviewLinkId}
              />
            ))}
          </div>
        )}

        {/* General comment section */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-base font-semibold">General feedback</h2>
          {(commentsByOutput.get('__general__') ?? []).map((c) => (
            <div key={c.id} className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
              <p className="font-medium">{c.reviewer_name}</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
          <ReviewCommentForm reviewLinkId={reviewLinkId} outputId={null} label="Leave general feedback" />
        </div>
      </div>
    </div>
  )
}
