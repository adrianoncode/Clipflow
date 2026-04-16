import { redirect } from 'next/navigation'

// Legacy route — redirect to unified /research surface
export default function CreatorsRedirect({ params }: { params: { id: string } }) {
  redirect(`/workspace/${params.id}/research?tab=creators`)
}
