'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

interface MenuItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  locked?: boolean
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

interface MobileMoreMenuProps {
  active: boolean
  sections: MenuSection[]
}

/**
 * The 5th mobile bottom-nav slot — tap to open a bottom sheet with all
 * secondary nav items (Workspace, AI Tools, Bottom nav). This replaces
 * "Settings" in the bottom bar because Settings alone is too narrow a
 * choice for mobile users who need access to Projects, Research, Dashboard,
 * etc.
 */
export function MobileMoreMenu({ active, sections }: MobileMoreMenuProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close sheet on route change so nav transitions feel snappy
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
    if (href === '/settings') return pathname === '/settings'
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
          <div className="relative z-10 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border/60 bg-background pb-[env(safe-area-inset-bottom)] shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Drag handle + close */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background/95 px-5 py-3 backdrop-blur-sm">
              <div className="flex flex-col">
                <div
                  aria-hidden
                  className="mx-auto mb-1 h-1 w-10 rounded-full bg-border"
                />
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  All sections
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Sections */}
            <div className="space-y-5 px-4 py-4">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="mb-2 px-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/50">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {section.items.map((item) => {
                      const activeItem = isActive(item.href)
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-150 ${
                            activeItem
                              ? 'bg-primary/10 font-semibold text-primary'
                              : item.locked
                                ? 'border border-border/40 bg-muted/20 text-muted-foreground/50'
                                : 'border border-border/50 bg-card text-foreground/75 hover:border-primary/25 hover:bg-primary/[0.04]'
                          }`}
                        >
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 ${
                              activeItem ? 'text-primary' : 'text-muted-foreground/60'
                            }`}
                          />
                          <span className="flex-1 truncate leading-tight">{item.label}</span>
                          {item.locked && (
                            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                              Pro
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
