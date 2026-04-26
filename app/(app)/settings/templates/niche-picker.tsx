'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'

import { setActiveNicheAction } from './actions'
import { NICHE_PRESETS, type NicheId } from '@/lib/niche/presets'

interface NichePickerProps {
  workspaceId: string
  initialNiche: NicheId | null
}

export function NichePicker({ workspaceId, initialNiche }: NichePickerProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<NicheId | null>(initialNiche)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)

  function choose(niche: NicheId | '') {
    const nextId = niche === '' ? null : niche
    setPendingId(niche || 'clear')
    setError(null)

    startTransition(async () => {
      const fd = new FormData()
      fd.set('workspace_id', workspaceId)
      fd.set('niche', niche)

      const result = await setActiveNicheAction({}, fd)
      setPendingId(null)

      if (result.ok) {
        setSelected(nextId)
        setSavedAt(nextId ? NICHE_PRESETS[nextId].name : 'Cleared')
        router.refresh()
        setTimeout(() => setSavedAt(null), 2500)
      } else if (result.ok === false) {
        setError(result.error)
      }
    })
  }

  const presetEntries = Object.values(NICHE_PRESETS)
  const activeName = selected ? NICHE_PRESETS[selected].name : null

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="text-primary">02</span> · Niche preset
          <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground/70">
            {savedAt
              ? `${savedAt === 'Cleared' ? 'cleared' : `${savedAt} active`}`
              : activeName
                ? `${activeName} active`
                : 'none active — pick one to apply industry tone'}
          </span>
        </p>
        {selected !== null ? (
          <button
            type="button"
            onClick={() => choose('')}
            disabled={isPending}
            className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            Clear selection
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {presetEntries.map((n) => {
          const isActive = selected === n.id
          const isLoading = pendingId === n.id && isPending

          return (
            <button
              key={n.id}
              type="button"
              onClick={() => choose(n.id)}
              disabled={isPending}
              className={`group relative flex flex-col gap-2.5 rounded-2xl border p-4 text-left transition-all disabled:opacity-80 ${
                isActive
                  ? 'border-primary/30 bg-primary/[0.04] shadow-md shadow-primary/[0.06] ring-1 ring-primary/15'
                  : 'border-border/60 bg-card shadow-sm shadow-primary/[0.02] hover:-translate-y-px hover:border-border hover:shadow-md hover:shadow-primary/[0.04]'
              }`}
            >
              {/* Active indicator pill */}
              {isActive ? (
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  Active
                </span>
              ) : isLoading ? (
                <span className="absolute right-3 top-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                </span>
              ) : (
                <span className="absolute right-3 top-3 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/0 transition-colors group-hover:text-primary">
                  Apply →
                </span>
              )}

              <div className="flex items-start gap-3 pr-16">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-[20px] shadow-sm"
                  aria-hidden
                >
                  {n.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-foreground">{n.name}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
                    {n.description}
                  </p>
                </div>
              </div>

              {/* Tone preview as a mono data-sheet block */}
              <div className="mt-auto rounded-lg border border-border/40 bg-muted/30 px-2.5 py-1.5">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Tone
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-foreground/80">
                  {n.tone}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
        <span className="text-muted-foreground/50">↳</span> Layered on top of platform templates · changes apply to new drafts immediately
      </p>
    </section>
  )
}
