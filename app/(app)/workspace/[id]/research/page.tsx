import { redirect } from 'next/navigation'

/**
 * Legacy route — Research is now a tab on the Discover hub.
 * Redirect so old bookmarks keep working.
 */
export default function ResearchPage({ params }: { params: { id: string } }) {
  redirect(`/workspace/${params.id}/discover?tab=research`)
}
