'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { Guide, GuideCategory } from '@/lib/landing/playbook-types'

/**
 * Left-hand sidebar for /playbook. Groups guides by category with
 * the category header + its guides indented under it. Active guide
 * highlights in plum.
 *
 * Mobile: collapses into a single <details> drawer so the content
 * isn't pushed below 500px of nav.
 */
interface Props {
  categories: GuideCategory[]
  guides: Guide[]
}

export function PlaybookSidebar({ categories, guides }: Props) {
  const pathname = usePathname()
  const byCategory = new Map<string, Guide[]>()
  for (const g of guides) {
    const arr = byCategory.get(g.category) ?? []
    arr.push(g)
    byCategory.set(g.category, arr)
  }

  return (
    <>
      {/* Mobile drawer */}
      <details
        className="lg:hidden"
        style={{
          background: 'var(--lv2-card)',
          border: '1px solid var(--lv2-border)',
          borderRadius: 16,
        }}
      >
        <summary
          className="flex cursor-pointer items-center justify-between px-4 py-3 text-[13px] font-semibold"
          style={{ color: 'var(--lv2-fg)' }}
        >
          Browse the Playbook
          <span className="lv2-mono text-[10px]" style={{ color: 'var(--lv2-muted)' }}>
            {guides.length} guides
          </span>
        </summary>
        <div className="border-t px-2 pb-3 pt-2" style={{ borderColor: 'var(--lv2-border)' }}>
          <GroupList categories={categories} byCategory={byCategory} pathname={pathname} />
        </div>
      </details>

      {/* Desktop persistent */}
      <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
        <Link
          href="/playbook"
          className="mb-6 inline-flex items-center gap-2 text-[13px] font-semibold"
          style={{
            color: pathname === '/playbook' ? 'var(--lv2-primary)' : 'var(--lv2-fg-soft)',
          }}
        >
          <span className="lv2-display text-[18px]">Playbook</span>
          <span
            className="lv2-mono rounded-full px-2 py-0.5 text-[9px]"
            style={{
              background: 'var(--lv2-primary-soft)',
              color: 'var(--lv2-primary)',
            }}
          >
            {guides.length}
          </span>
        </Link>
        <nav>
          <GroupList categories={categories} byCategory={byCategory} pathname={pathname} />
        </nav>
      </aside>
    </>
  )
}

function GroupList({
  categories,
  byCategory,
  pathname,
}: {
  categories: GuideCategory[]
  byCategory: Map<string, Guide[]>
  pathname: string
}) {
  return (
    <div className="space-y-5">
      {categories.map((cat) => {
        const items = byCategory.get(cat.id) ?? []
        if (items.length === 0) return null
        return (
          <div key={cat.id}>
            <p
              className="lv2-mono-label mb-2 flex items-center gap-1.5 px-2"
              style={{ fontSize: 10 }}
            >
              <span aria-hidden>{cat.emoji}</span>
              {cat.name}
            </p>
            <ul className="space-y-0.5">
              {items.map((g) => {
                const href = `/playbook/${g.slug}`
                const active = pathname === href
                return (
                  <li key={g.id}>
                    <Link
                      href={href}
                      className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-[12.5px] leading-snug transition-colors"
                      style={{
                        background: active ? 'var(--lv2-primary)' : 'transparent',
                        color: active ? 'var(--lv2-accent)' : 'var(--lv2-fg-soft)',
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      <span className="truncate">{g.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
