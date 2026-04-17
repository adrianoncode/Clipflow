'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

interface MenuItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface MobileMoreMenuProps {
  active: boolean
  items: MenuItem[]
}

/**
 * The 5th mobile bottom-nav slot — tap to open a compact bottom sheet
 * with support nav items (Analytics, Settings). Keeps the mobile bar
 * focused on the 4 core workflow actions.
 */
export function MobileMoreMenu({ active, items }: MobileMoreMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close sheet on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === href
    if (href === '/settings') return pathname.startsWith('/settings')
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="More navigation"
        className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all ${
          active ? 'text-primary' : 'text-muted-foreground active:scale-95'
        }`}
      >
        <Menu className="h-4 w-4" />
        More
      </button>

      {/* Bottom sheet */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="More navigation"
        >
          {/* Backdrop */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Sheet */}
          <div className="relative z-10 overflow-y-auto rounded-t-2xl border-t border-border/60 bg-background pb-[env(safe-area-inset-bottom)] shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Drag handle + close */}
            <div className="flex items-center justify-between px-5 py-3">
              <div
                aria-hidden
                className="mx-auto h-1 w-8 rounded-full bg-border"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-1 px-4 pb-4">
              {items.map((item) => {
                const activeItem = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] transition-all duration-150 ${
                      activeItem
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-foreground/75 active:bg-accent/60'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        activeItem ? 'text-primary' : 'text-muted-foreground/60'
                      }`}
                    />
                    <span className="leading-tight">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
