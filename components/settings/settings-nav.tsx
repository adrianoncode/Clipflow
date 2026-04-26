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
  { href: '/settings/workspace', label: 'Workspace', icon: Building2 },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings/referrals', label: 'Referrals', icon: Gift },
]

const supportGroup = [
  { href: '/settings/audit-log', label: 'Audit log', icon: ScrollText },
  { href: '/help', label: 'Help', icon: HelpCircle },
]

const SECTIONS = [
  { label: 'Account', items: accountGroup },
  { label: 'Support', items: supportGroup },
] as const

// Routes where the settings sub-nav should NOT render. These pages
// are full-fledged features (reachable from the main sidebar) that
// happen to live under /settings/* for URL-stability reasons —
// surfacing the Profile/Security/Billing nav above them is noise.
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
    <nav aria-label="Settings sections" className="space-y-5">
      {SECTIONS.map((section) => (
        <div key={section.label} className="space-y-1.5">
          <p className="px-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-all ${
                      active
                        ? 'bg-primary/[0.06] text-foreground'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                  >
                    {/* Left accent bar on active */}
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute -left-px top-1.5 h-[calc(100%-12px)] w-0.5 rounded-full bg-primary"
                      />
                    ) : null}
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                        active
                          ? 'text-primary'
                          : 'text-muted-foreground/60 group-hover:text-foreground/70'
                      }`}
                    />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
