'use client'

import { usePathname } from 'next/navigation'
import { SettingsNav } from '@/components/settings/settings-nav'

// Routes where the settings sub-nav should NOT render. These pages are
// full-fledged features (reachable from the main sidebar) that happen
// to live under /settings/* for URL-stability reasons. Mirrors the
// list in settings-nav.tsx — kept duplicated rather than re-exported
// because settings-nav is a client component that the SettingsNav
// uses internally; SettingsShell needs the same predicate but as a
// pure client check.
const FULL_BLEED_PREFIXES = [
  '/settings/channels',
  '/settings/ai-keys',
  '/settings/brand-voice',
  '/settings/brand-kit',
  '/settings/templates',
]

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const fullBleed = FULL_BLEED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )

  if (fullBleed) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        {children}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <div className="grid gap-8 md:grid-cols-[220px_1fr] lg:gap-10">
        <aside className="md:sticky md:top-6 md:self-start">
          <SettingsNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
