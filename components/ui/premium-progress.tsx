'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Progress bar that doesn't read as shadcn boilerplate. Replaces the
 * common Tailwind pattern of `<div h-2 bg-muted><div bg-primary
 * style={{width: X}}>` with:
 *
 *   - Track with an inset top-shadow + warm-paper bg, so the bar
 *     reads as etched into the card surface, not pasted on
 *   - Fill in a plum→chartreuse gradient with an inner top highlight
 *     (lit-from-above) and a soft drop-glow under it (the bar has
 *     real altitude over the track)
 *   - Animated shimmer-sweep that fires once whenever the value
 *     changes — the eye catches the motion and clocks the new
 *     percentage without you needing a number label
 *   - Spring-tuned width transition so growth feels physical, not
 *     a robotic linear interpolation
 *
 * Optional indeterminate mode: a slim chartreuse comet orbits the
 * track for "we're working on it" states.
 */

interface PremiumProgressProps {
  /** Current value, 0–max. */
  value: number
  /** Max value. Default 100. */
  max?: number
  /** Track height in px. Default 8. */
  height?: number
  /** Indeterminate spinner mode. Ignores `value`. */
  indeterminate?: boolean
  /** Aria label for screen readers. */
  label?: string
  className?: string
}

export function PremiumProgress({
  value,
  max = 100,
  height = 8,
  indeterminate = false,
  label,
  className = '',
}: PremiumProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const [shimmerKey, setShimmerKey] = useState(0)
  const lastValueRef = useRef(value)

  // When value increases, fire a one-shot shimmer sweep across the
  // bar so the eye catches the change.
  useEffect(() => {
    if (value > lastValueRef.current) {
      setShimmerKey((k) => k + 1)
    }
    lastValueRef.current = value
  }, [value])

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : value}
      className={`cf-pprog relative overflow-hidden rounded-full ${className}`}
      style={{
        height,
        // Track — warm paper inset, slight darken at top inside so
        // the rail reads as etched, not flat.
        background: 'rgba(15, 15, 15, 0.08)',
        boxShadow:
          'inset 0 1px 2px rgba(15, 15, 15, 0.18), inset 0 -1px 0 rgba(255, 255, 255, 0.55)',
      }}
    >
      {/* Fill — plum→chartreuse gradient, lit-from-above */}
      {!indeterminate ? (
        <div
          className="cf-pprog-fill relative h-full overflow-hidden rounded-full"
          style={{
            width: `${pct}%`,
            background:
              'linear-gradient(90deg, #0F0F0F 0%, #4B0FB8 60%, #D6FF3E 140%)',
            boxShadow:
              'inset 0 1px 0 rgba(255, 255, 255, 0.30), inset 0 -1px 0 rgba(18, 9, 32, 0.55), 0 0 6px -1px rgba(214, 255, 62, 0.35)',
            transition:
              'width 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Soft top specular highlight on the fill itself — adds the
              real "polished bead of progress" feel. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
            style={{
              background:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.20) 0%, transparent 100%)',
            }}
          />
          {/* Shimmer sweep — re-keys on value increase so React
              re-mounts and the animation replays from the start. */}
          {pct > 0 ? (
            <span
              key={shimmerKey}
              aria-hidden
              className="cf-pprog-sweep pointer-events-none absolute inset-y-0 -left-[40%] w-[40%]"
              style={{
                background:
                  'linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%)',
              }}
            />
          ) : null}
        </div>
      ) : (
        // Indeterminate — chartreuse comet orbits the track
        <span
          aria-hidden
          className="cf-pprog-comet absolute inset-y-0 left-0 w-1/3 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, #4B0FB8 30%, #D6FF3E 100%)',
            boxShadow: '0 0 12px rgba(214, 255, 62, 0.55)',
          }}
        />
      )}

      <style jsx>{`
        @keyframes cf-pprog-sweep {
          0% { transform: translateX(0%); }
          100% { transform: translateX(350%); }
        }
        .cf-pprog-sweep {
          animation: cf-pprog-sweep 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) 1;
        }
        @keyframes cf-pprog-comet {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .cf-pprog-comet {
          animation: cf-pprog-comet 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-pprog-fill { transition: none; }
          .cf-pprog-sweep, .cf-pprog-comet { animation: none; }
        }
      `}</style>
    </div>
  )
}
