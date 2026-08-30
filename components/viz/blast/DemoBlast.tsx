'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { useRadioGroup } from '@/lib/hooks/useRadioGroup';
import {
  BLAST_ACTIONS,
  BLAST_MODES,
  blastQuery,
  demoBlastHits,
  type BlastActionId,
  type BlastHit,
  type BlastModeId,
} from '@/data/demo';

/**
 * Homepage CodeBLAST. Alignment length encodes identity; rank and % sit beside
 * the bar so colour is never the only signal. The engine is a seeded prototype.
 */

const DEFAULT_MODE = 0;
const DEFAULT_ACTION = 0;

export function DemoBlast({ className }: { className?: string }) {
  const [modeIndex, setModeIndex] = useState(DEFAULT_MODE);
  const [query, setQuery] = useState<string>(blastQuery.capability);
  const [hits, setHits] = useState<readonly BlastHit[]>(() =>
    demoBlastHits('capability', blastQuery.capability),
  );
  const [selected, setSelected] = useState(0);
  const [actionIndex, setActionIndex] = useState(DEFAULT_ACTION);

  const mode = BLAST_MODES[modeIndex]?.id ?? 'capability';
  const action = BLAST_ACTIONS[actionIndex] ?? BLAST_ACTIONS[0];

  const modes = useRadioGroup({
    count: BLAST_MODES.length,
    index: modeIndex,
    onSelect: (index) => {
      handleMode(index);
    },
    orientation: 'horizontal',
  });

  const results = useRadioGroup({
    count: Math.max(hits.length, 1),
    index: selected,
    onSelect: (index) => {
      handleSelectHit(index);
    },
    orientation: 'vertical',
  });

  const actions = useRadioGroup({
    count: BLAST_ACTIONS.length,
    index: actionIndex,
    onSelect: (index) => {
      handleAction(index);
    },
    orientation: 'horizontal',
  });

  const handleMode = (index: number) => {
    const next = BLAST_MODES[index]?.id ?? 'capability';
    setModeIndex(index);
    const nextQuery = defaultQuery(next);
    setQuery(nextQuery);
    const nextHits = demoBlastHits(next, nextQuery);
    setHits(nextHits);
    setSelected(0);
  };

  const handleQuery = (value: string) => {
    setQuery(value);
  };

  const handleAlign = () => {
    const nextHits = demoBlastHits(mode, query);
    setHits(nextHits);
    setSelected(0);
  };

  const handleSelectHit = (index: number) => {
    setSelected(index);
  };

  const handleAction = (index: number) => {
    setActionIndex(index);
  };

  const selectedHit = hits[selected];
  const field = useMemo(() => fieldFor(mode), [mode]);

  return (
    <div className={cn('font-ui', className)}>
      <p className="text-muted font-mono text-nano uppercase">Prototype · lexical ranks</p>

      <div
        {...modes.groupProps}
        aria-label="CodeBLAST query mode"
        className="mt-4 flex flex-wrap gap-1.5"
      >
        {BLAST_MODES.map((item, index) => {
          const active = index === modeIndex;
          return (
            <button
              key={item.id}
              {...modes.radioProps(index)}
              aria-label={item.label}
              className={cn(
                'rounded-xs border px-2.5 py-1.5 font-mono text-nano uppercase',
                active ? 'border-acid/50 bg-void text-acid' : 'border-line text-muted hover:text-text',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <label htmlFor="demo-blast-query" className="text-muted mt-5 block font-mono text-nano uppercase">
        {field.label}
      </label>
      {field.multiline ? (
        <textarea
          id="demo-blast-query"
          value={query}
          onChange={(event) => handleQuery(event.target.value)}
          rows={5}
          spellCheck={false}
          className="border-line bg-void placeholder:text-muted mt-2 w-full resize-y rounded-xs border p-3 font-mono text-[13px] leading-relaxed"
        />
      ) : (
        <input
          id="demo-blast-query"
          type={field.type}
          value={query}
          onChange={(event) => handleQuery(event.target.value)}
          spellCheck={false}
          className="border-line bg-void placeholder:text-muted mt-2 w-full rounded-xs border px-3 py-2 font-mono text-[13px]"
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={handleAlign}>
          Align
        </Button>
        <p className="text-muted text-[13px] leading-snug">
          Not production semantic search. The percentages are seeded demo ranks.
        </p>
      </div>

      <p className="text-muted mt-8 font-mono text-nano uppercase">Alignment</p>
      {hits.length === 0 ? (
        <p className="text-text-soft mt-3 text-[14px] leading-relaxed">
          Nothing in the AXIS demo pack aligns. That is a real answer, not a failure.
        </p>
      ) : (
        <div {...results.groupProps} aria-label="Aligned relatives" className="mt-3 space-y-2">
          {hits.map((hit, index) => (
            <AlignmentRow
              key={hit.id}
              hit={hit}
              index={index}
              active={index === selected}
              radio={results.radioProps(index)}
            />
          ))}
        </div>
      )}

      <p className="text-muted mt-8 font-mono text-nano uppercase">Actions · demo states</p>
      <div
        {...actions.groupProps}
        aria-label="CodeBLAST demo actions"
        className="mt-3 flex flex-wrap gap-1.5"
      >
        {BLAST_ACTIONS.map((item, index) => {
          const active = index === actionIndex;
          return (
            <button
              key={item.id}
              {...actions.radioProps(index)}
              aria-label={item.label}
              className={cn(
                'rounded-xs border px-2.5 py-1.5 font-mono text-nano uppercase',
                active ? 'border-acid/50 bg-void text-acid' : 'border-line text-muted hover:text-text',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="border-line mt-4 border-t pt-4">
        <p className="text-acid font-mono text-micro uppercase">{action.label}</p>
        <p className="text-text-soft mt-2 text-[13.5px] leading-relaxed">
          {selectedHit ? `${selectedHit.name} · ${selectedHit.identity}% identity. ` : ''}
          {action.detail}
        </p>
        {'href' in action && action.href ? (
          <Link
            href={action.href}
            className="text-text-soft hover:text-text mt-2 inline-block text-[13.5px] underline decoration-dotted"
          >
            Open the related instrument
          </Link>
        ) : null}
        {action.id === ('compat' satisfies BlastActionId) && selectedHit ? (
          <CompatibilityReadout hit={selectedHit} />
        ) : null}
      </div>
    </div>
  );
}

const defaultQuery = (mode: BlastModeId) => {
  if (mode === 'paste') return blastQuery.paste;
  if (mode === 'url') return blastQuery.url;
  return blastQuery.capability;
};

const fieldFor = (mode: BlastModeId) => {
  if (mode === 'paste') return { label: 'Implementation', multiline: true, type: 'text' as const };
  if (mode === 'url') return { label: 'Repository URL', multiline: false, type: 'url' as const };
  return { label: 'Capability', multiline: false, type: 'text' as const };
};

const AlignmentRow = ({
  hit,
  index,
  active,
  radio,
}: {
  hit: BlastHit;
  index: number;
  active: boolean;
  radio: ReturnType<ReturnType<typeof useRadioGroup>['radioProps']>;
}) => (
  <button
    {...radio}
    aria-label={`${hit.name}, ${hit.identity} percent identity, ${hit.family}`}
    className={cn(
      'grid w-full grid-cols-[1.5rem_minmax(0,1fr)_3.25rem] items-center gap-2 rounded-xs px-1 py-1.5 text-left',
      active ? 'bg-void' : 'hover:bg-hover',
    )}
  >
    <span className={cn('font-mono text-nano tabular-nums', active ? 'text-acid' : 'text-muted')}>
      {String(index + 1).padStart(2, '0')}
    </span>
    <span className="min-w-0">
      <span className="text-text flex items-center gap-1.5 font-mono text-nano uppercase">
        <span aria-hidden="true">{active ? '◆' : hit.mark}</span>
        {hit.name}
      </span>
      <span className="bg-panel-3 mt-1 block h-1 overflow-hidden rounded-xs">
        <span
          aria-hidden="true"
          className={cn('block h-full', active ? 'bg-acid' : 'bg-cyan')}
          style={{ width: `${hit.identity}%` }}
        />
      </span>
    </span>
    <span className={cn('text-right font-mono text-micro tabular-nums', active ? 'text-acid' : 'text-text')}>
      {hit.identity}%
    </span>
  </button>
);

const CompatibilityReadout = ({ hit }: { hit: BlastHit }) => (
  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
    <div>
      <dt className="text-muted font-mono text-nano uppercase">Against</dt>
      <dd className="text-text mt-0.5 text-[13.5px]">{hit.name}</dd>
    </div>
    <div>
      <dt className="text-muted font-mono text-nano uppercase">Licence</dt>
      <dd className="text-text mt-0.5 text-[13.5px]">Compatible · demo</dd>
    </div>
    <div>
      <dt className="text-muted font-mono text-nano uppercase">Tests</dt>
      <dd className="text-text mt-0.5 text-[13.5px]">98 / 100</dd>
    </div>
    <div>
      <dt className="text-muted font-mono text-nano uppercase">Security</dt>
      <dd className="text-amber mt-0.5 text-[13.5px]">WARNING</dd>
    </div>
  </dl>
);
