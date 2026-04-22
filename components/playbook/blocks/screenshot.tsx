/**
 * Framed product screenshot with editorial chrome.
 *
 * Paths resolve against `public/` — e.g. `/playbook/screenshots/
 * brand-voice.png`. Uses plain <img> (not next/image) so guide
 * authors can drop a new file in `public/playbook/screenshots/`
 * without re-running next build or touching config.
 */
export function Screenshot({
  src,
  alt,
  caption,
}: {
  src: string
  alt: string
  caption?: string
}) {
  return (
    <figure className="my-2">
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: 'var(--lv2-bg-2)',
          border: '1px solid var(--lv2-border)',
          boxShadow: '0 1px 0 rgba(24,21,17,.04), 0 20px 40px -24px rgba(42,26,61,.15)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="block h-auto w-full"
          style={{ display: 'block' }}
        />
      </div>
      {caption ? (
        <figcaption
          className="lv2-mono mt-3 text-center text-[10.5px] uppercase tracking-[0.08em]"
          style={{ color: 'var(--lv2-muted)' }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
