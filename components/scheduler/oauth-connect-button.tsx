'use client'

import { Button } from '@/components/ui/button'

interface Props {
  platform: 'tiktok' | 'instagram' | 'linkedin' | 'youtube'
  label: string
  workspaceId: string
  connectedUsername?: string | null
  isConfigured: boolean
}

const PLATFORM_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  tiktok: { bg: 'bg-[#010101] hover:bg-[#1a1a1a]', text: 'text-white', icon: '♪' },
  instagram: { bg: 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400', text: 'text-white', icon: '📷' },
  linkedin: { bg: 'bg-[#0077b5] hover:bg-[#006399]', text: 'text-white', icon: '💼' },
  youtube: { bg: 'bg-[#ff0000] hover:bg-[#cc0000]', text: 'text-white', icon: '▶' },
}

export function OAuthConnectButton({ platform, label, workspaceId, connectedUsername, isConfigured }: Props) {
  const style = PLATFORM_STYLES[platform] ?? { bg: 'bg-primary', text: 'text-white', icon: '🔗' }

  if (connectedUsername) {
    return (
      <div className="flex items-center justify-between rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">{style.icon}</span>
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
          <span className="text-lg">{style.icon}</span>
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
        <span className="text-lg">{style.icon}</span>
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
