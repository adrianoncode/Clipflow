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

const items = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/workspace', label: 'Workspace', icon: Building2 },
  { href: '/settings/ai-keys', label: 'API Keys', icon: Key },
  { href: '/settings/brand-voice', label: 'Brand Voice', icon: Mic2 },
  { href: '/settings/personas', label: 'Personas', icon: Bot },
  { href: '/settings/integrations', label: 'Integrations', icon: Plug },
  { href: '/settings/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/settings/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/settings/referrals', label: 'Referrals', icon: Gift },
]

export function SettingsNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="border-b border-border/50">
      <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-none">
        {items.map((item) => {
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
              {/* Active indicator line */}
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
