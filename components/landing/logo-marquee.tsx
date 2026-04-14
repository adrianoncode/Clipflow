interface LogoMarqueeProps {
  logos: string[]
}

/**
 * Seamless infinite horizontal scroll of text logos. The `animate-marquee`
 * keyframes defined in globals.css translate by -50 %, and we duplicate
 * the list so the loop point is invisible. Edges fade into the background
 * via a mask-image so logos don't slam into the section borders.
 */
export function LogoMarquee({ logos }: LogoMarqueeProps) {
  const doubled = [...logos, ...logos]
  return (
    <div
      className="relative overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
      }}
    >
      <div className="flex w-max items-center gap-16 animate-marquee py-2">
        {doubled.map((logo, i) => (
          <span
            key={`${logo}-${i}`}
            className="shrink-0 text-lg font-bold tracking-tight text-zinc-400 transition-colors hover:text-zinc-700"
          >
            {logo}
          </span>
        ))}
      </div>
    </div>
  )
}
