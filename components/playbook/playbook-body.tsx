import type { GuideBlock, GuideSection } from '@/lib/landing/playbook-types'
import { FeatureVisual } from '@/components/explore/feature-visual'

import { Callout } from './blocks/callout'
import { Checklist } from './blocks/checklist'
import { DosDonts } from './blocks/dos-donts'
import { ExampleBox } from './blocks/example-box'
import { Quote } from './blocks/quote'
import { Screenshot } from './blocks/screenshot'
import { Shortcut } from './blocks/shortcut'
import { Steps } from './blocks/steps'

/**
 * Section renderer with editorial structure:
 *   - mono section number (01 ·) above the h2
 *   - dotted/dashed divider above each non-first section
 *   - first paragraph in each section gets "lead" styling (bigger,
 *     left accent border, no top margin) — guarantees the eye lands on
 *     section intent, not on a wall of grey body text
 *
 * Adding a new block requires extending GuideBlock + a renderer in
 * blocks/ + a case here. No cross-block state by design.
 */
export function PlaybookSection({
  section,
  index,
  isFirst,
}: {
  section: GuideSection
  index: number
  isFirst: boolean
}) {
  return (
    <section
      id={section.id}
      className={`scroll-mt-24 ${isFirst ? 'pt-2' : 'mt-16 border-t pt-12'}`}
      style={
        isFirst
          ? undefined
          : {
              borderColor: 'var(--lv2-border)',
              borderTopWidth: 1,
            }
      }
    >
      {/* Section number + title */}
      <div className="mb-6 flex items-baseline gap-3">
        <span
          className="lv2-mono text-[12px] font-bold tracking-[0.16em]"
          style={{ color: 'var(--lv2-muted)' }}
        >
          {String(index).padStart(2, '0')}
        </span>
        <h2
          className="lv2-display text-[28px] leading-tight sm:text-[36px]"
          style={{ color: 'var(--lv2-primary)' }}
        >
          {section.title}
        </h2>
      </div>

      <div className="space-y-5">
        {section.content.map((block, i) => (
          <BlockRenderer
            key={`${section.id}-${i}`}
            block={block}
            isLead={i === 0 && block.type === 'paragraph'}
          />
        ))}
      </div>
    </section>
  )
}

function BlockRenderer({ block, isLead }: { block: GuideBlock; isLead: boolean }) {
  switch (block.type) {
    case 'paragraph':
      if (isLead) {
        return (
          <p
            className="border-l-2 pl-4 text-[17.5px] leading-[1.55] sm:text-[18px]"
            style={{
              color: 'var(--lv2-fg)',
              borderColor: 'var(--lv2-primary)',
            }}
          >
            {block.text}
          </p>
        )
      }
      return (
        <p
          className="text-[15.5px] leading-[1.7]"
          style={{ color: 'var(--lv2-fg-soft)' }}
        >
          {block.text}
        </p>
      )

    case 'heading': {
      const common =
        'lv2-sans-d leading-tight mt-7 mb-1 font-bold ' +
        (block.level === 3 ? 'text-[20px] sm:text-[22px]' : 'text-[16px] sm:text-[17px]')
      if (block.level === 3) {
        return (
          <h3 className={common} style={{ color: 'var(--lv2-fg)' }}>
            {block.text}
          </h3>
        )
      }
      return (
        <h4 className={common} style={{ color: 'var(--lv2-fg)' }}>
          {block.text}
        </h4>
      )
    }

    case 'steps':
      return <Steps items={block.items} />

    case 'callout':
      return (
        <Callout variant={block.variant} title={block.title} body={block.body} />
      )

    case 'dos-donts':
      return <DosDonts dos={block.dos} donts={block.donts} />

    case 'quote':
      return <Quote text={block.text} attribution={block.attribution} />

    case 'checklist':
      return <Checklist title={block.title} items={block.items} />

    case 'visual':
      return (
        <figure className="my-2">
          <FeatureVisual id={block.visual} />
          {block.caption ? (
            <figcaption
              className="lv2-mono mt-3 text-center text-[10.5px] uppercase tracking-[0.08em]"
              style={{ color: 'var(--lv2-muted)' }}
            >
              {block.caption}
            </figcaption>
          ) : null}
        </figure>
      )

    case 'example-box':
      return <ExampleBox label={block.label} good={block.good} bad={block.bad} />

    case 'shortcut':
      return <Shortcut keys={block.keys} label={block.label} />

    case 'screenshot':
      return <Screenshot src={block.src} alt={block.alt} caption={block.caption} />

    case 'hr':
      return (
        <hr
          className="my-8 border-0"
          style={{
            height: 1,
            background:
              'linear-gradient(to right, transparent, var(--lv2-border), transparent)',
          }}
        />
      )

    default:
      return null
  }
}
