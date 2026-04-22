import type { GuideBlock, GuideSection } from '@/lib/landing/playbook-types'
import { FeatureVisual } from '@/components/explore/feature-visual'

import { Callout } from './blocks/callout'
import { Checklist } from './blocks/checklist'
import { DosDonts } from './blocks/dos-donts'
import { ExampleBox } from './blocks/example-box'
import { Quote } from './blocks/quote'
import { Shortcut } from './blocks/shortcut'
import { Steps } from './blocks/steps'

/**
 * Polymorphic block renderer. Every guide section is a flat array of
 * GuideBlock values; this switch maps each block type to its
 * component. Adding a new block type requires:
 *   1. extending the GuideBlock union in playbook-types.ts
 *   2. a renderer in blocks/
 *   3. a case here
 *
 * Deliberately no cross-block state — each block renders independently.
 */
export function PlaybookSection({ section }: { section: GuideSection }) {
  return (
    <section
      id={section.id}
      className="scroll-mt-24 border-t pt-12"
      style={{ borderColor: 'var(--lv2-border)' }}
    >
      <h2
        className="lv2-display mb-6 text-[30px] leading-tight sm:text-[38px]"
        style={{ color: 'var(--lv2-primary)' }}
      >
        {section.title}
      </h2>
      <div className="space-y-5">
        {section.content.map((block, i) => (
          <BlockRenderer key={`${section.id}-${i}`} block={block} />
        ))}
      </div>
    </section>
  )
}

function BlockRenderer({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case 'paragraph':
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
        'lv2-sans-d leading-tight mt-6 mb-1 font-bold ' +
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
