'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Inertia-smooth scrolling, the "Pitch / Linear / Stripe" default.
 *
 * We mount Lenis once at the top of the landing tree and let it hijack
 * the document scroll. Native scroll is restored automatically on
 * `prefers-reduced-motion` so a11y users don't fight the inertia.
 *
 * Intentionally landing-only: the authenticated app has several
 * scroll-snap + sticky-column regions (pipeline board, schedule
 * calendar) that fight with inertial scroll. Running Lenis globally
 * there trades polish for broken interactions — not worth it.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ease-out-expo
      smoothWheel: true,
      // Touch devices get native scroll — Lenis's touch handling is
      // decent but native iOS rubber-banding is still nicer.
      syncTouch: false,
    })

    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    let rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return null
}
