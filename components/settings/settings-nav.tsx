'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const groups = [
  {
    label: 'Account',
    items: [
      { href: '/settings/profile', label: 'Profile' },
      { href: '/settings/workspace', label: 'Workspace' },
      { href: '/settings/referrals', label: 'Refer & Earn' },
    ],
  },
  {
    label: 'AI',
    items: [
      { href: '/settings/ai-keys', label: 'API Keys' },
      { href: '/settings/brand-voice', label: 'Brand Voice' },
      { href: '/settings/personas', label: 'AI Personas' },
    ],
  },
  {
    label: 'Connect',
    items: [
      { href: '/settings/integrations', label: 'Integrations' },
      { href: '/settings/webhooks', label: 'Webhooks' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/settings/templates', label: 'Output Templates' },
    ],
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                    active
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                    />
                  )}
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
