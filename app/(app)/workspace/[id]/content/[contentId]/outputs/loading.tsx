import { Skeleton } from '@/components/ui/skeleton'

const CARD = {
  background: '#FFFDF8',
  border: '1px solid rgba(15,15,15,0.08)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
} as const

export default function OutputsLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-3 w-48 rounded" />
        </div>
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-[20px] p-5" style={CARD}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-44 rounded" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-36 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-12 rounded-full" />
              <Skeleton className="h-7 w-14 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
