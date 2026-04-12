'use client'

import { useFormState } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { upsertPersonaAction, type UpsertPersonaState } from '@/app/(app)/settings/personas/actions'
import type { AiPersona } from '@/lib/personas/get-active-persona'

interface PersonaFormProps {
  workspaceId: string
  persona?: AiPersona
}

export function PersonaForm({ workspaceId, persona }: PersonaFormProps) {
  const initialState: UpsertPersonaState = {}
  const [state, formAction] = useFormState(upsertPersonaAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      {persona && <input type="hidden" name="persona_id" value={persona.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="name">Persona name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Tech Sarah, Startup Steve"
          defaultValue={persona?.name ?? ''}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="backstory">Backstory</Label>
        <Textarea
          id="backstory"
          name="backstory"
          placeholder="Who is this persona? What's their background, experience, and perspective?"
          defaultValue={persona?.backstory ?? ''}
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="expertise_areas">Areas of expertise (comma-separated)</Label>
        <Input
          id="expertise_areas"
          name="expertise_areas"
          placeholder="e.g. SaaS growth, content marketing, bootstrapping"
          defaultValue={persona?.expertise_areas.join(', ') ?? ''}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="writing_quirks">Writing style & quirks</Label>
        <Textarea
          id="writing_quirks"
          name="writing_quirks"
          placeholder="e.g. Uses short sentences. Never uses emojis. Starts posts with a contrarian take."
          defaultValue={persona?.writing_quirks ?? ''}
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="example_responses">Example of how this persona writes</Label>
        <Textarea
          id="example_responses"
          name="example_responses"
          placeholder="Paste 1-2 examples of posts/scripts written in this persona's voice..."
          defaultValue={persona?.example_responses ?? ''}
          rows={4}
        />
      </div>

      {state.ok === false && <FormMessage variant="error">{state.error}</FormMessage>}
      {state.ok === true && <FormMessage variant="success">Persona saved!</FormMessage>}

      <Button type="submit">{persona ? 'Update persona' : 'Create persona'}</Button>
    </form>
  )
}
