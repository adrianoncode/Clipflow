'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

/**
 * Breadcrumb strip shown above every settings sub-page.
 *
 * Why it exists: users deep-link to `/settings/brand-voice` or land
 * there from an upgrade nudge, hit Cmd+L, and lose the sense of
 * "where am I?" The horizontal settings nav shows the current tab but
 * doesn't show the path back to Dashboard. This strip does.
 *
 * Labels are derived from the last path segment (`brand-voice` →
 * "Brand voice") so new settings routes don't need to register here.
 * Well-known slugs get a tidier label via SLUG_OVERRIDES.
 */
const SLUG_OVERRIDES: Record<string, string> = {
  'ai-keys': 'AI Keys',
  'brand-kit': 'Brand Kit',
  'brand-voice': 'Brand Voice',
  'audit-log': 'Audit log',
  channels: 'Channels',
  integrations: 'Integrations',
  profile: 'Profile',
  security: 'Security',
  workspace: 'Workspace',
  referrals: 'Referrals',
  templates: 'Templates',
  extension: 'Extension',
}

function prettify(slug: string): string {
  if (SLUG_OVERRIDES[slug]) return SLUG_OVERRIDES[slug]
  return slug
    .split('-')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ')
}

export function SettingsBreadcrumbs() {
  const pathname = usePathname()
  // Path will look like `/settings/brand-voice` — drop the empty
  // leading segment so we don't render a phantom crumb.
  const parts = pathname.split('/').filter(Boolean)
  // Everything under /settings. If the user is just on `/settings`,
  // don't render — the horizontal nav already fills that role.
  if (parts[0] !== 'settings' || parts.length < 2) return null

  const crumbs = parts.slice(1).map((slug, i) => {
    const href = '/' + parts.slice(0, 2 + i).join('/')
    return { slug, href, label: prettify(slug) }
  })

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-3 flex items-center gap-1 text-[11px] text-muted-foreground"
    >
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <Home className="h-3 w-3" />
        Dashboard
      </Link>
      <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
      <Link
        href="/settings"
        className="rounded-md px-1.5 py-0.5 font-medium transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        Settings
      </Link>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={c.href} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
            {isLast ? (
              <span className="rounded-md px-1.5 py-0.5 font-semibold text-foreground">
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="rounded-md px-1.5 py-0.5 transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                {c.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
