'use client'

import Link from 'next/link'
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'

// Cursor-following lime blob anchored to the hero section. Spring-smoothed
// so it trails the pointer like a soft comet instead of snapping.
export function HeroSpotlight() {
  const reduce = useReducedMotion()
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const sx = useSpring(x, { stiffness: 80, damping: 18, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 80, damping: 18, mass: 0.6 })
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (reduce) return
    const host = ref.current?.parentElement
    if (!host) return
    const onMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect()
      x.set(e.clientX - r.left)
      y.set(e.clientY - r.top)
    }
    const onLeave = () => {
      x.set(-400)
      y.set(-400)
    }
    host.addEventListener('mousemove', onMove)
    host.addEventListener('mouseleave', onLeave)
    return () => {
      host.removeEventListener('mousemove', onMove)
      host.removeEventListener('mouseleave', onLeave)
    }
  }, [x, y, reduce])

  if (reduce) return null

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute z-0"
      style={{
        left: sx,
        top: sy,
        translateX: '-50%',
        translateY: '-50%',
        width: 520,
        height: 520,
        background:
          'radial-gradient(circle, rgba(214,255,62,0.55) 0%, rgba(214,255,62,0.18) 28%, rgba(214,255,62,0) 65%)',
        filter: 'blur(8px)',
        mixBlendMode: 'multiply',
      }}
    />
  )
}

// Kinetic H1. Per-word spring reveal; the italic accent word enters last
// with a slight overshoot; the lime highlight sweeps on after the final word.
export function KineticHeadline() {
  const reduce = useReducedMotion()

  const line = (words: Array<{ text: string; italic?: boolean }>, delay: number) => (
    <motion.span
      className="block"
      initial={reduce ? false : 'hidden'}
      animate="visible"
      transition={{ staggerChildren: 0.055, delayChildren: delay }}
      variants={{ hidden: {}, visible: {} }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          className={`inline-block ${w.italic ? 'italic' : ''}`}
          style={{ marginRight: '0.26em', willChange: 'transform, opacity, filter' }}
          variants={{
            hidden: { opacity: 0, y: '0.6em', filter: 'blur(6px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: w.italic
                ? { type: 'spring', stiffness: 220, damping: 14, mass: 0.9 }
                : { type: 'spring', stiffness: 260, damping: 22 },
            },
          }}
        >
          {w.text}
        </motion.span>
      ))}
    </motion.span>
  )

  return (
    <>
      {line([{ text: 'One' }, { text: 'recording.' }], 0.05)}
      {line([{ text: 'A\u00a0month', italic: true }, { text: 'of' }], 0.18)}
      <motion.span
        className="block"
        initial={reduce ? false : 'hidden'}
        animate="visible"
        transition={{ staggerChildren: 0.055, delayChildren: 0.32 }}
        variants={{ hidden: {}, visible: {} }}
      >
        <motion.span
          className="relative inline-block"
          style={{ marginRight: '0.26em', willChange: 'transform, opacity, filter' }}
          variants={{
            hidden: { opacity: 0, y: '0.6em', filter: 'blur(6px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: { type: 'spring', stiffness: 260, damping: 22 },
            },
          }}
        >
          <span className="relative z-10">posts.</span>
          <motion.span
            aria-hidden
            className="absolute bottom-1.5 left-0 right-0 z-0 h-4"
            style={{
              background: 'var(--lv2-accent)',
              transformOrigin: 'left',
              willChange: 'transform',
            }}
            initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, delay: reduce ? 0 : 0.75, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </motion.span>
      </motion.span>
    </>
  )
}

// Magnetic CTA. Pointer within a radius pulls the button toward the cursor
// with spring physics; a shine sweeps across on hover.
export function MagneticButton({ href, children }: { href: string; children: ReactNode }) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })
  const ref = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      const radius = 140
      if (dist < radius) {
        const k = (1 - dist / radius) * 0.35
        x.set(dx * k)
        y.set(dy * k)
      } else {
        x.set(0)
        y.set(0)
      }
    }
    const onLeave = () => {
      x.set(0)
      y.set(0)
    }
    window.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [x, y, reduce])

  return (
    <motion.div style={{ x: sx, y: sy, display: 'inline-block' }}>
      <Link ref={ref} href={href} className="lv2-btn-primary lv2-magnetic">
        <span className="lv2-magnetic-label">
          Start free — no card <span className="lv2-arrow">→</span>
        </span>
        <span aria-hidden className="lv2-magnetic-shine" />
      </Link>
    </motion.div>
  )
}

