import { redirect } from 'next/navigation'

/**
 * Legacy route — Trends is now a tab on the Discover hub.
 * Redirect so old bookmarks keep working.
 */
export default function TrendsPage({ params }: { params: { id: string } }) {
  redirect(`/workspace/${params.id}/discover`)
}
