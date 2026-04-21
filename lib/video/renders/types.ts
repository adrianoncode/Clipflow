import type {
  RenderKind,
  RenderPriority,
  RenderProvider,
  RenderStatus,
} from '@/lib/supabase/types'

/** Shape of a renders row returned from Supabase. Safe to import in client components. */
export interface RenderRow {
  id: string
  workspace_id: string
  content_id: string | null
  kind: RenderKind
  provider: RenderProvider
  provider_render_id: string | null
  status: RenderStatus
  priority: RenderPriority
  url: string | null
  error: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

const KIND_LABELS: Record<RenderKind, string> = {
  burn_captions: 'Burn captions',
  assemble_broll: 'Assemble B-Roll',
  branded_video: 'Branded video',
  clip: 'Clip',
  batch_clip: 'Batch clip',
  reframe: 'Reframe',
  subtitles: 'Subtitles',
  avatar: 'Avatar',
  dub: 'Auto-dub',
  faceless: 'Faceless',
}

export function formatRenderKind(kind: RenderKind): string {
  return KIND_LABELS[kind]
}
