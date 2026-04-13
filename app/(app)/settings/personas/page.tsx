export const metadata = { title: 'AI Personas' }
export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getPersonas } from '@/lib/personas/get-active-persona'
import { PersonaForm } from '@/components/settings/persona-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PersonaActions } from '@/components/settings/persona-actions'

const WORKSPACE_COOKIE = 'clipflow.current_workspace'

export default async function PersonasPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = cookies().get(WORKSPACE_COOKIE)?.value ?? ''
  if (!workspaceId) redirect('/dashboard')

  const personas = await getPersonas(workspaceId)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">AI Personas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create custom AI personas that go beyond brand voice — give the AI a name, backstory,
          expertise, and writing quirks. Every generated output will adopt the active persona.
        </p>
      </div>

      {/* Existing personas */}
      {personas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Your personas</h2>
          {personas.map((p) => (
            <Card key={p.id} className={p.is_active ? 'border-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {p.name}
                    {p.is_active && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Active
                      </span>
                    )}
                  </CardTitle>
                  <PersonaActions
                    workspaceId={workspaceId}
                    personaId={p.id}
                    isActive={p.is_active}
                  />
                </div>
                {p.backstory && (
                  <CardDescription className="line-clamp-2">{p.backstory}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-4">
                {p.expertise_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.expertise_areas.map((e) => (
                      <span key={e} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {e}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create new persona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {personas.length === 0 ? 'Create your first persona' : 'Add new persona'}
          </CardTitle>
          <CardDescription>
            Give the AI a distinct identity. Every output will be written as this persona.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonaForm workspaceId={workspaceId} />
        </CardContent>
      </Card>
    </div>
  )
}
