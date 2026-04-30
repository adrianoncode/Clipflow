'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

/**
 * Premium 3D CTA — feels like a physical button, not a flat pill.
 *
 * Two layers of polish stacked:
 *
 *  STATIC — every button has these even when nothing is happening:
 *   1. Vertical brand-plum gradient (#0F0F0F → #1A1A1A) so the button
 *      reads as "lit from above"
 *   2. Inner top highlight (1 px white) for the lit upper corner
 *   3. Inner bottom shadow for the soft concavity at the lower edge
 *   4. 4-layer drop-shadow stack (hairline + close + ambient + halo)
 *      so the button sits above the page, not on it
 *   5. Specular bloom (radial white at the top, ~18% opacity)
 *
 *  INTERACTIVE — what fires when the cursor is on/over the button:
 *   6. Magnetic cursor pull — the button content slides up to ±4 px
 *      toward the cursor as you approach, springs back when you
 *      leave. Apple's product-card trick. The pull is on a useSpring
 *      with stiffness 220 / damping 18 so it feels physical.
 *   7. Cursor-tracked specular — a radial bright spot tracks the
 *      pointer position. The button looks like it's catching real
 *      light from the cursor. CSS variables --mx/--my expose the
 *      pointer position to a child gradient layer.
 *   8. Chartreuse glow-halo on hover — a soft outer glow ring at
 *      4 px / 6% opacity tells the eye "this is alive".
 *   9. One-shot lime shimmer sweep across the surface on hover.
 *  10. Active state — the lift collapses, an inner press-shadow
 *      appears at the top inside (key pushed in), ambient halo
 *      shrinks. The press-down state is what most "premium" buttons
 *      skip; every committed click should feel earned.
 */

type Variant = 'primary' | 'ghost'

type Common = {
  children: ReactNode
  variant?: Variant
  /** Make the button stretch its container (default true). */
  fullWidth?: boolean
  className?: string
}

type ButtonProps = Common & {
  as?: 'button'
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  href?: never
  external?: never
}

type AnchorProps = Common & {
  as: 'a'
  href: string
  external?: boolean
  onClick?: never
  type?: never
  disabled?: never
}

export type PremiumButtonProps = ButtonProps | AnchorProps

/** How far the button can pull toward the cursor, in px. */
const MAGNETIC_PULL = 4
/** How far inside the button the cursor-tracked specular peaks. */

