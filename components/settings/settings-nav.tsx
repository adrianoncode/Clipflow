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
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(42,26,61,0.04), 0 12px 32px -18px rgba(42,26,61,0.18)',
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
      />
      {/* Soft brand glow tucked behind the active item — gives the
          rail real depth without becoming a billboard. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(42,26,61,0.10) 0%, rgba(42,26,61,0) 65%)',
        }}
      />

      <div className="relative space-y-5 p-3 sm:p-3.5">
        {SECTIONS.map((section, sIdx) => (
          <div key={section.label} className="space-y-1.5">
            <header className="flex items-center gap-1.5 px-2 pt-1">
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-primary/75"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {section.index}
              </span>
              <span className="inline-block h-px w-3 bg-primary/35" />
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground/70"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
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
          className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl px-2.5 py-2 text-[13px] font-bold text-white"
          style={{
            background:
              'linear-gradient(140deg, #2A1A3D 0%, #2A1A3D 60%, #1A0F2A 100%)',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 18px -8px rgba(42,26,61,0.55)',
          }}
        >
          {/* inner highlight arc — same designer detail as the hero monogram */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-2 top-0 h-px bg-white/30"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-1 rounded-[10px]"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 50%)',
            }}
          />
          <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/15">
            <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
          </span>
          <span
            className="relative tracking-tight"
            style={{
              fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            {label}
          </span>
          {/* tiny mono dot to mark the active row — quiet but premium */}
          <span
            aria-hidden
            className="relative ml-auto inline-block h-1 w-1 rounded-full bg-white/70"
          />
        </Link>
      </li>
    )
  }

  return (
    <li>
      <Link
        href={href}
        className="group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-muted-foreground transition-all hover:bg-primary/[0.05] hover:text-foreground"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background text-muted-foreground/75 transition-colors group-hover:border-primary/25 group-hover:text-primary">
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
