import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getUser } from '@/lib/auth/get-user'
import { isMfaSatisfied } from '@/lib/auth/mfa'
import { MfaChallengeForm } from '@/components/auth/mfa-challenge-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Two-factor verification' }

interface Props {
  searchParams: { next?: string }
}

export default async function MfaChallengePage({ searchParams }: Props) {
  const user = await getUser()
  if (!user) redirect('/login')

  const status = await isMfaSatisfied()
  // Already satisfied OR not required — send to dashboard / original target.
  if (status.satisfied || !status.requiresMfa) {
    const next = searchParams.next && searchParams.next.startsWith('/') ? searchParams.next : '/dashboard'
    redirect(next)
  }

  return (
    <Card className="border-border/60 shadow-xl shadow-primary/5">
      <CardHeader className="space-y-3 pb-3 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Two-factor verification
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <MfaChallengeForm next={searchParams.next} />
      </CardContent>
    </Card>
  )
}
