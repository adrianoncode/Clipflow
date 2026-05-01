import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading shell that matches the DEFAULT view of the Schedule page —
 * the Queue list, not the Calendar. The previous skeleton mocked a
 * 7×6 calendar grid, then the page swapped to a queue list on data
 * resolve — visible layout shift on every default-view load.
 *
 * Real layout: max-w-4xl wrapper, page header, view tabs, then a
 * stack of post-row cards.
 */
export default function ScheduleLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      {/* PageHeader: kicker + title + body + right-action */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>

      {/* View tabs (Queue / Calendar / Plan) */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>

      {/* Queue rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4"
          >
            <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5 rounded" />
              <Skeleton className="h-3 w-2/5 rounded" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
