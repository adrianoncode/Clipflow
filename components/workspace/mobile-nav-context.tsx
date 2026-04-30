'use client'

import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Tiny shared open/close state for the mobile sidebar drawer.
 *
 * The Sidebar (renders the drawer panel) and the Topbar (renders the
 * hamburger toggle) live as siblings in the (app) layout. A single
 * client context wires them together without elevating the entire
 * layout to a client component.
 *
 * Auto-closes on route change so navigating from the drawer doesn't
 * leave it covering the next page.
 */

interface MobileNavCtx {
  open: boolean
  setOpen: (v: boolean) => void
}

const Ctx = createContext<MobileNavCtx | null>(null)

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while the drawer is open — prevents the page
  // behind from scrolling under the user's finger on mobile.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>
}

export function useMobileNav(): MobileNavCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // Sensible no-op fallback so server-rendered children that don't
    // wrap with the provider (e.g. invite/review guest layouts) don't
    // crash. The drawer just stays closed.
    return { open: false, setOpen: () => {} }
  }
  return ctx
}
