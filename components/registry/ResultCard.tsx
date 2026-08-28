'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { EntityType, SearchHit } from '@/lib/registry/search';
import { EvidenceChipRow } from '@/components/ui/EvidenceChip';
import { parseAccession } from '@/lib/schema/accession';
import { EVIDENCE_TIER_RANK, type EvidenceTier } from '@/lib/schema/vocabulary';

const TYPE_META: Record<EntityType, { label: string; tone: string; border: string; glyph: string }> =
  {
    project: { label: 'Project genome', tone: 'text-acid', border: 'border-l-acid/50', glyph: '⬡' },
    gene: { label: 'Capability gene', tone: 'text-cyan', border: 'border-l-cyan/50', glyph: '⌗' },
    mutation: {
      label: 'Mutation',
      tone: 'text-violet',
      border: 'border-l-violet/50',
      glyph: '⋔',
    },
    agent: { label: 'Agent DNA', tone: 'text-amber', border: 'border-l-amber/50', glyph: '◈' },
  };

const TIER_TONE: Record<EvidenceTier, string> = {
  verified: 'text-acid',
  reviewed: 'text-cyan',
  inferred: 'text-muted',
};

/**
 * One result, one record. Every card leads with the accession because that is
 * the quotable, immutable thing; the human name is secondary and the evidence is
 * never more than a glance away.
 */
export function ResultCard({
  hit,
  threshold,
  query,
}: {
  hit: SearchHit;
  /** Records below the active threshold are shown dimmed rather than removed. */
  threshold: EvidenceTier;
  query: string;
}) {
  const meta = TYPE_META[hit.type];
  const parsed = parseAccession(hit.accession);
  const below = EVIDENCE_TIER_RANK[hit.tier] < EVIDENCE_TIER_RANK[threshold];

  return (
    <li className={cn('bg-line/40 transition-opacity', below && 'opacity-40')}>
      <article
        className={cn(
          'bg-void hover:bg-panel border-l-2 p-5 transition-colors md:p-6',
          meta.border,
        )}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className={cn('font-mono text-nano uppercase', meta.tone)}>
            <span aria-hidden="true" className="mr-1.5">
              {meta.glyph}
            </span>
            {meta.label}
          </span>

          {parsed && (
            <code className="border-line bg-panel-2/70 text-text-soft rounded-sm border px-1.5 py-[2px] font-mono text-[11px]">
              {parsed.accession}
            </code>
          )}

          <span className={cn('ml-auto font-mono text-nano uppercase', TIER_TONE[hit.tier])}>
            {hit.tier}
          </span>
        </div>

        <h3 className="mt-3.5 text-[19px] leading-tight font-semibold tracking-[-0.03em]">
          <Link href={hit.href} className="hover:text-acid transition-colors">
            <Highlight text={hit.title} query={query} />
          </Link>
        </h3>

        <p className="text-muted mt-1 font-mono text-[12px]">{hit.subtitle}</p>

        <p className="text-text-soft mt-3 max-w-[68ch] text-[14.5px] leading-relaxed">
          <Highlight text={hit.detail} query={query} />
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <EvidenceChipRow codes={hit.evidence} />

          <span className="text-faint flex items-baseline gap-1.5 font-mono text-nano uppercase">
            Confidence
            <span
              className={cn(
                'tabular-nums',
                hit.confidence >= 0.9
                  ? 'text-acid'
                  : hit.confidence >= 0.7
                    ? 'text-cyan'
                    : 'text-muted',
              )}
            >
              {hit.confidence.toFixed(2)}
            </span>
          </span>

          {hit.facets.generation !== undefined && (
            <span className="text-faint font-mono text-nano uppercase">
              GEN {hit.facets.generation}
            </span>
          )}
          {hit.facets.ontology && (
            <span className="text-faint font-mono text-nano uppercase">{hit.facets.ontology}</span>
          )}
          {hit.facets.language && (
            <span className="text-faint font-mono text-nano uppercase">{hit.facets.language}</span>
          )}
        </div>

        {below && (
          <p className="text-amber mt-4 font-mono text-nano uppercase">
            Below the current evidence threshold
          </p>
        )}
      </article>
    </li>
  );
}

/** Marks query terms in a result so the reason for the match is visible. */
function Highlight({ text, query }: { text: string; query: string }) {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 1);

  if (terms.length === 0) return <>{text}</>;

  const parts = text.split(new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        terms.includes(part.toLowerCase()) ? (
          <mark key={i} className="bg-acid/20 text-acid rounded-[2px] px-[1px]">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
