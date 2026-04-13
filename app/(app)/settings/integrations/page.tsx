import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  Webhook,
  Bell,
  Cloud,
  FileText,
  Podcast,
  Video,
  Palette,
  Table2,
  Globe,
  MessageSquare,
  Mail,
  Zap,
  Mic,
  Image,
  Film,
  Bot,
} from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { ConnectDialog } from '@/components/integrations/connect-dialog'

export const metadata = { title: 'Integrations' }
export const dynamic = 'force-dynamic'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'

type IntegrationStatus = 'connected' | 'available' | 'coming_soon'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  status: IntegrationStatus
  color: string
  bg: string
  configKey?: string // env var that needs to be set
}

const INTEGRATIONS: Integration[] = [
  // AI Providers
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o, Whisper transcription, DALL-E thumbnails', icon: Bot, category: 'AI Providers', status: 'available', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude models for content generation', icon: Bot, category: 'AI Providers', status: 'available', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'google-ai', name: 'Google Gemini', description: 'Gemini models for generation', icon: Bot, category: 'AI Providers', status: 'available', color: 'text-blue-400', bg: 'bg-blue-400/10' },

  // Social Platforms
  { id: 'tiktok', name: 'TikTok', description: 'Publish and schedule TikTok videos', icon: Video, category: 'Social Platforms', status: 'available', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { id: 'instagram', name: 'Instagram', description: 'Post Reels and carousels to Instagram', icon: Image, category: 'Social Platforms', status: 'available', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'linkedin', name: 'LinkedIn', description: 'Share posts and articles on LinkedIn', icon: Globe, category: 'Social Platforms', status: 'available', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'youtube', name: 'YouTube', description: 'Upload Shorts and manage videos', icon: Video, category: 'Social Platforms', status: 'available', color: 'text-red-400', bg: 'bg-red-400/10' },

  // Video & Media
  { id: 'shotstack', name: 'Shotstack', description: 'Cloud video rendering — captions, B-Roll, clipping', icon: Film, category: 'Video & Media', status: 'available', color: 'text-violet-400', bg: 'bg-violet-400/10', configKey: 'SHOTSTACK_API_KEY' },
  { id: 'elevenlabs', name: 'ElevenLabs', description: 'Voice cloning and text-to-speech', icon: Mic, category: 'Video & Media', status: 'available', color: 'text-cyan-400', bg: 'bg-cyan-400/10', configKey: 'ELEVENLABS_API_KEY' },
  { id: 'pexels', name: 'Pexels', description: 'Free stock footage for AI B-Roll', icon: Image, category: 'Video & Media', status: 'available', color: 'text-green-400', bg: 'bg-green-400/10', configKey: 'PEXELS_API_KEY' },
  { id: 'd-id', name: 'D-ID', description: 'AI avatar video generation', icon: Video, category: 'Video & Media', status: 'available', color: 'text-amber-400', bg: 'bg-amber-400/10', configKey: 'DID_API_KEY' },

  // Import Sources
  { id: 'google-drive', name: 'Google Drive', description: 'Import videos and documents from Drive', icon: Cloud, category: 'Import', status: 'available', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'dropbox', name: 'Dropbox', description: 'Import files from Dropbox', icon: Cloud, category: 'Import', status: 'coming_soon', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'notion', name: 'Notion', description: 'Sync content ideas and calendars', icon: FileText, category: 'Import', status: 'available', color: 'text-neutral-300', bg: 'bg-neutral-300/10' },
  { id: 'zoom', name: 'Zoom', description: 'Import meeting recordings', icon: Video, category: 'Import', status: 'coming_soon', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'spotify', name: 'Spotify Podcasts', description: 'Import podcast episodes via RSS', icon: Podcast, category: 'Import', status: 'available', color: 'text-green-400', bg: 'bg-green-400/10' },

  // Export & Publish
  { id: 'wordpress', name: 'WordPress', description: 'Publish blog posts directly', icon: Globe, category: 'Export', status: 'available', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'beehiiv', name: 'Beehiiv', description: 'Publish newsletters directly', icon: Mail, category: 'Export', status: 'available', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'substack', name: 'Substack', description: 'Push newsletters to Substack', icon: Mail, category: 'Export', status: 'coming_soon', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'medium', name: 'Medium', description: 'Publish articles to Medium', icon: FileText, category: 'Export', status: 'available', color: 'text-neutral-300', bg: 'bg-neutral-300/10' },
  { id: 'canva', name: 'Canva', description: 'Edit thumbnails and carousels in Canva', icon: Palette, category: 'Export', status: 'coming_soon', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },

  // Notifications & Automation
  { id: 'slack', name: 'Slack', description: 'Get notified when outputs are ready', icon: MessageSquare, category: 'Notifications', status: 'available', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'discord', name: 'Discord', description: 'Post updates to your Discord server', icon: MessageSquare, category: 'Notifications', status: 'available', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'resend', name: 'Email (Resend)', description: 'Email notifications and review alerts', icon: Mail, category: 'Notifications', status: 'available', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'zapier', name: 'Zapier', description: 'Connect 5000+ apps via webhooks', icon: Zap, category: 'Automation', status: 'available', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'make', name: 'Make (Integromat)', description: 'Advanced workflow automation', icon: Webhook, category: 'Automation', status: 'available', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { id: 'n8n', name: 'n8n', description: 'Self-hosted workflow automation', icon: Webhook, category: 'Automation', status: 'available', color: 'text-red-400', bg: 'bg-red-400/10' },

  // Data & Analytics
  { id: 'google-sheets', name: 'Google Sheets', description: 'Export analytics and content data', icon: Table2, category: 'Data', status: 'available', color: 'text-green-400', bg: 'bg-green-400/10' },
  { id: 'airtable', name: 'Airtable', description: 'Sync content calendar to Airtable', icon: Table2, category: 'Data', status: 'available', color: 'text-blue-400', bg: 'bg-blue-400/10' },
]

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === 'connected') {
    return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">Connected</span>
  }
  if (status === 'available') {
    return <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">Available</span>
  }
  return <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Coming soon</span>
}

