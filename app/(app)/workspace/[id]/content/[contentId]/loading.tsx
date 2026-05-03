import { Skeleton } from '@/components/ui/skeleton'

const CARD = {
  background: '#FFFDF8',
  border: '1px solid rgba(15,15,15,0.08)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
} as const

export default function ContentDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-28 rounded" />
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-3 w-40 rounded" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="rounded-[20px] p-5 space-y-3" style={CARD}>
        <Skeleton className="h-4 w-24 rounded" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-3 rounded" style={{ width: `${75 + Math.random() * 25}%` }} />
        ))}
      </div>
      <Skeleton className="h-9 w-36 rounded-full" />
    </div>
  )
}
