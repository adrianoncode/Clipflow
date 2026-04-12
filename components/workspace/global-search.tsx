'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Layers, Loader2 } from 'lucide-react'

import type { SearchResult } from '@/lib/search/search-workspace'

interface GlobalSearchProps {
  workspaceId: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function GlobalSearch({ workspaceId }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const debouncedQuery = useDebounce(query, 300)

  // CMD+K shortcut
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Click outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch results
  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&workspaceId=${encodeURIComponent(workspaceId)}`,
      )
      if (res.ok) {
        const data = await res.json() as SearchResult[]
        setResults(data)
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void fetchResults(debouncedQuery)
  }, [debouncedQuery, fetchResults])

  function handleSelect(result: SearchResult) {
    router.push(result.url)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.length >= 2) setOpen(true)
            else setOpen(false)
          }}
          onFocus={() => {
            if (query.length >= 2) setOpen(true)
          }}
          placeholder="Search… ⌘K"
          className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[320px] rounded-md border bg-popover shadow-md">
          {results.length === 0 && !loading && query.length >= 2 ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No results found</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    {result.type === 'content' ? (
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Layers className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{result.title}</p>
                      {result.excerpt && (
                        <p className="truncate text-xs text-muted-foreground">{result.excerpt}</p>
                      )}
                    </div>
                    {result.platform && (
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-xs bg-muted text-muted-foreground">
                        {result.platform}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
