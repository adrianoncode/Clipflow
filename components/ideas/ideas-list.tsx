import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ContentIdea } from '@/app/(app)/workspace/[id]/ideas/actions'

interface IdeasListProps {
  ideas: ContentIdea[]
}

export function IdeasList({ ideas }: IdeasListProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{ideas.length} ideas generated</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ideas.map((idea, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-xs font-semibold text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <CardTitle className="text-sm leading-snug">{idea.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2 text-sm">
              <div>
                <p className="mb-0.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Hook</p>
                <p className="text-foreground">{idea.hook}</p>
              </div>
              <div className="mt-auto pt-2 border-t">
                <p className="text-xs text-muted-foreground">{idea.why}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
