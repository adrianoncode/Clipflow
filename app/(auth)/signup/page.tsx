import Link from 'next/link'
import { UserPlus } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata = { title: 'Create account' }

export default function SignupPage() {
  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="space-y-4 text-center pb-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
          <UserPlus className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Start repurposing content in under 2 minutes. Free forever.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <SignupForm />
        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
