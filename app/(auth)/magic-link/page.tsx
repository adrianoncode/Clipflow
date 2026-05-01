import Link from 'next/link'
import { Mail } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { MagicLinkForm } from '@/components/auth/magic-link-form'

export const metadata = {
  title: 'Magic link',
}

export default function MagicLinkPage() {
  return (
    <Card className="border-border/60 shadow-xl shadow-primary/5">
      <CardHeader className="space-y-3 pb-3 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Sign in with magic link
          </h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ll email a one-time sign-in link. No password required.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <MagicLinkForm />
        <p className="text-center text-sm text-muted-foreground">
          Prefer a password?{' '}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in with password
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
