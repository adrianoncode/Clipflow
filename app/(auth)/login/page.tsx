import { Suspense } from 'react'
import Link from 'next/link'
import { LogIn } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="space-y-4 text-center pb-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <LogIn className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your workspace</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <Link href="/magic-link" className="underline-offset-4 hover:underline hover:text-foreground transition-colors">
            Sign in with a magic link instead
          </Link>
          <div>
            New to Clipflow?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
