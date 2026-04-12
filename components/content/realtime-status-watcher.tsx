'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

interface RealtimeStatusWatcherProps {
  contentId: string
  workspaceId: string
}

/**
 * Subscribes to realtime changes on content_items for this specific row.
 * When status changes to 'ready' or 'failed', refreshes the page — replacing
 * the meta-refresh polling approach used in M3.
 */
export function RealtimeStatusWatcher({ contentId, workspaceId }: RealtimeStatusWatcherProps) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`content-status-${contentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_items',
          filter: `id=eq.${contentId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string }).status
          if (newStatus === 'ready' || newStatus === 'failed') {
            router.refresh()
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [contentId, router])

  return null
}
