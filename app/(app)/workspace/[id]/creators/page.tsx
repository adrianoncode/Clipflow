import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/get-user'
import { CreatorSearchClient } from '@/components/creators/creator-search-client'

export const metadata = { title: 'Creator Search' }
export const dynamic = 'force-dynamic'

export default async function CreatorsPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Creator Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find creators by niche on YouTube, TikTok, and Instagram. Analyze their stats, content strategy, and find collaboration partners.
        </p>
      </div>
      <CreatorSearchClient workspaceId={params.id} />
    </div>
  )
}