export default async function IntegrationsPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = cookies().get(WORKSPACE_COOKIE)?.value ?? ''

  // Read connected integrations from workspace branding
  let connectedIds: Set<string> = new Set()
  if (workspaceId) {
    try {
      const supabase = createClient()
      const { data: ws } = await supabase
        .from('workspaces')
        .select('branding')
        .eq('id', workspaceId)
        .single()
      const branding = (ws?.branding ?? {}) as Record<string, unknown>
      const integrations = (branding.integrations ?? {}) as Record<string, unknown>
      connectedIds = new Set(Object.keys(integrations))
    } catch { /* ignore */ }
  }

  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))]

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Clipflow with your favorite tools. Import content, export drafts, automate workflows.
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {INTEGRATIONS.filter((i) => i.status === 'available' || i.status === 'connected').length} available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            {INTEGRATIONS.filter((i) => i.status === 'coming_soon').length} coming soon
          </span>
        </div>
      </div>

      {categories.map((category) => {
        const items = INTEGRATIONS.filter((i) => i.category === category)
        return (
          <div key={category}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{category}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((integration) => {
                const isConnected = connectedIds.has(integration.id)
                const effectiveStatus = isConnected ? 'connected' as const : integration.status
                return (
                  <Card
                    key={integration.id}
                    className={`border-border/50 transition-all ${
                      isConnected ? 'border-emerald-500/30' : effectiveStatus === 'coming_soon' ? 'opacity-60' : 'hover:border-border hover:bg-accent/30'
                    }`}
                  >
                    <CardContent className="flex flex-col p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${integration.bg}`}>
                          <integration.icon className={`h-4 w-4 ${integration.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold truncate">{integration.name}</p>
                            <StatusBadge status={effectiveStatus} />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{integration.description}</p>
                        </div>
                      </div>
                      {/* Connect / Manage button */}
                      {effectiveStatus !== 'coming_soon' && workspaceId && (
                        <div className="mt-3 flex justify-end">
                          <ConnectDialog
                            integrationId={integration.id}
                            integrationName={integration.name}
                            workspaceId={workspaceId}
                            isConnected={isConnected}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
