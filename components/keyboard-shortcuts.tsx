'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Global keyboard shortcuts handler.
 * Rendered once in the app shell.
 *
 * Shortcuts:
 * - Cmd/Ctrl + K → Focus global search
 * - Cmd/Ctrl + N → New content
 * - Cmd/Ctrl + / → Show shortcuts help
 */
export function KeyboardShortcuts({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      // Don't trigger when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        case 'k': {
          e.preventDefault()
          // Focus the global search input
          const search = document.querySelector<HTMLInputElement>('[data-global-search]')
          search?.focus()
          break
        }
        case 'n': {
          e.preventDefault()
          router.push(`/workspace/${workspaceId}/content/new`)
          break
        }
        case '/': {
          e.preventDefault()
          setShowHelp((prev) => !prev)
          break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router, workspaceId])

  if (!showHelp) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border/50 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-base font-bold">Keyboard Shortcuts</h3>
        <div className="space-y-3">
          {[
            { keys: ['⌘', 'K'], desc: 'Search' },
            { keys: ['⌘', 'N'], desc: 'New content' },
            { keys: ['⌘', '/'], desc: 'Show this help' },
          ].map((shortcut) => (
            <div key={shortcut.desc} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.desc}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="flex h-6 min-w-[24px] items-center justify-center rounded border border-border bg-muted px-1.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground/50">Press Esc or ⌘/ to close</p>
      </div>
    </div>
  )
}
