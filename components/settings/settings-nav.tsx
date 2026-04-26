'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  Building2,
  CreditCard,
  Gift,
  HelpCircle,
  ScrollText,
  Shield,
} from 'lucide-react'

// Account-only items live here. Workflow tools (AI Keys, Brand Voice,
// Brand Kit, Templates) moved to the main app sidebar — they're not
// account settings, they're tools you reach for during content work.
const accountGroup = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/security', label: 'Security', icon: Shield },
  { href: '/settings/workspace', label: 'Workspace profile', icon: Building2 },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings/referrals', label: 'Referrals', icon: Gift },
]

const connectGroup = [
  { href: '/settings/audit-log', label: 'Audit log', icon: ScrollText },
  { href: '/help', label: 'Help', icon: HelpCircle },
]

const groups = [accountGroup, connectGroup]

// Routes where the horizontal Settings nav should NOT render. These
// pages are full-fledged features (reachable from the main sidebar)
// that happen to live under /settings/* for URL-stability reasons —
// but surfacing the Profile/Security/Billing tabs above them is
// noise, not navigation.
const HIDE_NAV_PREFIXES = [
  '/settings/channels',
  '/settings/integrations',
  '/settings/ai-keys',
  '/settings/brand-voice',
  '/settings/brand-kit',
  '/settings/templates',
]

export function SettingsNav() {
  const pathname = usePathname()

  if (HIDE_NAV_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    /* The nav scrolls horizontally on narrow viewports + long tab lists
       (13 tabs total). Without a visual cue users don't realize the
       off-right tabs (Channels, Integrations, Audit log, Help) exist —
       caught this during UX audit where users couldn't find Channels.
       Fade-out gradients on both edges signal "more content this way",
       fading in only when there's actually overflow to scroll through. */
    <div
      className="relative border-b border-border/50"
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)',
      }}
    >
      <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
        {groups.map((group, gi) => (
          <div key={gi} className="contents">
            {gi > 0 && (
              <div aria-hidden className="mx-1 flex items-center">
                <span className="h-4 w-px bg-border/40" />
              </div>
            )}
            {group.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground/70 hover:text-foreground'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground/40 group-hover:text-foreground/60'
                    }`}
                  />
                  {item.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                    />
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </div>
  )
}
