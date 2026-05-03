'use client'

import { useTransition, useState } from 'react'
import { Zap, Sparkles, FileText, Calendar, Loader2 } from 'lucide-react'

import { saveAgentSettingsAction } from '@/app/(app)/settings/agent/actions'

interface AgentSettingsFormProps {
  settings: {
    autoProcess: boolean
    autoHighlights: boolean
    autoDrafts: boolean
    autoSchedule: boolean
    defaultPublishPlatforms: string[]
    chatMaxCostDollars: number
    autopilotMaxCostDollars: number
  }
}

const TOGGLES = [
  {
    key: 'autoProcess' as const,
    label: 'Auto-Process',
    description: 'Automatically transcribe new content when it reaches "ready" status.',
    Icon: Zap,
  },
  {
    key: 'autoHighlights' as const,
    label: 'Auto-Highlights',
    description: 'Find viral moments in transcribed content without manual trigger.',
    Icon: Sparkles,
  },
  {
    key: 'autoDrafts' as const,
    label: 'Auto-Drafts',
    description: 'Generate drafts for content with highlights. Drafts go to review — never auto-approved.',
    Icon: FileText,
  },
  {
    key: 'autoSchedule' as const,
    label: 'Auto-Schedule',
    description: 'Schedule approved outputs automatically. Only works on human-approved drafts.',
    Icon: Calendar,
  },
] as const

const PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram_reels', label: 'Instagram Reels' },
  { value: 'youtube_shorts', label: 'YouTube Shorts' },
]

export function AgentSettingsForm({ settings }: AgentSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState(settings)
  const [saved, setSaved] = useState(false)

  const hasChanges = JSON.stringify(state) !== JSON.stringify(settings)

  function handleToggle(key: (typeof TOGGLES)[number]['key']) {
    setState((prev) => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  function handlePlatformToggle(platform: string) {
    setState((prev) => {
      const current = prev.defaultPublishPlatforms
      const next = current.includes(platform)
        ? current.filter((p) => p !== platform)
        : [...current, platform]
      return { ...prev, defaultPublishPlatforms: next.length > 0 ? next : current }
    })
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      await saveAgentSettingsAction(state)
      setSaved(true)
    })
  }

  return (
    <div>
      {TOGGLES.map((toggle) => (
        <div
          key={toggle.key}
          className="group relative flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-primary/[0.025] sm:px-6 sm:py-5 [&+&]:border-t [&+&]:border-border/60"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-1/2 h-8 w-[2px] -translate-y-1/2 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="hidden shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground/80 transition-colors group-hover:border-primary/30 group-hover:text-primary sm:inline-flex"
              style={{ width: 32, height: 32 }}
            >
              <toggle.Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-[13.5px] font-semibold leading-tight text-foreground">
                {toggle.label}
              </p>
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                {toggle.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state[toggle.key]}
            onClick={() => handleToggle(toggle.key)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              state[toggle.key] ? 'bg-[#0F0F0F]' : 'bg-[#0F0F0F]/20'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                state[toggle.key] ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}

      {/* Default platforms for auto-drafts */}
      <div className="border-t border-border/60 px-5 py-4 sm:px-6 sm:py-5">
        <p className="mb-2 text-[13.5px] font-semibold leading-tight text-foreground">
          Default draft platforms
        </p>
        <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">
          Which platforms to generate drafts for when auto-drafts runs.
        </p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active = state.defaultPublishPlatforms.includes(p.value)
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePlatformToggle(p.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'border-[#0F0F0F] bg-[#0F0F0F] text-white'
                    : 'border-border/60 bg-background text-muted-foreground hover:border-[#0F0F0F]/40'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Budget caps */}
      <div className="border-t border-border/60 px-5 py-4 sm:px-6 sm:py-5">
        <p className="mb-3 text-[13.5px] font-semibold leading-tight text-foreground">
          Cost limits
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="chat-cost"
              className="mb-1 block text-[12.5px] text-muted-foreground"
            >
              Chat max per conversation
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                id="chat-cost"
                type="number"
                step="0.1"
                min="0.01"
                max="50"
                value={state.chatMaxCostDollars}
                onChange={(e) => {
                  setState((prev) => ({
                    ...prev,
                    chatMaxCostDollars: Number(e.target.value) || 0.5,
                  }))
                  setSaved(false)
                }}
                className="w-24 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm outline-none transition focus:border-[#0F0F0F]/40"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="autopilot-cost"
              className="mb-1 block text-[12.5px] text-muted-foreground"
            >
              Auto-pilot max per run
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">$</span>
              <input
                id="autopilot-cost"
                type="number"
                step="0.5"
                min="0.10"
                max="100"
                value={state.autopilotMaxCostDollars}
                onChange={(e) => {
                  setState((prev) => ({
                    ...prev,
                    autopilotMaxCostDollars: Number(e.target.value) || 5,
                  }))
                  setSaved(false)
                }}
                className="w-24 rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm outline-none transition focus:border-[#0F0F0F]/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="border-t border-border/60 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="text-[12px] text-muted-foreground">
            {saved ? (
              <span className="text-emerald-600">Settings saved.</span>
            ) : hasChanges ? (
              <span>Unsaved changes</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="flex items-center gap-2 rounded-xl bg-[#0F0F0F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0F0F0F]/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : null}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
