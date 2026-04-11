import { Suspense } from 'react'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Sign in',
}

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Enter your email and password to access your workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* LoginForm uses useSearchParams() — Next 14 requires it to be
            wrapped in a Suspense boundary so the rest of the page can still
            be statically prerendered. */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <Link href="/magic-link" className="underline-offset-4 hover:underline">
            Sign in with a magic link instead
          </Link>
          <div>
            New to Clipflow?{' '}
            <Link href="/signup" className="font-medium text-foreground hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
