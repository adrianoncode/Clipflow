import { Skeleton } from '@/components/ui/skeleton'

const CARD = {
  background: '#FFFDF8',
  border: '1px solid rgba(15,15,15,0.08)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
} as const

export default function PipelineLoading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            <Skeleton className="h-3 w-32 rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-[20px] p-4" style={CARD}>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-10 rounded" />
                </div>
                <Skeleton className="h-4 w-4/5 rounded" />
                <Skeleton className="h-3 w-3/5 rounded" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
