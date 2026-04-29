'use client'

import { useEffect, useId } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

interface RecentImportsRealtimeProps {
  workspaceId: string
}

/**
 * Workspace-wide live updater for the Recent-Imports-Strip on the
 * Library page. Subscribes to every content_items change in the
 * workspace and triggers `router.refresh()` so the strip re-renders
 * with the latest status. Pendant to RealtimeStatusWatcher (which is
 * scoped to a single contentId on the per-video detail page).
 *
 * Refresh cost is acceptable here because Library is server-rendered
 * with a single query. Heavy filtering happens client-side via the
 * bucket helper.
 */
export function RecentImportsRealtime({ workspaceId }: RecentImportsRealtimeProps) {
  const router = useRouter()
  // useId gives a stable per-component-instance id so multiple strips on
  // the same page (rare, but happens in dev previews / future side panels)
  // don't share a single Realtime channel — Supabase rejects re-adding
  // postgres_changes callbacks to a channel that's already subscribed.
  const instanceId = useId()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`recent-imports-${workspaceId}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_items',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [workspaceId, instanceId, router])

  return null
}
