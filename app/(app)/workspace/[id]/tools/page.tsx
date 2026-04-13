import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  Dna,
  Zap,
  Sparkles,
  ImageIcon,
  MessageCircle,
  Hash,
  Recycle,
  Film,
  Users,
} from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'

export const metadata = { title: 'AI Tools' }
export const dynamic = 'force-dynamic'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'

const TOOLS = [
  {
    id: 'content-dna',
    icon: Dna,
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
    name: 'Content DNA',
    description: 'Analyze your best content and extract your winning formula — hooks, structure, tone, and topics.',
    tag: 'Strategy',
  },
  {
    id: 'full-repurpose',
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
    name: 'Full Repurpose',
    description: 'One click → 4 platform drafts + newsletter + carousel + YouTube chapters + blog post. All parallel.',
    tag: 'Core',
  },
  {
    id: 'viral-hooks',
    icon: Sparkles,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
    name: 'Viral Hooks',
    description: 'Search 25+ proven hook templates by niche, emotion, and platform. Copy and customize instantly.',
    tag: 'Hooks',
  },
  {
    id: 'thumbnails',
    icon: ImageIcon,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    name: 'AI Thumbnails',
    description: 'Generate 3 thumbnail concepts with DALL-E. Automatic image generation with OpenAI key.',
    tag: 'Visual',
  },
  {
    id: 'engagement-replies',
    icon: MessageCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    name: 'Reply Generator',
    description: 'Paste your top comments → AI drafts engaging replies that boost discussion and followers.',
    tag: 'Engagement',
  },
  {
    id: 'hashtag-research',
    icon: Hash,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    border: 'border-cyan-400/20',
    name: 'Hashtag Research',
    description: 'Data-driven hashtag analysis: reach estimates, competition levels, 3 ready-to-use sets.',
    tag: 'Discovery',
  },
  {
    id: 'content-recycler',
    icon: Recycle,
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
    name: 'Content Recycler',
    description: 'Remix old content with fresh hooks and current trends. 3 new angles from one original.',
    tag: 'Growth',
  },
  {
    id: 'visual-storyboard',
    icon: Film,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    border: 'border-indigo-400/20',
    name: 'Visual Storyboard',
    description: 'Script → scene-by-scene storyboard with AI-generated image prompts for each scene.',
    tag: 'Production',
  },
  {
    id: 'collab-finder',
    icon: Users,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    name: 'Collab Finder',
    description: 'AI suggests ideal collaboration partners with outreach templates and content ideas.',
    tag: 'Network',
  },
]

export default async function ToolsPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">AI Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Advanced AI-powered tools to research, create, optimize, and grow your content.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/workspace/${params.id}/tools/${tool.id}`}
            className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:bg-accent/30"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tool.bg} ${tool.border} border`}>
                <tool.icon className={`h-4 w-4 ${tool.color}`} />
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {tool.tag}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold group-hover:text-foreground">{tool.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {tool.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
