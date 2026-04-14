'use client'

import { useRef } from 'react'
import type { MouseEvent } from 'react'

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  /** Color of the spotlight halo. Defaults to violet. */
  color?: string
  /** Radius of the spotlight in px. */
  size?: number
}

/**
 * Wraps its children with a radial-gradient halo that follows the cursor
 * on hover. The effect is rendered into a single absolutely-positioned
 * layer so it doesn't re-render on every mouse move — only CSS custom
 * properties update. Works inside any positioned parent.
 *
 * Use this around BentoCards, pricing plans, feature blocks — anywhere
 * the user lingers. Don't apply to dense grids (noisy).
 */
export function SpotlightCard({
  children,
  className = '',
  color = 'rgba(124, 58, 237, 0.15)',
  size = 500,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    node.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    node.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={`group relative ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), ${color}, transparent 45%)`,
        }}
      />
      {children}
    </div>
  )
}
