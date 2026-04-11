import { cn } from '@/lib/utils'

interface VideoUploadProgressProps {
  label: string
  percent?: number
  className?: string
}

export function VideoUploadProgress({ label, percent, className }: VideoUploadProgressProps) {
  const pct = typeof percent === 'number' ? Math.min(100, Math.max(0, percent)) : null

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {pct !== null ? <span>{pct}%</span> : null}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full bg-primary transition-all duration-300',
            pct === null && 'animate-pulse',
          )}
          style={{ width: pct !== null ? `${pct}%` : '100%' }}
        />
      </div>
    </div>
  )
}
