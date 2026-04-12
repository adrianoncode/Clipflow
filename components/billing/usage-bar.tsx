import { cn } from '@/lib/utils'

interface UsageBarProps {
  label: string
  used: number
  limit: number
  unlimited: boolean
}

export function UsageBar({ label, used, limit, unlimited }: UsageBarProps) {
  const pct = unlimited ? 0 : Math.min((used / limit) * 100, 100)
  const danger = pct >= 90

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {unlimited ? (
            <span className="text-xs">Unlimited</span>
          ) : (
            <>
              <span className={cn('font-semibold', danger && 'text-destructive')}>{used}</span>
              <span> / {limit}</span>
            </>
          )}
        </span>
      </div>
      {!unlimited ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', danger ? 'bg-destructive' : 'bg-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
