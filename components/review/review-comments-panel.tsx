import type { InternalReviewComment } from '@/lib/review/get-review-comments-for-content'
import { PLATFORM_LONG_LABELS as PLATFORM_LABELS } from '@/lib/platforms'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

interface ReviewCommentsPanelProps {
  comments: InternalReviewComment[]
}

export function ReviewCommentsPanel({ comments }: ReviewCommentsPanelProps) {
  if (comments.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">
        Review comments
        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
          {comments.length}
        </span>
      </h3>
      <ul className="space-y-2">
        {comments.map((comment) => (
          <li
            key={comment.id}
            className="rounded-lg border bg-card p-4 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.reviewer_name}</span>
                {comment.reviewer_email && (
                  <span className="text-xs text-muted-foreground">{comment.reviewer_email}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {comment.output_platform && (
                  <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                    {PLATFORM_LABELS[comment.output_platform] ?? comment.output_platform}
                  </span>
                )}
                {!comment.output_platform && (
                  <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                    General
                  </span>
                )}
                {comment.link_label && (
                  <span className="text-xs text-muted-foreground">· {comment.link_label}</span>
                )}
                <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
              </div>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{comment.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
