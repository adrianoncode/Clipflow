import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const formMessageVariants = cva(
  'rounded-xl border px-3.5 py-2.5 text-sm',
  {
    variants: {
      variant: {
        error: 'border-destructive/40 bg-destructive/10 text-destructive',
        success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
        info: 'border-border bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

export interface FormMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formMessageVariants> {}

export function FormMessage({ className, variant, children, ...props }: FormMessageProps) {
  if (!children) return null
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(formMessageVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  )
}
