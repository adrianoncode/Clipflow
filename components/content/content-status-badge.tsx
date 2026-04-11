import { Badge } from '@/components/ui/badge'
import type { ContentStatus } from '@/lib/supabase/types'

interface ContentStatusBadgeProps {
  status: ContentStatus
}

const MAP: Record<
  ContentStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  uploading: { label: 'Uploading…', variant: 'secondary' },
  processing: { label: 'Transcribing…', variant: 'secondary' },
  ready: { label: 'Ready', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
}

export function ContentStatusBadge({ status }: ContentStatusBadgeProps) {
  const entry = MAP[status]
  return <Badge variant={entry.variant}>{entry.label}</Badge>
}
