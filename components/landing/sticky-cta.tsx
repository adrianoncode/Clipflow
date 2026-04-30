'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'

/**
 * Floating "Start free" button that appears after the user scrolls
 * past the hero and hides when they enter the pricing or footer area
 * — the pricing block already has its own in-flow CTAs, so a hovering
 * duplicate would just create visual noise and two CTAs competing for
 * attention.
 *
 * Placement is bottom-right, small, non-occluding. On reduced motion
 * we drop the entrance transition and just toggle display.
 */
interface StickyCtaProps {
  href: string
}

export function StickyCta({ href }: StickyCtaProps) {
  const reduce = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      const scrollY = window.scrollY
      const viewH = window.innerHeight

      // Show once the user has scrolled past the hero (~viewport height).
      const past = scrollY > viewH * 0.9

      // Hide near pricing/footer so we're not stacked on top of their
      // own CTAs. We anchor off the #pricing section when present.
      const pricing = document.getElementById('pricing')
      const pricingTop = pricing?.getBoundingClientRect().top ?? Infinity
      const nearPricing = pricingTop < viewH * 0.8

      setVisible(past && !nearPricing)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Link
      href={href}
      aria-label="Start free"
      className="group fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold shadow-lg sm:bottom-7 sm:right-7"
      style={{
        background: 'var(--lv2-primary)',
        color: 'var(--lv2-accent)',
        boxShadow:
          '0 12px 36px -14px rgba(15,15,15,.5), 0 0 0 4px rgba(214,255,62,.15)',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(.9)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: reduce
          ? 'opacity .2s ease'
          : 'transform .4s cubic-bezier(.2,.8,.2,1), opacity .3s ease',
      }}
    >
      <span
        aria-hidden
        className="flex h-5 w-5 items-center justify-center rounded-full"
        style={{ background: 'var(--lv2-accent)' }}
      >
        <span
          className="block h-2 w-2 rounded-[2px]"
          style={{ background: 'var(--lv2-primary)' }}
        />
      </span>
      Start free
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
