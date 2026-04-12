import { Skeleton } from '@/components/ui/skeleton'

export default function ContentDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="rounded-lg border p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${75 + Math.random() * 25}%` }} />
        ))}
      </div>
      <Skeleton className="h-9 w-36" />
    </div>
  )
}
