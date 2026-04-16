import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel: string
  actionHref: string
  secondaryLabel?: string
  secondaryHref?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border/60 bg-muted/[0.06] py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary/30">
        <Icon className="h-7 w-7" />
      </div>
      <div className="max-w-md space-y-2 px-4">
        <p className="text-lg font-bold text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/25"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
        {secondaryLabel && secondaryHref && (
          <Link
            href={secondaryHref}
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  )
}
