'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

import { SettingsNav } from '@/components/settings/settings-nav'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

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
  const [navOpen, setNavOpen] = useState(false)
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
      {/* Mobile-only: hamburger that opens a Dialog wrapping the same
          SettingsNav. Without this the nav was hidden entirely below
          md and users had no way to switch sub-sections without going
          back to the main app sidebar. */}
      <div className="mb-4 flex md:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-colors hover:bg-[rgba(15,15,15,0.04)]"
          style={{
            border: '1px solid rgba(15,15,15,0.14)',
            background: 'rgba(255,253,248,0.85)',
            color: '#0F0F0F',
          }}
          aria-label="Open settings menu"
        >
          <Menu className="h-4 w-4" />
          Settings menu
        </button>
      </div>

      <Dialog open={navOpen} onOpenChange={setNavOpen}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex items-center justify-between">
            <DialogTitle>Settings</DialogTitle>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              aria-label="Close settings menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div onClick={() => setNavOpen(false)}>
            <SettingsNav />
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-8 md:grid-cols-[220px_1fr] lg:gap-10">
        <aside className="hidden md:sticky md:top-6 md:block md:self-start">
          <SettingsNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
