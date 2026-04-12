'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  updateOutputAction,
  type UpdateOutputState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import type { OutputRow } from '@/lib/content/get-outputs'
import type { PromptOutput } from '@/lib/ai/generate/types'

interface EditOutputDialogProps {
  output: OutputRow
  open: boolean
  onOpenChange: (open: boolean) => void
}

const initialState: UpdateOutputState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </Button>
  )
}

export function EditOutputDialog({ output, open, onOpenChange }: EditOutputDialogProps) {
  const [state, formAction] = useFormState(updateOutputAction, initialState)

  // Close dialog when save succeeds.
  useEffect(() => {
    if (state.ok === true) {
      onOpenChange(false)
    }
  }, [state, onOpenChange])

  // Pull structured fields from metadata — safe cast, shape is known.
  const structured = (output.metadata as { structured?: PromptOutput })?.structured ?? {
    hook: '',
    script: '',
    caption: '',
    hashtags: [],
  }

  const isLinkedin = output.platform === 'linkedin'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit output</DialogTitle>
          <DialogDescription>
            Changes are saved immediately and update the rendered card.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="output_id" value={output.id} />
          <input type="hidden" name="workspace_id" value={output.workspace_id} />
          <input type="hidden" name="platform" value={output.platform} />

          {!isLinkedin && (
            <>
              <div className="space-y-1">
                <Label htmlFor="hook">Hook</Label>
                <Input
                  id="hook"
                  name="hook"
                  defaultValue={structured.hook}
                  placeholder="Opening line that stops the scroll"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="script">Script</Label>
                <Textarea
                  id="script"
                  name="script"
                  defaultValue={structured.script}
                  placeholder="Main body of the video script"
                  className="min-h-[120px]"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="caption">{isLinkedin ? 'Post' : 'Caption'}</Label>
            <Textarea
              id="caption"
              name="caption"
              defaultValue={structured.caption}
              placeholder={isLinkedin ? 'Your LinkedIn post…' : 'Caption for this platform'}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input
              id="hashtags"
              name="hashtags"
              defaultValue={structured.hashtags.join(', ')}
              placeholder="marketing, video, growth (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">Comma-separated, without the # prefix.</p>
          </div>

          {state.ok === false && (
            <FormMessage variant="error">{state.error}</FormMessage>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
