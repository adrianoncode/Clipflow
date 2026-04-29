'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Rss } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RssInputForm } from '@/components/content/rss-input-form'
import { VoiceRecorder } from '@/components/content/voice-recorder'

/**
 * "Other sources" drawer — escape hatch for the small minority of imports
 * that don't fit the canonical Smart-Paste-Box flow:
 *
 *   - Record   (browser audio capture, no file to paste)
 *   - RSS feed (recurring auto-pull, not a one-shot paste)
 *
 * Smart-paste covers YouTube / URL / drag-drop file / text. Anything that
 * needs a multi-step setup or stateful capture lives here so it doesn't
 * clutter the primary import affordance.
 */
type Tab = 'record' | 'rss'

const TABS: { id: Tab; label: string; icon: typeof Mic; hint: string }[] = [
  {
    id: 'record',
    label: 'Record',
    icon: Mic,
    hint: 'Capture audio in the browser and auto-transcribe it.',
  },
  {
    id: 'rss',
    label: 'RSS feed',
    icon: Rss,
    hint: 'Pull the latest podcast episode or blog post from a feed URL.',
  },
]

interface OtherSourcesDrawerProps {
  workspaceId: string
  children: ReactNode
}

export function OtherSourcesDrawer({
  workspaceId,
  children,
}: OtherSourcesDrawerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Tab>('record')
  const activeTab = TABS.find((t) => t.id === active)!

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Other sources</DialogTitle>
          <DialogDescription>
            For inputs that need more than a paste — browser recording or a
            recurring feed pull.
          </DialogDescription>
        </DialogHeader>

        <div
          role="tablist"
          aria-label="Other source type"
          className="grid grid-cols-2 gap-1 rounded-2xl border border-border/60 bg-muted/30 p-1.5"
        >
          {TABS.map((t) => {
            const isActive = t.id === active
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(t.id)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[12.5px] font-bold tracking-tight transition-all ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                }`}
                style={{
                  fontFamily:
                    'var(--font-inter-tight), var(--font-inter), sans-serif',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>

        <p className="text-[12px] text-muted-foreground">{activeTab.hint}</p>

        <div className="space-y-4">
          {active === 'record' ? (
            <VoiceRecorder
              workspaceId={workspaceId}
              onCreated={(id) => {
                setOpen(false)
                router.push(`/workspace/${workspaceId}/content/${id}`)
              }}
            />
          ) : null}
          {active === 'rss' ? <RssInputForm workspaceId={workspaceId} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
