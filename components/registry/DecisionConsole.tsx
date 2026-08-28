'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import type { ChecklistItem } from '@/lib/registry/mutation';

/**
 * The decision console: adopt, reject, quarantine, or ask for more evidence.
 *
 * There is no backend behind these buttons, so they do not pretend to be one.
 * Pressing one composes the record that *would* be appended to the registry and
 * shows it, which is more useful than a toast claiming success: the reader can
 * see that a decision is itself an evidenced, attributable record rather than a
 * flag being flipped.
 *
 * Adopt is gated on the evidence checklist. That gate is the product — the
 * registry's whole claim is that nothing propagates on an assertion alone — so
 * the button is disabled with the blocking gate named, rather than allowed
 * through with a warning.
 */

type Decision = 'adopt' | 'reject' | 'quarantine' | 'request-tests';

const DECISIONS: {
  value: Decision;
  label: string;
  hint: string;
  tone: string;
  /** What the registry records when this is chosen. */
  writes: string;
}[] = [
  {
    value: 'adopt',
    label: 'Adopt',
    hint: 'Take the new allele into this genome.',
    tone: 'border-acid/50 bg-acid/10 text-acid hover:bg-acid/15',
    writes: 'genome.genes[].allele advances, and the adopting genome joins mutation.adoptedBy.',
  },
  {
    value: 'reject',
    label: 'Reject',
    hint: 'Decline it, with the reason recorded.',
    tone: 'border-rose/50 bg-rose/10 text-rose hover:bg-rose/15',
    writes: 'The genome joins mutation.rejectedBy. The allele it carries does not change.',
  },
  {
    value: 'quarantine',
    label: 'Quarantine',
    hint: 'Hold it: neither adopted nor refused.',
    tone: 'border-amber/50 bg-amber/10 text-amber hover:bg-amber/15',
    writes: 'mutation.state becomes quarantined, which halts propagation to every relative.',
  },
  {
    value: 'request-tests',
    label: 'Run more tests',
    hint: 'Ask for evidence before deciding.',
    tone: 'border-cyan/50 bg-cyan/10 text-cyan hover:bg-cyan/15',
    writes: 'A sandbox run is queued. No decision is recorded until it reports.',
  },
];

export function DecisionConsole({
  mutation,
  shortId,
  checklist,
  genomeName,
  genomeAccession,
}: {
  mutation: string;
  shortId: string;
  checklist: ChecklistItem[];
  /** The genome the reader is deciding on behalf of. */
  genomeName: string;
  genomeAccession: string;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');
  const reasonId = useId();

  const blocking = checklist.filter((item) => !item.passed);
  const canAdopt = blocking.length === 0;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {DECISIONS.map((option) => {
          const isBlocked = option.value === 'adopt' && !canAdopt;
          return (
            <button
              key={option.value}
              type="button"
              disabled={isBlocked}
              aria-describedby={isBlocked ? `${reasonId}-blocked` : undefined}
              onClick={() => setDecision(option.value)}
              className={cn(
                'rounded-md border px-4 py-2.5 text-left transition-colors',
                isBlocked
                  ? 'border-line text-faint cursor-not-allowed'
                  : decision === option.value
                    ? option.tone
                    : 'border-line text-text-soft hover:border-line-strong hover:text-text',
              )}
            >
              <span className="block text-[14px] font-semibold">{option.label}</span>
              <span className="mt-0.5 block font-mono text-nano opacity-80">{option.hint}</span>
            </button>
          );
        })}
      </div>

      {!canAdopt && (
        <p id={`${reasonId}-blocked`} className="text-amber mt-3 max-w-[74ch] text-[13.5px] leading-relaxed">
          Adopt is unavailable: {blocking.length === 1 ? 'one gate has' : `${blocking.length} gates have`} not
          been cleared — {blocking.map((item) => item.label.toLowerCase()).join(', ')}. A mutation
          does not propagate on an assertion, so the gate is a block rather than a warning.
        </p>
      )}

      {decision && (
        <DecisionPreview
          decision={decision}
          mutation={mutation}
          shortId={shortId}
          genomeName={genomeName}
          genomeAccession={genomeAccession}
          reason={reason}
          onReason={setReason}
          onClear={() => {
            setDecision(null);
            setReason('');
          }}
        />
      )}
    </div>
  );
}

function DecisionPreview({
  decision,
  mutation,
  shortId,
  genomeName,
  genomeAccession,
  reason,
  onReason,
  onClear,
}: {
  decision: Decision;
  mutation: string;
  shortId: string;
  genomeName: string;
  genomeAccession: string;
  reason: string;
  onReason: (value: string) => void;
  onClear: () => void;
}) {
  const option = DECISIONS.find((entry) => entry.value === decision);
  const reasonId = useId();
  if (!option) return null;

  return (
    <div className="border-line bg-panel-2/60 mt-5 rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-text text-[14px] font-semibold">
          {option.label} — the record this would append
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-faint hover:text-text-soft font-mono text-nano transition-colors"
        >
          Clear
        </button>
      </div>

      <p aria-live="polite" className="text-muted mt-2 max-w-[74ch] text-[13.5px] leading-relaxed">
        {option.writes}
      </p>

      {/* -------------------------------------------------------- the reason field */}
      <div className="mt-4">
        <label htmlFor={reasonId} className="text-faint block font-mono text-nano uppercase">
          Reason {decision === 'request-tests' ? '(what to test)' : '(recorded with the decision)'}
        </label>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(event) => onReason(event.target.value)}
          rows={2}
          placeholder={
            decision === 'adopt'
              ? 'Latency win reproduced on our own device profile.'
              : decision === 'reject'
                ? 'Adds a dependency we do not want in the classroom build.'
                : decision === 'quarantine'
                  ? 'Holding until the accessibility suite is extended.'
                  : 'Run the chord-tolerance suite on a low-end Android profile.'
          }
          className="border-line bg-void text-text-soft focus-visible:outline-acid mt-1.5 w-full rounded border px-3 py-2 text-[13.5px] leading-relaxed focus-visible:outline-2"
        />
      </div>

      {/* ------------------------------------------------------- the record itself */}
      <pre className="border-line bg-void text-text-soft mt-4 overflow-x-auto rounded border p-3 font-mono text-[11.5px] leading-relaxed">
        {JSON.stringify(
          {
            mutation,
            shortId,
            decidedBy: genomeAccession,
            decision,
            reason: reason || null,
            requiresAttestation: true,
            decidedAt: '<signed at write time>',
          },
          null,
          2,
        )}
      </pre>

      <p className="text-faint mt-3 max-w-[74ch] text-[12.5px] leading-relaxed">
        Nothing was written. This build has no registry behind it, and a decision that only existed
        in a browser tab would be exactly the kind of unevidenced claim the protocol is designed to
        refuse. On a live registry this record would be signed on behalf of {genomeName} and
        countersigned by the proposing agent.
      </p>
    </div>
  );
}
