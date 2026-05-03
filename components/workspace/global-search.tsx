'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Layers, Loader2 } from 'lucide-react'

import type { SearchResult } from '@/lib/search/search-workspace'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function GlobalSearch({ workspaceId }: { workspaceId: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const q = debouncedQuery
    if (!q.trim() || q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&workspaceId=${encodeURIComponent(workspaceId)}`,
          { signal: controller.signal },
        )
        if (res.ok) {
          const data = (await res.json()) as SearchResult[]
          setResults(data)
        }
      } catch (err) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [debouncedQuery, workspaceId])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults([])
    setActiveIndex(-1)
    inputRef.current?.blur()
  }, [])

  function handleSelect(result: SearchResult) {
    router.push(result.url)
    close()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      close()
      return
    }
    if (!open || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex]!)
    }
  }

  const showDropdown = open && (query.length >= 2 || loading)

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div
        className="flex h-8 items-center gap-2 rounded-full border px-3 transition-shadow focus-within:ring-2 focus-within:ring-[#0F0F0F] focus-within:ring-offset-2"
        style={{
          borderColor: 'rgba(15,15,15,0.14)',
          background: 'rgba(255, 253, 248, 0.85)',
        }}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#7A7468' }} />
        ) : (
          <Search className="h-3 w-3" aria-hidden style={{ color: '#7A7468' }} />
        )}
        <label htmlFor="topbar-search" className="sr-only">Search</label>
        <input
          ref={inputRef}
          id="topbar-search"
          data-global-search
          type="search"
          name="q"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.length >= 2) {
              setOpen(true)
              setActiveIndex(-1)
            } else {
              setOpen(false)
            }
          }}
          onFocus={() => {
            if (query.length >= 2) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search anything"
          className="w-[200px] border-0 bg-transparent text-[12px] outline-none placeholder:text-[#7A7468]"
          style={{ color: '#0F0F0F' }}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-results"
          aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
        />
        {!query && (
          <kbd
            aria-hidden="true"
            className="rounded border px-1.5 py-px text-[10px]"
            style={{
              borderColor: 'rgba(15,15,15,0.14)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              color: '#7A7468',
              background: '#FAF7F2',
            }}
          >
            ⌘K
          </kbd>
        )}
      </div>

      {showDropdown && (
        <div
          id="search-results"
          role="listbox"
          className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-[16px] shadow-xl"
          style={{
            background: '#FFFDF8',
            border: '1px solid rgba(15,15,15,0.08)',
            boxShadow: '0 20px 40px -12px rgba(15,15,15,0.15)',
          }}
        >
          <div className="border-b px-4 py-2.5" style={{ borderColor: 'rgba(15,15,15,0.06)' }}>
            <p
              className="text-[9px] font-semibold uppercase"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                letterSpacing: '0.22em',
                color: '#7A7468',
              }}
            >
              {loading ? 'Searching…' : results.length > 0 ? `${results.length} results` : 'No results'}
            </p>
          </div>

          {results.length === 0 && !loading && query.length >= 2 ? (
            <div className="flex flex-col items-center gap-1.5 px-4 py-6 text-center">
              <Search className="h-4 w-4" style={{ color: 'rgba(15,15,15,0.2)' }} />
              <p className="text-[13px] font-medium" style={{ color: '#0F0F0F' }}>
                Nothing found
              </p>
              <p className="text-[11px]" style={{ color: '#7A7468' }}>
                Try a different search term
              </p>
            </div>
          ) : (
            <ul className="max-h-[320px] overflow-y-auto py-1">
              {results.map((result, i) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    id={`search-result-${i}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{
                      background: i === activeIndex ? 'rgba(15,15,15,0.04)' : 'transparent',
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: 'rgba(15,15,15,0.05)' }}
                    >
                      {result.type === 'content' ? (
                        <FileText className="h-3.5 w-3.5" style={{ color: '#0F0F0F' }} />
                      ) : (
                        <Layers className="h-3.5 w-3.5" style={{ color: '#0F0F0F' }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium" style={{ color: '#0F0F0F' }}>
                        {result.title}
                      </p>
                      {result.excerpt && (
                        <p className="truncate text-[11px]" style={{ color: '#7A7468' }}>
                          {result.excerpt}
                        </p>
                      )}
                    </div>
                    {result.platform && (
                      <span
                        className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                        style={{
                          background: 'rgba(15,15,15,0.06)',
                          color: '#7A7468',
                          fontFamily: 'var(--font-jetbrains-mono), monospace',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {result.platform}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div
            className="flex items-center gap-3 border-t px-4 py-2"
            style={{ borderColor: 'rgba(15,15,15,0.06)' }}
          >
            <span className="text-[10px]" style={{ color: '#7A7468' }}>
              <kbd
                className="rounded border px-1 py-px"
                style={{
                  borderColor: 'rgba(15,15,15,0.14)',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  background: '#FAF7F2',
                }}
              >
                ↑↓
              </kbd>{' '}
              navigate
            </span>
            <span className="text-[10px]" style={{ color: '#7A7468' }}>
              <kbd
                className="rounded border px-1 py-px"
                style={{
                  borderColor: 'rgba(15,15,15,0.14)',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  background: '#FAF7F2',
                }}
              >
                ↵
              </kbd>{' '}
              open
            </span>
            <span className="text-[10px]" style={{ color: '#7A7468' }}>
              <kbd
                className="rounded border px-1 py-px"
                style={{
                  borderColor: 'rgba(15,15,15,0.14)',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  background: '#FAF7F2',
                }}
              >
                esc
              </kbd>{' '}
              close
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
