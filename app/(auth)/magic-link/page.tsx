import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MagicLinkForm } from '@/components/auth/magic-link-form'

export const metadata = {
  title: 'Magic link',
}

export default function MagicLinkPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign in with magic link</CardTitle>
        <CardDescription>
          We&apos;ll send a one-time sign-in link to your email. No password required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <MagicLinkForm />
        <div className="text-center text-sm text-muted-foreground">
          Prefer a password?{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in with password
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
