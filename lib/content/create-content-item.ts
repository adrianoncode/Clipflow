import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { ContentKind, ContentStatus, Json } from '@/lib/supabase/types'

export interface CreateContentItemInput {
  workspaceId: string
  kind: ContentKind
  title: string | null
  status: ContentStatus
  transcript?: string | null
  sourceUrl?: string | null
  metadata?: Json
  createdBy: string
  projectId?: string | null
}

export type CreateContentItemResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

/**
 * Shared insert helper for both the video upload flow (step 1) and the
 * text input flow. Exists so both callers stay in sync on defaults and
 * future metadata columns only need to be added in one place.
 */
export async function createContentItem(
  input: CreateContentItemInput,
): Promise<CreateContentItemResult> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_items')
    .insert({
      workspace_id: input.workspaceId,
      project_id: input.projectId ?? null,
      kind: input.kind,
      status: input.status,
      title: input.title,
      source_url: input.sourceUrl ?? null,
      transcript: input.transcript ?? null,
      metadata: input.metadata ?? {},
      created_by: input.createdBy,
    })
    .select('id')
    .single()

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error('[createContentItem]', error?.message ?? 'unknown error')
    return { ok: false, error: 'Could not create content item.' }
  }

  return { ok: true, id: data.id }
}
