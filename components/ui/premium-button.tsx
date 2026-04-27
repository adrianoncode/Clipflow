'use client'

import type { ReactNode } from 'react'

/**
 * Premium 3D CTA — feels like a physical button, not a flat pill.
 *
 * The recipe (kept restrained, no orbiting beams):
 *   1. Vertical gradient — top is lighter than the bottom so the
 *      button reads as "lit from above" rather than a flat tile.
 *   2. Inner top highlight (1 px white) carves the upper edge into
 *      a real lit corner.
 *   3. Inner bottom shadow gives the bottom edge a soft concavity —
 *      you can feel where the surface curves under.
 *   4. Stacked drop shadows (1 px hairline + 4 px close + 14 px
 *      ambient + 28 px halo) build real depth — the button sits
 *      above the page, not on top of it.
 *   5. Specular bloom (radial white at the top, only ~18% opacity)
 *      simulates a soft light source. Subtle enough to read as
 *      texture, not a glow billboard.
 *   6. Hover: the close + ambient shadows grow (the button lifts
 *      higher) and a soft lime shimmer sweeps once across.
 *   7. Active: the lift collapses, top highlight dims slightly —
 *      reads as a real click-down.
 *
 * The press-down state is the part most "premium" buttons skip and
 * the part that actually makes them feel real. Every interactive
 * frame has a corresponding tactile commit.
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

export function PremiumButton(props: PremiumButtonProps) {
  const {
    children,
    variant = 'primary',
    fullWidth = true,
    className = '',
  } = props

  const baseClass = `cf-pbtn group/cta relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl px-4 text-[12.5px] font-bold leading-none tracking-tight ${
    fullWidth ? 'h-10 w-full' : 'h-10'
  } ${className}`

  // Two state-aware shadow stacks. The :hover and :active swaps
  // happen via the styled-jsx block below so the transitions can
  // animate the depth properly.
  const baseStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          // Brand plum gradient — same palette as the landing's
          // lv2-btn-primary (#2A1A3D → #120920). Foreground swaps to
          // chartreuse so the click reads as "brand action", not as
          // a generic dark-pill.
          background:
            'linear-gradient(180deg, #3F2A57 0%, #120920 100%)',
          color: '#D6FF3E',
          fontFamily:
            'var(--font-inter-tight), var(--font-inter), sans-serif',
        }
      : {
          background:
            'linear-gradient(180deg, #FFFDF8 0%, #F1ECDF 100%)',
          color: '#2A1A3D',
          fontFamily:
            'var(--font-inter-tight), var(--font-inter), sans-serif',
        }

  // The specular bloom layer — soft radial white at the top that
  // simulates a light source. Subtle (16-18% opacity).
  const specularStyle: React.CSSProperties = {
    background:
      variant === 'primary'
        ? 'radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.18) 0%, transparent 55%)'
        : 'radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.85) 0%, transparent 55%)',
  }

  // Single shimmer sweep — fires once on hover, no orbit drama.
  const shimmerStyle: React.CSSProperties = {
    background:
      variant === 'primary'
        ? 'linear-gradient(115deg, transparent 35%, rgba(214,255,62,0.22) 50%, transparent 65%)'
        : 'linear-gradient(115deg, transparent 35%, rgba(42,26,61,0.16) 50%, transparent 65%)',
  }

  const inner = (
    <>
      {/* Top specular bloom */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={specularStyle}
      />
      {/* Hover shimmer sweep */}
      <span
        aria-hidden
        className="cf-pbtn-shimmer pointer-events-none absolute inset-0 -translate-x-[120%]"
        style={shimmerStyle}
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
        {children}
      </span>

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
          /* Hover — button lifts off the page. Translate -1 px and
             grow the close + ambient drops; top inner highlight
             brightens slightly so the lit edge reads stronger. */
          transform: translateY(-1px);
          box-shadow: ${variant === 'primary'
            ? `
            inset 0 1px 0 rgba(255, 255, 255, 0.24),
            inset 0 -1px 0 rgba(0, 0, 0, 0.55),
            inset 0 -3px 6px -2px rgba(0, 0, 0, 0.4),
            0 1px 1px rgba(18, 9, 32, 0.50),
            0 8px 14px -2px rgba(18, 9, 32, 0.50),
            0 22px 38px -10px rgba(18, 9, 32, 0.45),
            0 0 0 4px rgba(214, 255, 62, 0.06)`
            : `
            inset 0 1px 0 rgba(255, 255, 255, 1),
            inset 0 -1px 0 rgba(24, 21, 17, 0.10),
            inset 0 -3px 6px -2px rgba(24, 21, 17, 0.06),
            0 0 0 1px rgba(207, 196, 175, 0.95),
            0 1px 1px rgba(24, 21, 17, 0.08),
            0 8px 14px -2px rgba(24, 21, 17, 0.14),
            0 18px 32px -10px rgba(24, 21, 17, 0.14)`};
        }
        .cf-pbtn:active {
          /* Active — collapse the lift, dim the top highlight. The
             ambient halo also shrinks so it reads as "pressed in". */
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
