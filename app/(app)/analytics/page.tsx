import { redirect } from 'next/navigation'

// /analytics is now part of /dashboard. Redirect keeps existing
// bookmarks, notification links, and external references working.
export default function AnalyticsRedirectPage() {
  redirect('/dashboard')
}
