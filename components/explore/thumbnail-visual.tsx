'use client'

/**
 * Static three-up preview of auto-generated thumbnails. Uses the live
 * /api/thumbnail edge endpoint so the visuals are always real output
 * from the same code path users hit in the app — nothing mocked.
 */
export function ThumbnailVisual() {
  const thumbs = [
    {
      label: 'YouTube · 1280×720',
      src: '/api/thumbnail?title=The algorithm change nobody talks about&layout=yt&variant=bold&sub=YOUTUBE+%C2%B7+EP+47&accent=%23D6FF3E&bg=%232A1A3D&logoText=Clipflow',
    },
    {
      label: 'LinkedIn · 1200×627',
      src: '/api/thumbnail?title=How we built our first 10k follower playbook&layout=link&variant=soft&sub=BUILD+IN+PUBLIC&accent=%232A1A3D&bg=%23D6FF3E&logoText=Clipflow',
    },
    {
      label: 'Instagram · 1200×1200',
      src: '/api/thumbnail?title=Stop posting. Start observing.&layout=square&variant=bold&sub=&accent=%23D6FF3E&bg=%23181511&logoText=Clipflow',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {thumbs.map((t) => (
        <div key={t.label} className="flex flex-col gap-2">
          <div
            className="overflow-hidden rounded-xl"
            style={{
              aspectRatio: t.label.includes('1200×1200')
                ? '1 / 1'
                : t.label.includes('1200×627')
                  ? '1200 / 627'
                  : '16 / 9',
              background: 'var(--lv2-bg-2)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.src}
              alt={t.label}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <p
            className="lv2-mono text-[9px] uppercase tracking-wider"
            style={{ color: 'var(--lv2-muted)' }}
          >
            {t.label}
          </p>
        </div>
      ))}
    </div>
  )
}
