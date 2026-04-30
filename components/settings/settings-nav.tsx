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
  type LucideIcon,
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
  { index: '01', label: 'Account', items: accountGroup },
  { index: '02', label: 'Support', items: supportGroup },
] as const

// Routes where the settings sub-nav should NOT render. These pages
// are full-fledged features (reachable from the main sidebar) that
// happen to live under /settings/* for URL-stability reasons —
// surfacing the Profile/Security/Billing nav above them is noise.
const HIDE_NAV_PREFIXES = [
  '/settings/channels',
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
    <nav
      aria-label="Settings sections"
      className="relative overflow-hidden rounded-[20px] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.7)]"
      style={{
        background: '#F9F4DC',
        border: '1px solid rgba(15,15,15,0.06)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(15,15,15,0.18), transparent)' }}
      />
      {/* Soft brand glow tucked behind the active item — gives the
          rail real depth without becoming a billboard. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(244,217,61,0.20) 0%, rgba(244,217,61,0) 65%)',
        }}
      />

      <div className="relative space-y-5 p-3 sm:p-3.5">
        {SECTIONS.map((section, sIdx) => (
          <div key={section.label} className="space-y-1.5">
            <header className="flex items-center gap-1.5 px-2 pt-1">
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: '#3A3A3A',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                {section.index}
              </span>
              <span
                className="inline-block h-px w-3"
                style={{ background: 'rgba(15,15,15,0.18)' }}
              />
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.22em]"
                style={{
                  color: '#7A7468',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                {section.label}
              </span>
            </header>
            <ul className="space-y-px">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive(item.href)}
                />
              ))}
            </ul>
            {sIdx < SECTIONS.length - 1 ? (
              <div className="mx-2 mt-3 h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
            ) : null}
          </div>
        ))}
      </div>
    </nav>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
}) {
  if (active) {
    return (
      <li>
        <Link
          href={href}
          aria-current="page"
          className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl px-2.5 py-2 text-[13px] font-bold"
          style={{
            background: '#0F0F0F',
            color: '#FFFFFF',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 18px -8px rgba(15,15,15,0.45)',
          }}
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{ background: 'rgba(255,255,255,0.10)' }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
          </span>
          <span
            className="tracking-tight"
            style={{
              fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            {label}
          </span>
          <span
            aria-hidden
            className="ml-auto inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: '#F4D93D' }}
          />
        </Link>
      </li>
    )
  }

  return (
    <li>
      <Link
        href={href}
        className="group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors hover:bg-[rgba(15,15,15,0.04)]"
        style={{ color: '#3A3A3A' }}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
          style={{
            border: '1px solid rgba(15,15,15,0.10)',
            background: 'transparent',
            color: '#3A3A3A',
          }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
        </span>
        <span
          className="tracking-tight"
          style={{
            fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          {label}
        </span>
      </Link>
    </li>
  )
}
