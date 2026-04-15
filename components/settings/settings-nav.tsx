'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  Building2,
  Gift,
  Key,
  Mic2,
  Bot,
  Plug,
  Webhook,
  LayoutTemplate,
} from 'lucide-react'

const groups = [
  {
    label: 'Account',
    items: [
      { href: '/settings/profile', label: 'Profile', icon: User },
      { href: '/settings/workspace', label: 'Workspace', icon: Building2 },
      { href: '/settings/referrals', label: 'Refer & Earn', icon: Gift },
    ],
  },
  {
    label: 'AI',
    items: [
      { href: '/settings/ai-keys', label: 'API Keys', icon: Key },
      { href: '/settings/brand-voice', label: 'Brand Voice', icon: Mic2 },
      { href: '/settings/personas', label: 'AI Personas', icon: Bot },
    ],
  },
  {
    label: 'Connect',
    items: [
      { href: '/settings/integrations', label: 'Integrations', icon: Plug },
      { href: '/settings/webhooks', label: 'Webhooks', icon: Webhook },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/settings/templates', label: 'Output Templates', icon: LayoutTemplate },
    ],
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all duration-150 ${
                    active
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                    />
                  )}
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground/50 group-hover:text-foreground/70'
                    }`}
                  />
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
