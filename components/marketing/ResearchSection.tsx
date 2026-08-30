import Link from 'next/link';
import { ProtocolIndex } from '@/components/viz/protocol/ProtocolIndex';
import { protocolIndex } from '@/data/demo/protocol';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 16 — From concept to protocol. Same zoomOut as origin and close.
 * The plate is two strands against that specimen, not a new pose.
 */

const CTAS = [
  { href: protocolIndex.paperHref, label: 'Read the Paper' },
  { href: protocolIndex.protocolHref, label: 'Read the Protocol' },
  { href: protocolIndex.schemasHref, label: 'View Schemas' },
  { href: protocolIndex.githubHref, label: 'GitHub', external: true },
] as const;

export function ResearchSection() {
  return (
    <Section id="research" beat={11} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="16">Research</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          From concept
          <br />
          <span className="text-emphasis">to protocol.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          The specimen is already zoomed out. A protocol is how those strands keep their names after
          the code has changed. Live schemas where the objects exist. Open marks where they do not.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[640px] rounded-sm border p-5 md:max-w-[780px] md:p-7">
        <ProtocolIndex />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Two strands · zoomOut
        </figcaption>
      </figure>

      <nav aria-label="Research and protocol" className="mt-10 flex max-w-[640px] flex-wrap gap-x-6 gap-y-2">
        {CTAS.map((cta) =>
          'external' in cta && cta.external ? (
            <a
              key={cta.href}
              href={cta.href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-text-soft hover:text-text text-[15px] underline decoration-dotted"
            >
              {cta.label}
            </a>
          ) : (
            <Link
              key={cta.href}
              href={cta.href}
              className="text-text-soft hover:text-text text-[15px] underline decoration-dotted"
            >
              {cta.label}
            </Link>
          ),
        )}
      </nav>
    </Section>
  );
}
