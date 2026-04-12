'use client'

import { useState } from 'react'

import { ReviewCommentForm } from '@/components/review/review-comment-form'
import type { ReviewComment, ReviewOutput } from '@/lib/review/get-review-page-data'

interface ReviewOutputCardProps {
  output: ReviewOutput
  platformLabel: string
  comments: ReviewComment[]
  reviewLinkId: string
}

export function ReviewOutputCard({ output, platformLabel, comments, reviewLinkId }: ReviewOutputCardProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="rounded-lg border bg-card flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">{platformLabel}</h3>
      </div>

      <div className="p-4 flex-1">
        <div className="whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-3 text-sm leading-relaxed max-h-72 overflow-y-auto">
          {output.body ?? '(empty)'}
        </div>
      </div>

      {comments.length > 0 && (
        <div className="px-4 pb-2 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Comments</p>
          {comments.map((c) => (
            <div key={c.id} className="rounded-md border bg-muted/30 p-2 text-xs space-y-0.5">
              <p className="font-medium">{c.reviewer_name}</p>
              <p className="text-muted-foreground whitespace-pre-wrap">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 pt-2">
        {showForm ? (
          <ReviewCommentForm
            reviewLinkId={reviewLinkId}
            outputId={output.id}
            label={`Feedback on ${platformLabel}`}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
          >
            + Leave feedback
          </button>
        )}
      </div>
    </div>
  )
}
