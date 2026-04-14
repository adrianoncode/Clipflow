'use client'

import { useEffect, useState } from 'react'

/**
 * Zero-dependency confetti burst. Generates ~40 small violet squares
 * that fall + drift with a fixed-position overlay. Respects
 * prefers-reduced-motion. Stops rendering after the animation finishes
 * so it doesn't bleed into screenshots or printing.
 */
export function LaunchConfetti() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(false)
      return
    }
    const t = setTimeout(() => setVisible(false), 4500)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  // Deterministic "random" so server + client match during hydration —
  // use a small seeded sequence instead of Math.random.
  const pieces = Array.from({ length: 40 }, (_, i) => {
    const left = (i * 137) % 100
    const delay = ((i * 37) % 1000) / 1000
    const duration = 2.4 + ((i * 11) % 14) / 10
    const size = 6 + ((i * 3) % 5)
    const rotate = (i * 23) % 360
    const drift = -20 + ((i * 7) % 40)
    // Palette is monochrome violet — varying opacity.
    const tones = [
      'rgba(124, 58, 237, 0.85)',
      'rgba(167, 139, 250, 0.85)',
      'rgba(124, 58, 237, 0.5)',
      'rgba(196, 181, 253, 0.85)',
    ]
    const color = tones[i % tones.length]
    return { i, left, delay, duration, size, rotate, drift, color }
  })

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      <style>{`
        @keyframes confetti-fall {
          from {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 1;
          }
          to {
            transform: translate3d(var(--drift, 0px), 110vh, 0) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      {pieces.map((p) => (
        <span
          key={p.i}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            ['--drift' as string]: `${p.drift}vw`,
          }}
        />
      ))}
    </div>
  )
}
