'use client'

import { useEffect, useRef, useState } from 'react'

interface RevealProps {
  children: React.ReactNode
  /** Delay the reveal by N ms after it enters view. */
  delay?: number
  /** Optional className forwarded to the wrapper element. */
  className?: string
  /** How far to translate-up while hidden. Default 16px. */
  distance?: number
  /** Duration of the fade-in transition in ms. Default 700. */
  duration?: number
}

/**
 * Single-fire scroll-reveal: fades + slides its children into view the
 * first time ≥ 10 % of the element intersects the viewport, then
 * disconnects the observer.
 *
 * Keeps motion restraint intentional — Apple-level landing pages earn
 * their premium feel partly by using this *sparingly*, not stacking
 * 5 different transitions.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
  distance = 16,
  duration = 700,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced-motion preference: flip to visible immediately
    // so content is never hidden behind a non-running animation.
    const mq = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
    if (mq?.matches) {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        transitionDelay: `${delay}ms`,
        willChange: visible ? undefined : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
