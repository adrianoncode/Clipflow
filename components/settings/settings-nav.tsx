'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  User,
  Building2,
  Gift,
  Key,
  Mic2,
  Plug,
  Shield,
  LayoutTemplate,
} from 'lucide-react'

const accountGroup = [
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/security', label: 'Security', icon: Shield },
  { href: '/settings/workspace', label: 'Workspace', icon: Building2 },
  { href: '/settings/referrals', label: 'Referrals', icon: Gift },
]

const aiGroup = [
  { href: '/settings/ai-keys', label: 'AI Connections', icon: Key },
  { href: '/settings/brand-voice', label: 'Brand Voice', icon: Mic2 },
  { href: '/settings/templates', label: 'Templates', icon: LayoutTemplate },
]

const connectGroup = [
  { href: '/settings/integrations', label: 'Integrations', icon: Plug },
]

const groups = [accountGroup, aiGroup, connectGroup]

export function SettingsNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="border-b border-border/50">
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
