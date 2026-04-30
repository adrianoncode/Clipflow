'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import { ReviewCommentForm } from '@/components/review/review-comment-form'
import type { ReviewComment, ReviewOutput } from '@/lib/review/get-review-page-data'

interface ReviewOutputCardProps {
  output: ReviewOutput
  platformLabel: string
  comments: ReviewComment[]
  reviewLinkId: string
}

export function ReviewOutputCard({
  output,
  platformLabel,
  comments,
  reviewLinkId,
}: ReviewOutputCardProps) {
  const [showForm, setShowForm] = useState(false)
  const [recentlySent, setRecentlySent] = useState(false)

  // Collapses the form shortly after the server confirms the comment
  // was saved. Keeps the green "Feedback sent" state up long enough to
  // read, then snaps back to the clean "+ Leave feedback" affordance so
  // the card doesn't sit open with a stale form. The Next revalidate
  // will have re-rendered with the new comment in the list by then.
  function handleSent() {
    setRecentlySent(true)
    window.setTimeout(() => {
      setShowForm(false)
      setRecentlySent(false)
    }, 1800)
  }

  return (
    <div
      className="flex flex-col rounded-2xl border"
      style={{ borderColor: '#E5DDCE', background: '#FFFDF8' }}
    >
      <div className="border-b px-4 py-3" style={{ borderColor: '#E5DDCE' }}>
        <p
          className="font-bold text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: '#7c7468' }}
        >
          Platform
        </p>
        <h3 className="mt-0.5 text-sm font-bold" style={{ color: '#181511' }}>
          {platformLabel}
        </h3>
      </div>

      <div className="flex-1 p-4">
        <div
          className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border p-3 text-sm leading-relaxed"
          style={{ borderColor: '#E5DDCE', background: '#F3EDE3', color: '#181511' }}
        >
          {output.body ?? '(empty)'}
        </div>
      </div>

      {comments.length > 0 && (
        <div className="space-y-2 px-4 pb-2">
          <p
            className="font-bold text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: '#7c7468' }}
          >
            Comments
          </p>
          {comments.map((c) => (
            <div
              key={c.id}
              className="space-y-0.5 rounded-xl border p-2.5 text-xs"
              style={{ borderColor: '#E5DDCE', background: '#F3EDE3' }}
            >
              <p className="font-semibold" style={{ color: '#181511' }}>
                {c.reviewer_name}
              </p>
              <p className="whitespace-pre-wrap" style={{ color: '#7c7468' }}>
                {c.body}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 pt-2">
        {showForm ? (
          recentlySent ? (
            <p
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold"
              style={{
                borderColor: '#0F6B4D',
                background: '#E6F4EE',
                color: '#0F6B4D',
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Feedback sent
            </p>
          ) : (
            <ReviewCommentForm
              reviewLinkId={reviewLinkId}
              outputId={output.id}
              label={`Feedback on ${platformLabel}`}
              onSent={handleSent}
            />
          )
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold underline-offset-4 hover:underline"
            style={{ color: '#0F0F0F' }}
          >
            + Leave feedback
          </button>
        )}
      </div>
    </div>
  )
}
