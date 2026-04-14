import { Suspense } from 'react'
import Link from 'next/link'
import { LogIn } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <Card className="border-border/60 shadow-xl shadow-primary/5">
      <CardHeader className="space-y-3 pb-3 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
          <LogIn className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        {/* Secondary options — magic link as a divider, signup as a quieter link */}
        <div className="relative flex items-center justify-center py-1">
          <span aria-hidden className="absolute inset-x-0 h-px bg-border/60" />
          <span className="relative bg-card px-3 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            or
          </span>
        </div>

        <Link
          href="/magic-link"
          className="flex h-10 w-full items-center justify-center rounded-lg border border-border/60 bg-background text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
        >
          Email me a magic link
        </Link>

        <p className="text-center text-sm text-muted-foreground">
          New to Clipflow?{' '}
          <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
