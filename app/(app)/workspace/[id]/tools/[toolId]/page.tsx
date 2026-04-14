import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth/get-user'
import { ToolPage } from '@/components/tools/tool-page'

export const dynamic = 'force-dynamic'

const VALID_TOOLS = [
  'content-dna', 'full-repurpose', 'viral-hooks', 'thumbnails',
  'engagement-replies', 'hashtag-research', 'content-recycler',
  'visual-storyboard', 'collab-finder',
]

export async function generateMetadata({ params }: { params: { toolId: string } }) {
  const labels: Record<string, string> = {
    'content-dna': 'Content DNA Analyzer',
    'full-repurpose': 'One-Click Full Repurpose',
    'viral-hooks': 'Viral Hook Database',
    'thumbnails': 'AI Thumbnails',
    'engagement-replies': 'Reply Generator',
    'hashtag-research': 'Hashtag Research',
    'content-recycler': 'Content Recycler',
    'visual-storyboard': 'Visual Storyboard',
    'collab-finder': 'Collab Finder',
  }
  return { title: labels[params.toolId] ?? 'AI Tool' }
}

export default async function ToolDetailPage({ params }: { params: { id: string; toolId: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  if (!VALID_TOOLS.includes(params.toolId)) notFound()

  const workspaceId = params.id

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
      <ToolPage toolId={params.toolId} workspaceId={workspaceId} />
    </div>
  )
}