// Word-by-word reveal on viewport entry. Each word blur-fades up with a
// springy stagger; the first word leads, the rest chase. Meant for H2s
// so the scroll feels alive instead of a static wall of text.
export function WordReveal({
  text,
  className,
  as: Tag = 'span',
  accentWords = [],
}: {
  text: string
  className?: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
  accentWords?: string[]
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const words = text.split(' ')

  const setRef = (el: HTMLElement | null) => {
    ref.current = el
  }

  return (
    <Tag ref={setRef as never} className={className}>
      {words.map((w, i) => {
        const isAccent = accentWords.includes(w.replace(/[.,!?]/g, ''))
        return (
          <motion.span
            key={i}
            className={`inline-block ${isAccent ? 'italic' : ''}`}
            style={{ marginRight: '0.26em', willChange: 'transform, opacity, filter' }}
            initial={reduce ? false : { opacity: 0, y: '0.5em', filter: 'blur(6px)' }}
            animate={
              inView || reduce
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: '0.5em', filter: 'blur(6px)' }
            }
            transition={{
              type: 'spring',
              stiffness: isAccent ? 220 : 260,
              damping: isAccent ? 14 : 22,
              delay: reduce ? 0 : i * 0.05,
            }}
          >
            {w}
          </motion.span>
        )
      })}
    </Tag>
  )
}

// Magnetic wrapper around any CTA. Same physics as MagneticButton but
// generic — accepts arbitrary children so it works for ghost buttons,
// anchor tags, etc.
export function MagneticWrap({
  children,
  radius = 120,
  strength = 0.3,
}: {
  children: ReactNode
  radius?: number
  strength?: number
}) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.hypot(dx, dy)
      if (dist < radius) {
        const k = (1 - dist / radius) * strength
        x.set(dx * k)
        y.set(dy * k)
      } else {
        x.set(0)
        y.set(0)
      }
    }
    const onLeave = () => {
      x.set(0)
      y.set(0)
    }
    window.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [x, y, radius, strength, reduce])

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: 'inline-flex' }}>
      {children}
    </motion.div>
  )
}

// Top-of-page scroll progress rail. Scales X with document scroll; spring
// smoothing gives it that "liquid" feel instead of snapping frame-to-frame.
export function ScrollRail() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 })
  if (reduce) return null
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left"
      style={{
        scaleX,
        background:
          'linear-gradient(90deg, rgba(214,255,62,0) 0%, rgba(214,255,62,0.9) 18%, #D6FF3E 50%, rgba(214,255,62,0.9) 82%, rgba(214,255,62,0) 100%)',
        boxShadow: '0 0 12px rgba(214,255,62,.6)',
      }}
    />
  )
}

// Slot-machine-style digit roll. Drives a tens + ones column up to `to`
// once the node enters the viewport. Falls back to a static number under
// reduced motion so the final value is still legible.
export function FlipNumber({ to, className }: { to: number; className?: string }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(to)
      return
    }
    let raf = 0
    const start = performance.now()
    const dur = 1400
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - k, 4)
      setDisplay(Math.round(to * eased))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, reduce])

  const digits = String(Math.max(display, 0)).padStart(String(to).length, '0').split('')

  return (
    <span ref={ref} className={`lv2-tabular inline-flex ${className ?? ''}`} aria-label={String(to)}>
      {digits.map((d, i) => (
        <span
          key={i}
          className="relative inline-block overflow-hidden"
          style={{ width: '0.62em', height: '1em', lineHeight: 1 }}
        >
          <motion.span
            className="absolute inset-x-0"
            style={{ top: 0 }}
            animate={{ y: `-${Number(d)}em` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.9 }}
          >
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n} className="block text-center" style={{ height: '1em' }}>
                {n}
              </span>
            ))}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

// Tilt + shine wrapper suited for pricing cards. Tracks pointer position
// for a clamped perspective rotation and exposes CSS vars the shine layer
// reads to position its radial highlight.
export function PricingTilt({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const reduce = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 140, damping: 18 })
  const sry = useSpring(ry, { stiffness: 140, damping: 18 })
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width
      const ny = (e.clientY - r.top) / r.height
      el.style.setProperty('--mx', `${nx * 100}%`)
      el.style.setProperty('--my', `${ny * 100}%`)
      ry.set((nx - 0.5) * 8)
      rx.set(-(ny - 0.5) * 6)
    }
    const onLeave = () => {
      rx.set(0)
      ry.set(0)
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [rx, ry, reduce])

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformPerspective: 1200,
        transformStyle: 'preserve-3d',
        ...style,
      }}
      className={`lv2-tilt-card relative ${className ?? ''}`}
    >
      <span aria-hidden className="lv2-tilt-shine" />
      {children}
    </motion.div>
  )
}

// Applies perspective tilt to its children based on pointer position within
// the wrapper. Used on the hero visual stack so it feels physical.
export function TiltWrap({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 120, damping: 18 })
  const sry = useSpring(ry, { stiffness: 120, damping: 18 })
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
      ry.set(nx * 6)
      rx.set(-ny * 5)
    }
    const onLeave = () => {
      rx.set(0)
      ry.set(0)
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [rx, ry, reduce])

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformPerspective: 1100,
        transformStyle: 'preserve-3d',
      }}
      className="relative h-full w-full"
    >
      {children}
    </motion.div>
  )
}
