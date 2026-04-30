'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileVideo, Layers, Sparkles } from 'lucide-react'

/**
 * Per-Video tab nav — sits in the shared layout above Source / Highlights /
 * Drafts. URL-based active state so the tab survives reloads, deep links,
 * and the browser back button (the way every other settings + workspace
 * sub-nav already works).
 *
 * Routes:
 *   Source     /workspace/[id]/content/[contentId]
 *   Highlights /workspace/[id]/content/[contentId]/highlights
 *   Drafts     /workspace/[id]/content/[contentId]/outputs   (legacy URL kept)
 */
export function PerVideoTabNav({
  workspaceId,
  contentId,
}: {
  workspaceId: string
  contentId: string
}) {
  const pathname = usePathname()
  const base = `/workspace/${workspaceId}/content/${contentId}`

  const tabs = [
    { id: 'source', label: 'Source', href: base, Icon: FileVideo },
    {
      id: 'highlights',
      label: 'Highlights',
      href: `${base}/highlights`,
      Icon: Sparkles,
    },
    {
      id: 'drafts',
      label: 'Drafts',
      href: `${base}/outputs`,
      Icon: Layers,
    },
  ] as const

  return (
    <nav
      aria-label="Per-video views"
      className="inline-flex items-center gap-1 rounded-2xl border border-border/60 bg-card p-1"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(15,15,15,0.04), 0 6px 14px -8px rgba(15,15,15,0.14)',
      }}
    >
      {tabs.map((t) => {
        const isActive = isActiveTab(pathname, t.id, base)
        const Icon = t.Icon
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold tracking-tight transition-all ${
              isActive
                ? 'bg-[#0F0F0F] text-[#D6FF3E] shadow-sm shadow-[#0F0F0F]/30'
                : 'text-muted-foreground hover:bg-primary/[0.05] hover:text-foreground'
            }`}
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}

function isActiveTab(
  pathname: string,
  tabId: 'source' | 'highlights' | 'drafts',
  base: string,
): boolean {
  if (tabId === 'highlights') return pathname.startsWith(`${base}/highlights`)
  if (tabId === 'drafts') return pathname.startsWith(`${base}/outputs`)
  // Source = base path with no trailing tab segment. Sub-tools (subtitles,
  // broll, dub, etc.) live under the source tab semantically.
  return (
    pathname === base ||
    pathname === `${base}/` ||
    /^\/workspace\/[^/]+\/content\/[^/]+\/(?:subtitles|broll|reframe|dub|avatar|cleanup)/.test(pathname)
  )
}
