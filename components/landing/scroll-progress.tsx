'use client'

import { useEffect, useState } from 'react'

/**
 * Thin gradient progress bar fixed to the top of the viewport that fills
 * from 0 → 100 % as the user scrolls through the document. Apple-style
 * polish — nearly invisible until you notice it once, then it feels
 * inevitable.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const h = document.documentElement
      const scrolled = h.scrollTop
      const max = h.scrollHeight - h.clientHeight
      setProgress(max > 0 ? scrolled / max : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left"
      style={{
        background:
          'linear-gradient(90deg, #a855f7, #ec4899, #a855f7)',
        transform: `scaleX(${progress})`,
        transition: 'transform 0.1s linear',
      }}
    />
  )
}
