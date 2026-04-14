'use client'

/**
 * Light-mode-only wrapper. We formerly ran next-themes here and exposed
 * a dark mode, but the UI was never tuned for dark so contrast and
 * muted-foreground tokens looked broken in practice. This component is
 * now a no-op pass-through — kept only so existing imports continue to
 * work. Remove entirely when we're sure nothing else references it.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
