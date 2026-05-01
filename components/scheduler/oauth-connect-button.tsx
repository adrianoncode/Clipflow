'use client'

import { Instagram, Linkedin, Music2, Youtube, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface Props {
  platform: 'tiktok' | 'instagram' | 'linkedin' | 'youtube'
  label: string
  workspaceId: string
  connectedUsername?: string | null
  isConfigured: boolean
}

// Platform marks via lucide-react. Emojis (♪ 📷 💼 ▶) read as v0.1
// placeholder on macOS where they render as full-color Apple emoji
// against the rest of the monochrome icon set; SVG keeps weight
// uniform and is also trademark-safer.
const PLATFORM_STYLES: Record<
  string,
  { bg: string; text: string; Icon: LucideIcon }
> = {
  tiktok: { bg: 'bg-[#010101] hover:bg-[#1a1a1a]', text: 'text-white', Icon: Music2 },
  instagram: {
    bg: 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400',
    text: 'text-white',
    Icon: Instagram,
  },
  linkedin: { bg: 'bg-[#0077b5] hover:bg-[#006399]', text: 'text-white', Icon: Linkedin },
  youtube: { bg: 'bg-[#ff0000] hover:bg-[#cc0000]', text: 'text-white', Icon: Youtube },
}

export function OAuthConnectButton({ platform, label, workspaceId, connectedUsername, isConfigured }: Props) {
  const style = PLATFORM_STYLES[platform] ?? {
    bg: 'bg-primary',
    text: 'text-white',
    Icon: Music2,
  }
  const { Icon } = style

  if (connectedUsername) {
    return (
      <div className="flex items-center justify-between rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" aria-hidden />
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-emerald-500">Connected as @{connectedUsername}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.location.href = `/api/oauth/connect?platform=${platform}&workspace_id=${workspaceId}`
          }}
        >
          Reconnect
        </Button>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed bg-card p-4 opacity-60">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" aria-hidden />
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">OAuth not configured yet</p>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled>
          Coming soon
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" aria-hidden />
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">Not connected</p>
        </div>
      </div>
      <Button
        size="sm"
        className={`${style.bg} ${style.text} border-0`}
        onClick={() => {
          window.location.href = `/api/oauth/connect?platform=${platform}&workspace_id=${workspaceId}`
        }}
      >
        Connect {label}
      </Button>
    </div>
  )
}
