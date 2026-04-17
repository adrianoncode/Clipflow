import { Badge } from '@/components/ui/badge'
import type { OutputState } from '@/lib/supabase/types'

interface OutputStateBadgeProps {
  state: OutputState | null
}

const MAP: Record<
  OutputState,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  review: { label: 'In review', variant: 'outline' },
  approved: { label: 'Approved', variant: 'default' },
  exported: { label: 'Published', variant: 'default' },
}

export function OutputStateBadge({ state }: OutputStateBadgeProps) {
  if (!state) {
    return <Badge variant="outline">No state</Badge>
  }
  const entry = MAP[state]
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}
