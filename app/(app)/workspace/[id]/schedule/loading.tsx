import { Skeleton } from '@/components/ui/skeleton'

export default function ScheduleLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-10 w-56 rounded-xl" />
      </div>

      {/* Month switcher + view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* 7×6 calendar grid */}
      <div className="rounded-2xl border border-border/50 bg-card p-3">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}
