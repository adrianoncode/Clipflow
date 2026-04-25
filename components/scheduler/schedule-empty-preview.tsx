/**
 * Mini week-view preview shown inside the Schedule empty state. Five
 * weekday columns with a few "scheduled post" cards so the user
 * immediately sees the calendar metaphor instead of a centered icon.
 */

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']

const POSTS: Record<string, Array<{ time: string; title: string; tone: 'tk' | 'ig' | 'yt' | 'li' }>> = {
  MON: [
    { time: '09:00', title: '“The 3 metrics…”', tone: 'tk' },
    { time: '17:30', title: 'Q3 sync caption', tone: 'li' },
  ],
  TUE: [{ time: '12:00', title: 'Founder reflection', tone: 'ig' }],
  WED: [],
  THU: [
    { time: '09:00', title: 'Pricing thread', tone: 'tk' },
    { time: '14:00', title: 'Carousel — onboard', tone: 'ig' },
  ],
  FRI: [{ time: '11:00', title: 'Short — “We cut churn”', tone: 'yt' }],
}

const TONE: Record<string, string> = {
  tk: 'bg-zinc-900 text-white',
  ig: 'bg-gradient-to-br from-amber-300 via-rose-400 to-fuchsia-500 text-white',
  yt: 'bg-red-500 text-white',
  li: 'bg-blue-700 text-white',
}

export function ScheduleEmptyPreview() {
  return (
    <div className="rounded-2xl border bg-background p-2 shadow-sm">
      <div className="grid grid-cols-5 gap-1.5">
        {DAYS.map((day) => (
          <div key={day} className="rounded-xl bg-muted/30 p-1.5">
            <p
              className="mb-1 px-1 text-center text-[9.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              {day}
            </p>
            <div className="space-y-1">
              {POSTS[day]?.length ? (
                POSTS[day]?.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 rounded-md bg-card px-1 py-1 shadow-[0_1px_0_rgba(24,21,17,0.04)]"
                    aria-hidden
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE[p.tone]}`}
                    />
                    <span className="truncate text-[9.5px] font-semibold leading-none text-foreground">
                      {p.title}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  aria-hidden
                  className="rounded-md border border-dashed border-border/60 px-1 py-2 text-center text-[9px] text-muted-foreground/60"
                >
                  empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
