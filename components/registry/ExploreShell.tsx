'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { useEvidenceThreshold } from '@/components/providers/EvidenceThresholdProvider';
import { EvidenceThresholdControl } from './EvidenceThresholdControl';
import { FacetRail, type FacetSelection } from './FacetRail';
import { OntologyExplorer } from './OntologyExplorer';
import { ResultCard } from './ResultCard';
import { ENTITY_TABS, type EntityType, type ExplorePayload, type FacetKey, type OntologyTreeNode, type SearchHit } from '@/lib/registry/search';
import { parseAccession } from '@/lib/schema/accession';
import { EVIDENCE_TIER_RANK } from '@/lib/schema/vocabulary';

const ALL_TYPES: EntityType[] = ['project', 'gene', 'mutation', 'agent'];

/**
 * Registry search behaves like UniProt, not GitHub: a query returns four
 * independent result sets, each with its own evidence and its own idea of what
 * relevance means. The tab strip is therefore a filter over result *kinds*, and
 * "All" is a legitimate view rather than a compromise.
 */
export function ExploreShell({
  payload,
  ontology,
}: {
  payload: ExplorePayload;
  ontology: OntologyTreeNode;
}) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<EntityType | 'all'>('all');
  const [selection, setSelection] = useState<FacetSelection>({});
  const [fitnessOnly, setFitnessOnly] = useState(false);
  const [ontologyTerm, setOntologyTerm] = useState<string | null>(null);
  const [sort, setSort] = useState<'relevance' | 'confidence' | 'name'>('relevance');
  const [dimBelow, setDimBelow] = useState(true);
  // Collapsed by default; `lg:grid` reveals the rail on wide screens without
  // needing to know the viewport at render time.
  const [railOpen, setRailOpen] = useState(false);

  const { threshold } = useEvidenceThreshold();
  // Typing stays responsive even though every keystroke re-scores the corpus.
  const deferredQuery = useDeferredValue(query);

  const jump = useMemo(
    () => resolveJump(deferredQuery, payload),
    [deferredQuery, payload],
  );

  const scored = useMemo(() => {
    const terms = deferredQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return payload.hits
      .map((hit) => ({ hit, score: score(hit, terms) }))
      .filter((entry) => entry.score > 0)
      .map((entry) => ({ ...entry.hit, score: entry.score }));
  }, [deferredQuery, payload.hits]);

  const faceted = useMemo(
    () =>
      scored.filter((hit) => {
        if (fitnessOnly && hit.facets.fitness !== true) return false;

        if (ontologyTerm) {
          // Genes carry ontology terms; other entity types are filtered out
          // entirely, because the question being asked is about capabilities.
          if (hit.type !== 'gene') return false;
          const term = hit.facets.ontologyTerm ?? '';
          if (term !== ontologyTerm && !term.startsWith(`${ontologyTerm}.`)) return false;
        }

        for (const [key, values] of Object.entries(selection) as [FacetKey, string[]][]) {
          if (!values?.length) continue;
          const group = payload.facetGroups.find((g) => g.key === key);
          // A facet only constrains the entity types it describes.
          if (group && !group.appliesTo.includes(hit.type)) continue;
          const own = facetValue(hit, key);
          if (own === undefined || !values.includes(own)) return false;
        }

        return true;
      }),
    [scored, selection, fitnessOnly, ontologyTerm, payload.facetGroups],
  );

  const visible = useMemo(
    () =>
      dimBelow
        ? faceted
        : faceted.filter((hit) => EVIDENCE_TIER_RANK[hit.tier] >= EVIDENCE_TIER_RANK[threshold]),
    [faceted, dimBelow, threshold],
  );

  const byType = useMemo(() => {
    const groups = {} as Record<EntityType, SearchHit[]>;
    for (const type of ALL_TYPES) {
      groups[type] = visible
        .filter((hit) => hit.type === type)
        .sort((a, b) =>
          sort === 'confidence'
            ? b.confidence - a.confidence
            : sort === 'name'
              ? a.title.localeCompare(b.title)
              : b.score - a.score || a.title.localeCompare(b.title),
        );
    }
    return groups;
  }, [visible, sort]);

  const shownTypes = activeType === 'all' ? ALL_TYPES : [activeType];
  const total = shownTypes.reduce((sum, type) => sum + byType[type].length, 0);
  const suppressed = faceted.filter(
    (hit) => EVIDENCE_TIER_RANK[hit.tier] < EVIDENCE_TIER_RANK[threshold],
  ).length;

  const narrowedCount =
    Object.values(selection).reduce((sum, values) => sum + (values?.length ?? 0), 0) +
    (fitnessOnly ? 1 : 0) +
    (ontologyTerm ? 1 : 0);

  const handleToggleFacet = (key: FacetKey, value: string) =>
    setSelection((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });

  const handleClearAll = () => {
    setSelection({});
    setFitnessOnly(false);
    setOntologyTerm(null);
  };

  return (
    <div className="shell-wide py-10 md:py-14">
      <header className="max-w-[760px]">
        <p className="text-acid font-mono text-micro uppercase">Registry</p>
        <h1 className="text-headline mt-3 text-balance">Explore the registry</h1>
        <p className="text-text-soft mt-4 leading-relaxed">
          Four kinds of record, searched separately. A capability is not a project and a mutation is
          not a commit, so they are never mixed into one ranked list. Paste an accession to jump
          straight to it.
        </p>
      </header>

      <div className="mt-9">
        <SearchField
          value={query}
          onChange={setQuery}
          resultCount={total}
          onClear={() => setQuery('')}
        />

        {jump && (
          <div
            role="status"
            className="border-acid/30 bg-acid/[0.05] mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3"
          >
            <p className="text-[14.5px]">
              <span className="text-acid font-mono text-nano uppercase">Exact match</span>{' '}
              <span className="text-text-soft ml-2">{jump.label}</span>
            </p>
            <Link
              href={jump.href}
              className="text-acid font-mono text-nano uppercase underline decoration-dotted"
            >
              Open record →
            </Link>
          </div>
        )}

        {!query && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-faint font-mono text-nano uppercase">Try</span>
            {payload.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="border-line bg-panel-2 text-text-soft hover:border-line-strong hover:text-text rounded-sm border px-2 py-1 font-mono text-[11px] transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[248px_1fr] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-line bg-panel rounded-xl border p-4">
            <EvidenceThresholdControl
              className="max-w-[420px]"
              hidden={suppressed}
              total={faceted.length}
            />

            <label className="text-faint border-line/60 mt-4 flex cursor-pointer items-center gap-2 border-t pt-3 text-[12.5px]">
              <input
                type="checkbox"
                checked={!dimBelow}
                onChange={(event) => setDimBelow(!event.target.checked)}
                className="accent-acid size-3.5"
              />
              Remove suppressed records entirely
            </label>
          </div>

          {/* Below lg the rail sits above the results, so it starts folded away
              rather than burying them under two screens of controls. */}
          <button
            type="button"
            onClick={() => setRailOpen((prev) => !prev)}
            aria-expanded={railOpen}
            className="border-line bg-panel hover:border-line-strong mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-colors lg:hidden"
          >
            <span className="text-text-soft font-mono text-nano uppercase">
              Ontology and filters
              {narrowedCount > 0 && <span className="text-acid ml-2 tabular-nums">{narrowedCount}</span>}
            </span>
            <span aria-hidden="true" className="text-faint font-mono text-[11px]">
              {railOpen ? '−' : '+'}
            </span>
          </button>

          <div
            className={cn(
              'mt-4 items-start gap-4 lg:grid lg:grid-cols-1',
              railOpen ? 'grid md:grid-cols-2 lg:grid-cols-1' : 'hidden',
            )}
          >
            <div className="border-line bg-panel rounded-xl border p-4">
              <OntologyExplorer
                tree={ontology}
                selected={ontologyTerm}
                onSelect={setOntologyTerm}
              />
            </div>

            <div className="border-line bg-panel rounded-xl border p-4">
              <FacetRail
                groups={payload.facetGroups}
                selection={selection}
                onToggle={handleToggleFacet}
                onClear={handleClearAll}
                fitnessOnly={fitnessOnly}
                onFitnessOnly={setFitnessOnly}
              />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="border-line flex flex-wrap items-end justify-between gap-4 border-b pb-3">
            <div role="tablist" aria-label="Entity type" className="flex flex-wrap gap-1">
              <TypeTab
                active={activeType === 'all'}
                onClick={() => setActiveType('all')}
                label="All"
                count={ALL_TYPES.reduce((sum, type) => sum + byType[type].length, 0)}
              />
              {ENTITY_TABS.map((tab) => (
                <TypeTab
                  key={tab.type}
                  active={activeType === tab.type}
                  onClick={() => setActiveType(tab.type)}
                  label={tab.label}
                  count={byType[tab.type].length}
                />
              ))}
            </div>

            <label className="text-faint flex items-center gap-2 font-mono text-nano uppercase">
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="border-line bg-panel-2 text-text-soft rounded-sm border px-2 py-1 font-mono text-[11px]"
              >
                <option value="relevance">Relevance</option>
                <option value="confidence">Confidence</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          {total === 0 && jump ? (
            <p className="text-muted border-line-strong mt-8 rounded-xl border border-dashed p-6 text-[14.5px] leading-relaxed md:p-8">
              That identifier resolves, but nothing else in the registry matches it as a search term.
              Open the record above.
            </p>
          ) : total === 0 ? (
            <ZeroResults
              query={query}
              hasFilters={
                Object.values(selection).some((values) => values?.length) ||
                fitnessOnly ||
                ontologyTerm !== null
              }
              onClear={handleClearAll}
              onClearQuery={() => setQuery('')}
            />
          ) : (
            <div className="mt-8 flex flex-col gap-12">
              {shownTypes.map((type) => {
                const hits = byType[type];
                if (hits.length === 0) return null;
                const tab = ENTITY_TABS.find((entry) => entry.type === type)!;

                return (
                  <section key={type} aria-labelledby={`results-${type}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h2
                        id={`results-${type}`}
                        className="text-[15px] font-semibold tracking-tight"
                      >
                        {tab.label}
                        <span className="text-faint ml-2.5 font-mono text-nano tabular-nums">
                          {hits.length} of {payload.counts[type]}
                        </span>
                      </h2>
                      <code className="text-faint font-mono text-nano">{tab.prefix}:</code>
                    </div>

                    <ul className="mt-4 grid gap-px">
                      {hits.map((hit) => (
                        <ResultCard
                          key={hit.accession}
                          hit={hit}
                          threshold={threshold}
                          query={deferredQuery}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SearchField({
  value,
  onChange,
  onClear,
  resultCount,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  resultCount: number;
}) {
  return (
    <div className="relative">
      <label htmlFor="registry-search" className="sr-only">
        Search the registry
      </label>
      <span
        aria-hidden="true"
        className="text-faint pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-[13px]"
      >
        ⌕
      </span>
      <input
        id="registry-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Capability, project, accession, or commit:<sha>"
        autoComplete="off"
        spellCheck={false}
        className="border-line bg-panel-2 focus:border-line-strong placeholder:text-faint w-full rounded-lg border py-4 pr-28 pl-11 text-[16px] transition-colors"
      />
      <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="text-faint hover:text-text font-mono text-nano uppercase"
          >
            Clear
          </button>
        )}
        <span aria-live="polite" className="text-faint font-mono text-nano tabular-nums uppercase">
          {resultCount} hits
        </span>
      </div>
    </div>
  );
}

function TypeTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'relative -mb-[13px] flex items-baseline gap-2 border-b-2 px-3 py-2 text-[14px] transition-colors',
        active
          ? 'border-acid text-text'
          : 'text-muted hover:text-text border-transparent hover:border-line-strong',
      )}
    >
      {label}
      <span
        className={cn(
          'font-mono text-nano tabular-nums',
          active ? 'text-acid' : 'text-faint',
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ZeroResults({
  query,
  hasFilters,
  onClear,
  onClearQuery,
}: {
  query: string;
  hasFilters: boolean;
  onClear: () => void;
  onClearQuery: () => void;
}) {
  return (
    <div className="border-line-strong mt-8 rounded-xl border border-dashed p-8 text-center md:p-12">
      <p className="text-muted font-mono text-nano uppercase">No records</p>
      <p className="mx-auto mt-4 max-w-[46ch] text-[19px] leading-snug font-semibold tracking-[-0.02em] text-balance">
        {query
          ? `Nothing in the registry matches “${query}”.`
          : 'Every record has been filtered out.'}
      </p>
      <p className="text-muted mx-auto mt-4 max-w-[52ch] text-[14.5px] leading-relaxed">
        The seeded family is eight projects deep. A live registry would search millions; this one
        only knows what it has been shown, and it will not invent a plausible-looking answer to fill
        the gap.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {query && (
          <button
            type="button"
            onClick={onClearQuery}
            className="border-line bg-panel-2 hover:border-line-strong rounded-md border px-4 py-2 font-mono text-nano uppercase transition-colors"
          >
            Clear the query
          </button>
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="border-acid/40 bg-acid/10 text-acid hover:bg-acid/15 rounded-md border px-4 py-2 font-mono text-nano uppercase transition-colors"
          >
            Reset filters
          </button>
        )}
        <Link
          href="/blast"
          className="border-line bg-panel-2 hover:border-line-strong rounded-md border px-4 py-2 font-mono text-nano uppercase transition-colors"
        >
          Try CodeBLAST instead
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Relevance scoring, mirroring `matches()` in the server search module. */
function score(hit: SearchHit, terms: string[]): number {
  if (terms.length === 0) return 0.5;

  const haystack = `${hit.title} ${hit.subtitle} ${hit.detail} ${hit.accession} ${
    hit.facets.ontologyTerm ?? ''
  } ${Object.values(hit.facets).join(' ')}`.toLowerCase();

  let hits = 0;
  for (const term of terms) if (haystack.includes(term)) hits += 1;
  if (hits === 0) return 0;

  const whole = terms.join(' ');
  return haystack.includes(whole) ? 1 : 0.4 + 0.5 * (hits / terms.length);
}

function facetValue(hit: SearchHit, key: FacetKey): string | undefined {
  const raw =
    key === 'ontologyRoot'
      ? hit.facets.ontology
      : key === 'year'
        ? hit.facets.year
        : hit.facets[key as keyof SearchHit['facets']];

  return raw === undefined ? undefined : String(raw);
}

/**
 * Exact-identifier resolution. An accession or a commit SHA is not a search
 * term — it is an address, and typing one should offer to navigate.
 */
function resolveJump(
  query: string,
  payload: ExplorePayload,
): { href: string; label: string } | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const parsed = parseAccession(trimmed);
  if (parsed) {
    const exact = payload.hits.find((hit) => hit.accession === parsed.accession);
    if (exact) return { href: exact.href, label: exact.title };
  }

  const commit = /^commit:([0-9a-f]{7,40})$/i.exec(trimmed);
  if (commit) {
    const sha = commit[1]!.toLowerCase();
    const match = payload.commits.find((entry) => entry.sha.startsWith(sha));
    if (match) return { href: match.href, label: `${match.label} at ${sha}` };
  }

  return null;
}
