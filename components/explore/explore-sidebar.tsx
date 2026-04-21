'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { ExploreEntry } from '@/lib/landing/features'

interface ExploreSidebarProps {
  features: ExploreEntry[]
  useCases: ExploreEntry[]
}

/**
 * Docs-style left sidebar for /features and /for routes.
 *
 * Renders two grouped sections (Features, Use cases). On mobile it
 * collapses into a <details> expander so the content area isn't
 * pushed below a 500px nav column.
 */
export function ExploreSidebar({ features, useCases }: ExploreSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile: collapsible */}
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
          Browse features &amp; use cases
          <span className="lv2-mono text-[10px]" style={{ color: 'var(--lv2-muted)' }}>
            {features.length + useCases.length} pages
          </span>
        </summary>
        <div
          className="border-t px-2 pb-3 pt-2"
          style={{ borderColor: 'var(--lv2-border)' }}
        >
          <SidebarGroup label="Features" pathname={pathname} entries={features} basePath="/features" />
          <div style={{ height: 12 }} />
          <SidebarGroup label="Use cases" pathname={pathname} entries={useCases} basePath="/for" />
        </div>
      </details>

      {/* Desktop: persistent */}
      <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
        <nav className="space-y-6">
          <SidebarGroup label="Features" pathname={pathname} entries={features} basePath="/features" />
          <SidebarGroup label="Use cases" pathname={pathname} entries={useCases} basePath="/for" />
        </nav>
      </aside>
    </>
  )
}

function SidebarGroup({
  label,
  entries,
  pathname,
  basePath,
}: {
  label: string
  entries: ExploreEntry[]
  pathname: string
  basePath: string
}) {
  return (
    <div>
      <p
        className="lv2-mono-label mb-2 px-2"
        style={{ fontSize: 10 }}
      >
        {label}
      </p>
      <ul className="space-y-0.5">
        {entries.map((e) => {
          const href = `${basePath}/${e.slug}`
          const active = pathname === href
          return (
            <li key={e.id}>
              <Link
                href={href}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors"
                style={{
                  background: active ? 'var(--lv2-primary)' : 'transparent',
                  color: active ? 'var(--lv2-accent)' : 'var(--lv2-fg-soft)',
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[12px]"
                  style={{
                    background: active
                      ? 'rgba(214,255,62,.15)'
                      : 'var(--lv2-muted-2)',
                  }}
                  aria-hidden
                >
                  {e.emoji}
                </span>
                <span className="truncate">{e.name.replace(/^For /, '')}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
