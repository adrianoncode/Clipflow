import { Skeleton } from '@/components/ui/skeleton'

const CARD = {
  background: '#FFFDF8',
  border: '1px solid rgba(15,15,15,0.08)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
} as const

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-10 w-56 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[20px] p-5 space-y-3" style={CARD}>
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="rounded-[20px] p-5 space-y-3" style={CARD}>
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>

      <div className="rounded-[20px] p-5 space-y-3" style={CARD}>
        <Skeleton className="h-5 w-32 rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
