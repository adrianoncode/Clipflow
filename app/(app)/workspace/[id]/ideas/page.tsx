import { redirect } from 'next/navigation'

/**
 * Legacy route — Ideas is now a tab on the Discover hub.
 * Redirect so old bookmarks keep working.
 */
export default function IdeasPage({ params }: { params: { id: string } }) {
  redirect(`/workspace/${params.id}/discover?tab=ideas`)
}
