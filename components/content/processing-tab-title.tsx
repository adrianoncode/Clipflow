'use client'

import { useEffect, useRef } from 'react'

import type { ContentItemListRow } from '@/lib/content/get-content-items'

interface ProcessingTabTitleProps {
  items: ContentItemListRow[]
}

/**
 * Slice 15 — browser tab-title hook for the Library page.
 *
 * While a content item is uploading or transcribing, the tab title gets
 * a "(N)" prefix so a user who's switched tabs sees that something is
 * still in flight. When everything finishes, the prefix flips to a "✓"
 * marker for ~6s then clears — long enough to catch a glance but short
 * enough not to stick around stale.
 *
 * No state hook — we mutate document.title directly, since it's a
 * browser-side side-effect that doesn't belong in React state. Reset
 * to the original title on unmount.
 */
export function ProcessingTabTitle({ items }: ProcessingTabTitleProps) {
  const original = useRef<string | null>(null)
  const wasActive = useRef<boolean>(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (original.current === null) original.current = document.title

    const activeCount = items.filter(
      (i) => i.status === 'uploading' || i.status === 'processing',
    ).length

    if (activeCount > 0) {
      wasActive.current = true
      document.title = `(${activeCount}) ${original.current}`
      if (flashTimer.current) {
        clearTimeout(flashTimer.current)
        flashTimer.current = null
      }
    } else if (wasActive.current) {
      // Just settled — flash a ✓ marker briefly so a user on another
      // tab notices their import landed without having to peek over.
      document.title = `✓ ${original.current}`
      wasActive.current = false
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => {
        if (original.current) document.title = original.current
        flashTimer.current = null
      }, 6_000)
    } else {
      document.title = original.current
    }
  }, [items])

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
      if (typeof document !== 'undefined' && original.current) {
        document.title = original.current
      }
    }
  }, [])

  return null
}
