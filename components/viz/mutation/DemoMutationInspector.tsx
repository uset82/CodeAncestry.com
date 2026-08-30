'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { demoAccession, mutationM94012 } from '@/data/demo';

/**
 * Instrumentation for M-94012. Lab actions are demo states — nothing is applied.
 */

const ACTION_COPY = {
  ADOPT: 'Would apply M-94012 to a receiving genome. Demo only — nothing is adopted.',
  TEST: 'Would run the receiving project suite. Demo only — 98 of 100 already recorded.',
  SIMULATE: 'Would replay the mutation on a sandbox descendant. Demo only.',
  REJECT: 'Would keep the offer and decline it. Demo only — the record stays.',
  QUARANTINE: 'Would freeze propagation. Demo only — AXIS Quarantine is the labelled hold.',
} as const;

type Action = (typeof mutationM94012.actions)[number];

const formatCount = (value: number) => value.toLocaleString('en-GB');

export function DemoMutationInspector() {
  const mutation = mutationM94012;
  const [action, setAction] = useState<Action | null>(null);

  const handleAction = (next: Action) => {
    setAction(next);
  };

  return (
    <article className="font-ui">
      <p className="text-muted font-mono text-nano uppercase">{mutation.meta.label}</p>
      <p className="text-amber mt-2 font-mono text-micro">{demoAccession(mutation.id)}</p>
      <h3 className="mt-1 text-[18px] leading-tight font-semibold tracking-tight">
        {mutation.capability} mutation
      </h3>
      <p className="text-text-soft mt-2 text-[14px] leading-relaxed">
        Parent {mutation.parentGene} · introduced generation {mutation.introducedGeneration}
      </p>

      <p className="border-amber/45 text-amber mt-4 inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 font-mono text-nano uppercase">
        <span aria-hidden="true">!</span>
        Security {mutation.security}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        <Datum label="Created by" value={demoAccession(mutation.createdBy)} />
        <Datum label="Reviewed by" value={demoAccession(mutation.reviewedBy)} />
        <Datum label="Tests" value={`${mutation.testsPassed}/${mutation.testsTotal}`} />
        <Datum label="Performance" value={mutation.performance} />
        <Datum label="Inherited by" value={formatCount(mutation.inheritedBy)} />
        <Datum label="Last safe ancestor" value={`generation ${mutation.lastSafeAncestor}`} />
        <Datum label="Replacement" value={demoAccession(mutation.replacement)} />
        <Datum label="Capability" value={mutation.capability} />
      </dl>

      <div className="border-line mt-6 border-t pt-4">
        <p className="text-muted font-mono text-nano uppercase">Lab actions · demo states</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mutation.actions.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={action === item}
              onClick={() => handleAction(item)}
              className={cn(
                'rounded-xs border px-2 py-1 font-mono text-nano uppercase',
                action === item
                  ? 'border-acid/50 bg-acid/10 text-acid'
                  : 'border-line text-muted hover:text-text',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <p className="text-text-soft mt-3 text-[13.5px] leading-relaxed">
          {action ? ACTION_COPY[action] : 'Select an action to see what it would mean. None of them write.'}
        </p>
      </div>
    </article>
  );
}

const Datum = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-muted font-mono text-nano uppercase">{label}</dt>
    <dd className="text-text mt-0.5 text-[13.5px] tracking-tight">{value}</dd>
  </div>
);
