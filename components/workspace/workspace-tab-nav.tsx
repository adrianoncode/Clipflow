'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface WorkspaceTabNavProps {
  items: { href: string; label: string }[]
}

export function WorkspaceTabNav({ items }: WorkspaceTabNavProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    // Exact match for the workspace root (Content tab)
    const isRoot = items[0]?.href === href
    if (isRoot) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
              active
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
            }`}
          >
            {active && (
              <span
                aria-hidden
                className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary"
              />
            )}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
