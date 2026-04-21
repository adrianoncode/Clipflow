'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

interface CaptionTypewriterProps {
  lines: string[]
  /** ms per character during the type-on phase */
  typeSpeed?: number
  /** ms per character during the delete phase */
  deleteSpeed?: number
  /** ms to hold a fully-typed line before starting to delete */
  holdMs?: number
  className?: string
}

/**
 * Caption-typing animation under the hero headline.
 *
 * Cycles through a list of example captions: types each one in, holds
 * for a beat, then deletes it and moves to the next. A blinking cursor
 * gives it the "this is a real person drafting a hook" vibe without
 * any actual text generation happening.
 *
 * Respects prefers-reduced-motion by showing just the first line
 * statically (with a still cursor).
 */
export function CaptionTypewriter({
  lines,
  typeSpeed = 42,
  deleteSpeed = 18,
  holdMs = 1800,
  className = '',
}: CaptionTypewriterProps) {
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(lines[0] ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (reduce || lines.length === 0) return

    let lineIdx = 0
    let charIdx = 0
    let mode: 'typing' | 'holding' | 'deleting' = 'typing'
    let active = true

    function tick() {
      if (!active) return
      const currentLine = lines[lineIdx] ?? ''

      if (mode === 'typing') {
        charIdx++
        setDisplay(currentLine.slice(0, charIdx))
        if (charIdx >= currentLine.length) {
          mode = 'holding'
          timerRef.current = setTimeout(tick, holdMs)
          return
        }
        timerRef.current = setTimeout(tick, typeSpeed + Math.random() * 40)
        return
      }

      if (mode === 'holding') {
        mode = 'deleting'
        timerRef.current = setTimeout(tick, deleteSpeed)
        return
      }

      // deleting
      charIdx--
      setDisplay(currentLine.slice(0, Math.max(0, charIdx)))
      if (charIdx <= 0) {
        lineIdx = (lineIdx + 1) % lines.length
        mode = 'typing'
        charIdx = 0
        timerRef.current = setTimeout(tick, 280)
        return
      }
      timerRef.current = setTimeout(tick, deleteSpeed)
    }

    // Start the first line from empty so the initial type-in is
    // visible rather than jumping in half-written.
    setDisplay('')
    timerRef.current = setTimeout(tick, 600)

    return () => {
      active = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [lines, typeSpeed, deleteSpeed, holdMs, reduce])

  return (
    <span className={className}>
      <span>{display}</span>
      <span
        aria-hidden
        className="caption-typewriter-cursor inline-block align-middle"
        style={{
          width: '0.08em',
          height: '1em',
          marginLeft: '0.08em',
          background: 'currentColor',
          verticalAlign: '-0.12em',
          animation: reduce ? 'none' : 'caption-typewriter-blink 1s steps(1) infinite',
        }}
      />
      <style jsx>{`
        @keyframes caption-typewriter-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </span>
  )
}
