import { redirect } from 'next/navigation'

/**
 * Legacy route — Calendar is now a view mode on the Schedule page.
 * Redirect to /schedule?view=calendar so old bookmarks keep working.
 */
export default function CalendarPage({ params }: { params: { id: string } }) {
  redirect(`/workspace/${params.id}/schedule?view=calendar`)
}
