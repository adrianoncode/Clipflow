import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PlaceholderSectionProps {
  title: string
  description: string
}

export function PlaceholderSection({ title, description }: PlaceholderSectionProps) {
  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Coming soon.</CardContent>
      </Card>
    </div>
  )
}
