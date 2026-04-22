'use client'

import { useEffect, useState } from 'react'

import type { GuideSection } from '@/lib/landing/playbook-types'

/**
 * Sticky right-rail table of contents. Highlights the section
 * currently in view via IntersectionObserver — so readers always
 * know where they are in a long guide.
 *
 * Degrades gracefully when there are fewer than 3 sections (we just
 * don't render — a short guide doesn't need a TOC).
 */
export function PlaybookToc({ sections }: { sections: GuideSection[] }) {
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null)

  useEffect(() => {
    if (typeof window === 'undefined' || sections.length < 3) return

    // Track which section is most-in-view. We observe each section's
    // top edge against the top 30% of the viewport — this keeps the
    // highlight feeling anchored to the heading the reader is actively
    // reading, not whatever is scrolling past.
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the most positive intersection ratio
        // that is currently intersecting — ignoring entries that are
        // leaving the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        // Trigger roughly when a heading passes the top 30% line.
        rootMargin: '-15% 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  if (sections.length < 3) return null

  return (
    <aside className="sticky top-24 hidden self-start lg:block">
      <p
        className="lv2-mono mb-3 text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--lv2-muted)' }}
      >
        On this page
      </p>
      <ul className="space-y-1 border-l" style={{ borderColor: 'var(--lv2-border)' }}>
        {sections.map((s) => {
          const active = s.id === activeId
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="block py-1.5 pl-4 text-[12.5px] leading-snug transition-colors"
                style={{
                  color: active ? 'var(--lv2-primary)' : 'var(--lv2-muted)',
                  fontWeight: active ? 700 : 500,
                  borderLeft: active ? '2px solid var(--lv2-primary)' : '2px solid transparent',
                  marginLeft: -1,
                }}
              >
                {s.title}
              </a>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
