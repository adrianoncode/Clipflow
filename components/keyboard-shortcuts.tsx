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
 * - ?            → Show shortcuts help (GitHub/Linear convention)
 * - Esc          → Close help
 *
 * A custom event ("clipflow:open-shortcuts") also toggles the help —
 * the header's "?" button dispatches it, so a click opens the same
 * overlay the keyboard shortcut opens.
 */
export function KeyboardShortcuts({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't steal keystrokes while the user is typing
      const tag = (e.target as HTMLElement)?.tagName
      const typing =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (e.target as HTMLElement)?.isContentEditable === true

      // Esc always closes help, even mid-typing
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false)
        return
      }

      // Bare "?" opens help (GitHub / Linear convention) — only when
      // not typing. We check the character rather than the key code so
      // shift-/ on non-QWERTY layouts still works.
      if (!typing && e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setShowHelp((prev) => !prev)
        return
      }

      // Remaining shortcuts require a modifier, and we block them while
      // typing so Cmd+K in a search field still selects-all, etc.
      if (typing) return
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return

      switch (e.key) {
        case 'k': {
          e.preventDefault()
          const search = document.querySelector<HTMLInputElement>('[data-global-search]')
          search?.focus()
          break
        }
        case 'n': {
          e.preventDefault()
          router.push(`/workspace/${workspaceId}/content/new`)
          break
        }
        case 'd': {
          e.preventDefault()
          router.push('/dashboard')
          break
        }
        case 'a': {
          e.preventDefault()
          router.push(`/workspace/${workspaceId}/agent`)
          break
        }
        case '/': {
          e.preventDefault()
          setShowHelp((prev) => !prev)
          break
        }
      }
    }

    function openHandler() {
      setShowHelp(true)
    }

    window.addEventListener('keydown', handler)
    window.addEventListener('clipflow:open-shortcuts', openHandler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('clipflow:open-shortcuts', openHandler)
    }
  }, [router, workspaceId, showHelp])

  if (!showHelp) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(15,15,15,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={() => setShowHelp(false)}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-[20px] shadow-2xl"
        style={{ background: '#FFFDF8', border: '1px solid rgba(15,15,15,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-5 py-3.5" style={{ borderColor: 'rgba(15,15,15,0.08)' }}>
          <p
            className="text-[9px] font-semibold uppercase"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', letterSpacing: '0.22em', color: '#7A7468' }}
          >
            Shortcuts
          </p>
          <h3
            id="keyboard-shortcuts-title"
            className="mt-1"
            style={{ fontFamily: 'var(--font-instrument-serif), Georgia, serif', fontSize: 22, color: '#0F0F0F', fontWeight: 400 }}
          >
            Keyboard shortcuts
          </h3>
        </div>
        <div className="space-y-0 px-5 py-3">
          {[
            { keys: ['⌘', 'K'], desc: 'Search' },
            { keys: ['⌘', 'N'], desc: 'New import' },
            { keys: ['⌘', 'D'], desc: 'Dashboard' },
            { keys: ['⌘', 'A'], desc: 'AI Agent' },
            { keys: ['?'], desc: 'This menu' },
          ].map((shortcut) => (
            <div key={shortcut.desc} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(15,15,15,0.05)' }}>
              <span className="text-[13px]" style={{ color: '#2A2A2A' }}>{shortcut.desc}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-[11px] font-semibold tabular-nums"
                    style={{ background: 'rgba(15,15,15,0.06)', color: '#0F0F0F', fontFamily: 'var(--font-jetbrains-mono), monospace' }}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4">
          <p className="text-[11px]" style={{ color: '#7A7468' }}>Press Esc to close</p>
        </div>
      </div>
    </div>
  )
}
