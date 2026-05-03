import { Skeleton } from '@/components/ui/skeleton'

const CARD = {
  background: '#FFFDF8',
  border: '1px solid rgba(15,15,15,0.08)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
} as const

export default function SettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-8">
      <Skeleton className="h-3 w-40 rounded" />

      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[20px] p-5 space-y-3" style={CARD}>
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
