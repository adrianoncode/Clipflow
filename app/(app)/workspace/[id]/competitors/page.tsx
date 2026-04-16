import { redirect } from 'next/navigation'

// Legacy route — redirect to unified /research surface
export default function CompetitorsRedirect({ params }: { params: { id: string } }) {
  redirect(`/workspace/${params.id}/research?tab=competitors`)
}
