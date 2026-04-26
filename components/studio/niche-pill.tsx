'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Loader2, Pencil, Sparkles, Target } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { setActiveNicheAction } from '@/app/(app)/settings/templates/actions'
import { NICHE_PRESETS, type NicheId } from '@/lib/niche/presets'

interface NichePillProps {
  workspaceId: string
  niche: NicheId | null
}

export function NichePill({ workspaceId, niche }: NichePillProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [optimistic, setOptimistic] = useState<NicheId | null>(niche)

  function choose(next: NicheId | '') {
    setError(null)
    setPendingId(next || 'clear')
    const nextId = next === '' ? null : next
    setOptimistic(nextId)

    startTransition(async () => {
      const fd = new FormData()
      fd.set('workspace_id', workspaceId)
      fd.set('niche', next)
      const res = await setActiveNicheAction({}, fd)
      setPendingId(null)
      if (res.ok) {
        router.refresh()
        setTimeout(() => setOpen(false), 250)
      } else if (res.ok === false) {
        setError(res.error)
        setOptimistic(niche) // rollback
      }
    })
  }

  const active = optimistic ? NICHE_PRESETS[optimistic] : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative flex flex-col gap-2.5 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm shadow-primary/[0.02] transition-all hover:-translate-y-px hover:border-border hover:shadow-md hover:shadow-primary/[0.04]"
        >
          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Target className="h-3.5 w-3.5" />
          </span>

          <div className="pr-8">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Niche
            </p>
            <p className="mt-1 text-[14px] font-bold text-foreground">
              {active ? active.name : 'No niche set'}
            </p>
          </div>

          {active ? (
            <p className="line-clamp-2 text-[12px] leading-snug text-muted-foreground">
              <span className="mr-1 text-[14px] align-middle">{active.emoji}</span>
              {active.description}
            </p>
          ) : (
            <p className="text-[12px] leading-snug text-muted-foreground">
              Pick an industry preset — applied on top of the platform template.
            </p>
          )}

          <span className="mt-auto inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70 group-hover:text-primary">
            <Pencil className="h-2.5 w-2.5" />
            {active ? 'Swap' : 'Pick one'}
            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[18px]">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="h-4 w-4" />
            </span>
            Niche preset
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Layered on every generation — picks tone defaults that fit your industry. Click to apply.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            {error}
          </p>
        ) : null}

        <div className="grid gap-2.5 sm:grid-cols-2">
          {Object.values(NICHE_PRESETS).map((n) => {
            const isActive = optimistic === n.id
            const isLoading = pendingId === n.id && isPending
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => choose(n.id)}
                disabled={isPending}
                className={`group/card relative flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all disabled:opacity-80 ${
                  isActive
                    ? 'border-primary/30 bg-primary/[0.04] ring-1 ring-primary/15'
                    : 'border-border/60 bg-card hover:-translate-y-px hover:border-border hover:shadow-sm'
                }`}
              >
                {isActive ? (
                  <span className="absolute right-2 top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                ) : isLoading ? (
                  <Loader2 className="absolute right-2 top-2 h-3.5 w-3.5 animate-spin text-primary" />
                ) : null}

                <div className="flex items-center gap-2 pr-6">
                  <span className="text-[16px]" aria-hidden>
                    {n.emoji}
                  </span>
                  <p className="text-[12.5px] font-bold text-foreground">{n.name}</p>
                </div>
                <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                  {n.description}
                </p>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <button
            type="button"
            onClick={() => choose('')}
            disabled={isPending || !optimistic}
            className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-destructive disabled:opacity-30"
          >
            Clear selection
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Auto-saves on click
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
