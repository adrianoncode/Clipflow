'use client'

import { useEffect, useRef, useState } from 'react'

import { markGuideRead } from './progress-store'

/**
 * Top-of-viewport reading progress strip. Tracks how far the user has
 * scrolled through `<main>` (passed as a ref, but we just walk the DOM
 * to find the `<article>` tag — simpler than threading refs across the
 * shell). When the user crosses 80%, we mark the guide read so the
 * sidebar checkmark + path progress reflect it on next render.
 */
export function PlaybookProgressBar({ guideId }: { guideId: string }) {
  const [pct, setPct] = useState(0)
  const markedRef = useRef(false)

  useEffect(() => {
    const article = document.querySelector('article') as HTMLElement | null
    if (!article) return

    function update() {
      if (!article) return
      const rect = article.getBoundingClientRect()
      const totalScrollable = rect.height - window.innerHeight
      if (totalScrollable <= 0) {
        setPct(100)
        return
      }
      const scrolled = -rect.top
      const ratio = Math.max(0, Math.min(1, scrolled / totalScrollable))
      setPct(Math.round(ratio * 100))

      if (!markedRef.current && ratio >= 0.8) {
        markedRef.current = true
        markGuideRead(guideId)
      }
    }

    update()
    const onScroll = () => update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [guideId])

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-[3px]"
      style={{ background: 'transparent' }}
      aria-hidden
    >
      <div
        className="h-full transition-[width] duration-150 ease-out"
        style={{
          width: `${pct}%`,
          background:
            'linear-gradient(90deg, var(--lv2-accent), color-mix(in srgb, var(--lv2-accent) 70%, var(--lv2-primary)))',
          boxShadow: '0 0 12px rgba(214,255,62,.45)',
        }}
      />
    </div>
  )
}