export function PremiumButton(props: PremiumButtonProps) {
  const {
    children,
    variant = 'primary',
    fullWidth = true,
    className = '',
  } = props

  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement | null>(null)
  // Magnetic pull motion values — content shifts toward cursor.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(my, { stiffness: 220, damping: 18, mass: 0.4 })

  useEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const dx = (e.clientX - cx) / (r.width / 2)
      const dy = (e.clientY - cy) / (r.height / 2)
      mx.set(dx * MAGNETIC_PULL)
      my.set(dy * MAGNETIC_PULL)
      // Cursor-tracked specular position — fed to the radial gradient
      // child layer via CSS variables.
      const px = ((e.clientX - r.left) / r.width) * 100
      const py = ((e.clientY - r.top) / r.height) * 100
      el.style.setProperty('--cf-pbtn-mx', `${px}%`)
      el.style.setProperty('--cf-pbtn-my', `${py}%`)
    }
    const onLeave = () => {
      mx.set(0)
      my.set(0)
      el.style.setProperty('--cf-pbtn-mx', `50%`)
      el.style.setProperty('--cf-pbtn-my', `0%`)
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [mx, my, reduce])

  const baseClass = `cf-pbtn group/cta relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl px-4 text-[12.5px] font-bold leading-none tracking-tight ${
    fullWidth ? 'h-10 w-full' : 'h-10'
  } ${className}`

  const baseStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          background:
            'linear-gradient(180deg, #0F0F0F 0%, #1A1A1A 100%)',
          color: '#F4D93D',
          fontFamily:
            'var(--font-inter-tight), var(--font-inter), sans-serif',
          // Initialise the cursor-tracked variables so the specular
          // is centered above the button at rest.
          ['--cf-pbtn-mx' as string]: '50%',
          ['--cf-pbtn-my' as string]: '0%',
        }
      : {
          background:
            'linear-gradient(180deg, #FFFDF8 0%, #F1ECDF 100%)',
          color: '#0F0F0F',
          fontFamily:
            'var(--font-inter-tight), var(--font-inter), sans-serif',
          ['--cf-pbtn-mx' as string]: '50%',
          ['--cf-pbtn-my' as string]: '0%',
        }

  // Static specular bloom — soft top light, low opacity.
  const specularStyle: React.CSSProperties = {
    background:
      variant === 'primary'
        ? 'radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.18) 0%, transparent 55%)'
        : 'radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.85) 0%, transparent 55%)',
  }

  // Cursor-tracked specular — peaks where the cursor is.
  const cursorSpecularStyle: React.CSSProperties = {
    background:
      variant === 'primary'
        ? 'radial-gradient(80px circle at var(--cf-pbtn-mx) var(--cf-pbtn-my), rgba(214,255,62,0.30) 0%, transparent 70%)'
        : 'radial-gradient(80px circle at var(--cf-pbtn-mx) var(--cf-pbtn-my), rgba(15,15,15,0.18) 0%, transparent 70%)',
    opacity: 0,
    transition: 'opacity 0.25s ease',
  }

  // Hover sweep — single shimmer pass across the surface.
  const shimmerStyle: React.CSSProperties = {
    background:
      variant === 'primary'
        ? 'linear-gradient(115deg, transparent 35%, rgba(214,255,62,0.30) 50%, transparent 65%)'
        : 'linear-gradient(115deg, transparent 35%, rgba(15,15,15,0.20) 50%, transparent 65%)',
  }

  const inner = (
    <>
      {/* Static top specular bloom */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={specularStyle}
      />
      {/* Cursor-tracked specular — only visible on hover, peaks where pointer is */}
      <span
        aria-hidden
        className="cf-pbtn-cursor-spec pointer-events-none absolute inset-0 rounded-xl"
        style={cursorSpecularStyle}
      />
      {/* Hover shimmer sweep */}
      <span
        aria-hidden
        className="cf-pbtn-shimmer pointer-events-none absolute inset-0 -translate-x-[120%]"
        style={shimmerStyle}
      />
      {/* Magnetic-pulled content. Wrapping in a motion.span lets us
          spring the pull while the outer button retains its stable
          bounding box for the shadow stack. */}
      <motion.span
        className="relative z-10 inline-flex items-center justify-center gap-1.5"
        style={reduce ? undefined : { x: sx, y: sy }}
      >
        {children}
      </motion.span>

      <style jsx>{`
        .cf-pbtn {
          /* Rest state — multi-layer shadow stack:
             - inner top highlight (lit edge)
             - inner bottom shadow (soft concavity)
             - hairline + close + ambient drop */
          box-shadow: ${variant === 'primary'
            ? `
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            inset 0 -1px 0 rgba(0, 0, 0, 0.55),
            inset 0 -3px 6px -2px rgba(0, 0, 0, 0.4),
            0 1px 1px rgba(18, 9, 32, 0.45),
            0 4px 8px -2px rgba(18, 9, 32, 0.45),
            0 14px 28px -10px rgba(18, 9, 32, 0.35)`
            : `
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            inset 0 -1px 0 rgba(24, 21, 17, 0.10),
            inset 0 -3px 6px -2px rgba(24, 21, 17, 0.06),
            0 0 0 1px rgba(229, 221, 206, 0.95),
            0 1px 1px rgba(24, 21, 17, 0.06),
            0 4px 8px -2px rgba(24, 21, 17, 0.10),
            0 12px 24px -10px rgba(24, 21, 17, 0.10)`};
          transition: box-shadow 0.18s ease, transform 0.18s ease;
        }
        .cf-pbtn:hover {
          /* Hover — button lifts. Outer chartreuse glow ring fades
             in around the chassis to telegraph alive-ness. Cursor-
             tracked specular comes online. */
          transform: translateY(-1px);
          box-shadow: ${variant === 'primary'
            ? `
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            inset 0 -1px 0 rgba(0, 0, 0, 0.55),
            inset 0 -3px 6px -2px rgba(0, 0, 0, 0.4),
            0 1px 1px rgba(18, 9, 32, 0.50),
            0 8px 14px -2px rgba(18, 9, 32, 0.50),
            0 22px 38px -10px rgba(18, 9, 32, 0.45),
            0 0 0 4px rgba(214, 255, 62, 0.10),
            0 0 28px -2px rgba(214, 255, 62, 0.30)`
            : `
            inset 0 1px 0 rgba(255, 255, 255, 1),
            inset 0 -1px 0 rgba(24, 21, 17, 0.10),
            inset 0 -3px 6px -2px rgba(24, 21, 17, 0.06),
            0 0 0 1px rgba(207, 196, 175, 0.95),
            0 1px 1px rgba(24, 21, 17, 0.08),
            0 8px 14px -2px rgba(24, 21, 17, 0.14),
            0 18px 32px -10px rgba(24, 21, 17, 0.14),
            0 0 0 4px rgba(15, 15, 15, 0.05)`};
        }
        .cf-pbtn:hover .cf-pbtn-cursor-spec {
          opacity: 1;
        }
        .cf-pbtn:active {
          /* Active — collapse the lift, dim highlights, ambient
             halo shrinks. Inner press-shadow at the top reads as
             "key pushed in". */
          transform: translateY(1px);
          box-shadow: ${variant === 'primary'
            ? `
            inset 0 1px 0 rgba(255, 255, 255, 0.10),
            inset 0 -1px 0 rgba(0, 0, 0, 0.45),
            inset 0 2px 4px rgba(0, 0, 0, 0.45),
            0 1px 1px rgba(18, 9, 32, 0.30),
            0 2px 4px -1px rgba(18, 9, 32, 0.30)`
            : `
            inset 0 1px 0 rgba(255, 255, 255, 0.55),
            inset 0 -1px 0 rgba(24, 21, 17, 0.08),
            inset 0 2px 4px rgba(24, 21, 17, 0.08),
            0 0 0 1px rgba(207, 196, 175, 0.95),
            0 1px 1px rgba(24, 21, 17, 0.04)`};
          transition: box-shadow 0.05s ease, transform 0.05s ease;
        }
        .cf-pbtn:disabled {
          opacity: 0.55;
          transform: none;
          cursor: not-allowed;
        }
        .cf-pbtn:hover .cf-pbtn-shimmer {
          transform: translateX(120%);
          transition: transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .cf-pbtn .cf-pbtn-shimmer {
          transition: transform 0s;
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-pbtn,
          .cf-pbtn:hover,
          .cf-pbtn:active {
            transition: none;
            transform: none;
          }
          .cf-pbtn:hover .cf-pbtn-shimmer {
            transition: transform 0s;
            transform: translateX(120%);
          }
        }
      `}</style>
    </>
  )

  if (props.as === 'a') {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={props.href}
        className={baseClass}
        style={baseStyle}
        {...(props.external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {inner}
      </a>
    )
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      className={baseClass}
      style={baseStyle}
    >
      {inner}
    </button>
  )
}
