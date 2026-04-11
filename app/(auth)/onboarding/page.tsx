import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Welcome',
}

export default function OnboardingPlaceholderPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to Clipflow</CardTitle>
        <CardDescription>
          Full onboarding ships in Milestone 2 — workspace type selection and AI key setup. For
          now, jump straight into your personal workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
