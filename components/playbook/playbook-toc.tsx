'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

import type { GuideSection } from '@/lib/landing/playbook-types'

/**
 * Sticky right-rail TOC with active-section highlight + estimated
 * time remaining (counts down as the user scrolls past sections).
 *
 * Degrades gracefully when there are fewer than 3 sections — short
 * guides don't need a TOC.
 */
export function PlaybookToc({
  sections,
  totalReadMinutes,
}: {
  sections: GuideSection[]
  totalReadMinutes: number
}) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null)

  useEffect(() => {
    if (typeof window === 'undefined' || sections.length < 3) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  if (sections.length < 3) return null

  // Per-section minute estimate, divided proportionally from the total.
  // Then roll up "minutes remaining from active section to the end" as a
  // friendlier signal than just % scrolled.
  const perSection = Math.max(1, Math.round(totalReadMinutes / sections.length))
  const activeIdx = Math.max(0, sections.findIndex((s) => s.id === activeId))
  const minutesLeft = Math.max(0, (sections.length - activeIdx) * perSection)

  return (
    <aside className="sticky top-[88px] hidden self-start lg:block">
      <p
        className="lv2-mono mb-3 text-[10px] font-bold uppercase tracking-[0.16em]"
        style={{ color: 'var(--lv2-muted)' }}
      >
        On this page
      </p>
      <ul className="space-y-0.5 border-l" style={{ borderColor: 'var(--lv2-border)' }}>
        {sections.map((s, i) => {
          const active = s.id === activeId
          const passed = i < activeIdx
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="block py-1.5 pl-4 text-[12.5px] leading-snug transition-colors"
                style={{
                  color: active
                    ? 'var(--lv2-primary)'
                    : passed
                      ? 'var(--lv2-muted)'
                      : 'var(--lv2-fg-soft)',
                  fontWeight: active ? 700 : 500,
                  borderLeft: active
                    ? '2px solid var(--lv2-primary)'
                    : '2px solid transparent',
                  marginLeft: -1,
                  textDecoration: passed && !active ? 'line-through' : 'none',
                  textDecorationColor: 'rgba(95,88,80,.35)',
                }}
              >
                {s.title}
              </a>
            </li>
          )
        })}
      </ul>
      <p
        className="lv2-mono mt-4 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
        style={{
          borderColor: 'var(--lv2-border)',
          background: 'var(--lv2-bg-2)',
          color: 'var(--lv2-muted)',
        }}
      >
        <Clock className="h-3 w-3" />
        ~{minutesLeft} min left
      </p>
    </aside>
  )
}
