'use client'

import { Button } from '@/components/ui/button'

export function SignoutButton() {
  return (
    <form action="/api/auth/signout" method="post">
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
  )
}
