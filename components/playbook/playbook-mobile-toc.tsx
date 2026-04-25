'use client'

import type { GuideSection } from '@/lib/landing/playbook-types'

/**
 * Floating bottom-sheet TOC for mobile guide pages. Anchor-clicks
 * close the sheet so the user lands on the heading instead of the
 * sheet covering it.
 *
 * Lives outside the article flow (`fixed inset-x-4 bottom-4`) so it
 * stays reachable while the user reads. Hidden on lg+ (the right
 * rail TOC takes over).
 */
export function PlaybookMobileToc({ sections }: { sections: GuideSection[] }) {
  if (sections.length < 3) return null

  function closeSheet(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = e.currentTarget.closest('details')
    if (el) el.removeAttribute('open')
  }

  return (
    <details
      className="group fixed inset-x-4 bottom-4 z-40 overflow-hidden rounded-2xl border shadow-2xl lg:hidden"
      style={{
        borderColor: 'var(--lv2-border)',
        background: 'var(--lv2-card)',
        boxShadow: '0 12px 32px -8px rgba(42,26,61,.25)',
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span
          className="lv2-mono inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em]"
          style={{ color: 'var(--lv2-muted)' }}
        >
          <span aria-hidden>📋</span>
          Jump to section
        </span>
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="transition-transform group-open:rotate-180"
          style={{ color: 'var(--lv2-muted)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <ol
        className="max-h-[40vh] space-y-0 overflow-y-auto border-t px-2 py-2"
        style={{ borderColor: 'var(--lv2-border)' }}
      >
        {sections.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={closeSheet}
              className="flex items-start gap-2.5 rounded-lg px-2 py-2 text-[13px] leading-snug transition-colors hover:bg-black/[.04]"
              style={{ color: 'var(--lv2-fg)' }}
            >
              <span
                className="lv2-mono mt-0.5 inline-flex h-4 w-6 shrink-0 items-center justify-center rounded text-[9px] font-bold"
                style={{
                  background: 'var(--lv2-primary-soft)',
                  color: 'var(--lv2-primary)',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{s.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </details>
  )
}
