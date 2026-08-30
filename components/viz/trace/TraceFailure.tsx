'use client';

import { useState, type AnimationEvent, type MouseEvent } from 'react';
import { cn } from '@/lib/cn';
import {
  TRACE_ACTION_COPY,
  TRACE_STEPS,
  traceFailure,
  type TraceActionId,
  type TracePhase,
} from '@/data/demo/trace';
import { demoAccession } from '@/data/demo';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { Eyebrow, Section } from '@/components/marketing/Section';

/**
 * Trace Failure is a state machine. The helix already inverts its pulses when
 * `rewind` is 1 — this plate names that path. No scrollY reverse on the canvas.
 */

const formatCount = (value: number) => value.toLocaleString('en-GB');

const scrollToId = (id: string) => {
  const node = document.getElementById(id);
  if (!node) return;
  const top = window.scrollY + node.getBoundingClientRect().top - 80;
  window.scrollTo({ top, behavior: 'instant' });
};

export function TraceStage() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<TracePhase>('armed');

  const handleTrace = () => {
    setPhase(reduced ? 'settled' : 'playing');
    scrollToId('trace-rewind');
  };

  const handleReset = () => {
    setPhase('armed');
    scrollToId('trace');
  };

  const handlePlayEnd = () => {
    setPhase('settled');
  };

  return (
    <>
      <TraceEntry phase={phase} onTrace={handleTrace} onReset={handleReset} />
      <TraceRewind phase={phase} onReset={handleReset} onPlayEnd={handlePlayEnd} />
    </>
  );
}

const TraceEntry = ({
  phase,
  onTrace,
  onReset,
}: {
  phase: TracePhase;
  onTrace: () => void;
  onReset: () => void;
}) => (
  <Section id="trace" beat={8} beatSide="left" className="min-h-screen">
    <div className="max-w-[640px]">
      <Eyebrow index="13">Trace Failure</Eyebrow>
      <h2 className="text-headline mt-4 text-balance">
        Trace
        <br />
        <span className="text-emphasis">Failure.</span>
      </h2>
      <p className="text-text-soft mt-6 leading-relaxed">
        The specimen on the right has changed shape — amber, then rose, and a flattened locus.
        Colour is never the only encoding. Press the trigger to walk the same path backward in
        type. The helix already inverted its pulses.
      </p>
    </div>

    <figure className="border-line bg-panel mt-12 max-w-[640px] rounded-sm border p-5 md:p-7">
      <article className="font-ui">
        <p className="text-muted font-mono text-nano uppercase">{traceFailure.meta.label}</p>
        <p className="text-rose mt-3 inline-flex items-center gap-2 font-mono text-micro uppercase">
          <span
            aria-hidden="true"
            className="border-rose/45 grid size-5 place-items-center rounded-xs border text-[11px]"
          >
            !
          </span>
          Alarm
        </p>
        <h3 className="mt-3 text-[18px] leading-tight font-semibold tracking-tight">
          {traceFailure.trigger}
        </h3>
        <p className="text-text-soft mt-2 text-[14px] leading-relaxed">
          Capability {demoAccession(traceFailure.geneId)} · mutation{' '}
          {demoAccession(traceFailure.mutationId)} · {formatCount(traceFailure.descendants)}{' '}
          descendants. Last safe ancestor is generation {traceFailure.lastSafeAncestor}.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTrace}
            className="bg-rose text-void hover:bg-rose-dim rounded-xs px-3 py-2 font-mono text-nano uppercase"
          >
            Trace Failure
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={phase === 'armed'}
            className="border-line text-muted hover:text-text rounded-xs border px-3 py-2 font-mono text-nano uppercase disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </article>
      <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
        Trigger · same node set · no reverse camera
      </figcaption>
    </figure>
  </Section>
);

const TraceRewind = ({
  phase,
  onReset,
  onPlayEnd,
}: {
  phase: TracePhase;
  onReset: () => void;
  onPlayEnd: () => void;
}) => {
  const [action, setAction] = useState<TraceActionId | null>(null);

  const handleAction = (next: TraceActionId) => {
    setAction(next);
  };

  const handleReset = () => {
    setAction(null);
    onReset();
  };

  const handleLastStepEnd = (event: AnimationEvent<HTMLLIElement>) => {
    if (event.target !== event.currentTarget) return;
    onPlayEnd();
  };

  const handleOpenStep = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return;
    const node = document.getElementById(href.slice(1));
    if (!node) return;
    event.preventDefault();
    const top = window.scrollY + node.getBoundingClientRect().top - 80;
    window.scrollTo({ top, behavior: 'instant' });
    window.history.pushState(null, '', href);
  };

  return (
    <Section id="trace-rewind" beat={9} beatSide="left" className="min-h-screen">
      <div className="max-w-[640px]">
        <Eyebrow index="13">Rewind</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          The path lights
          <br />
          <span className="text-emphasis">backward.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          Ancestor to failure, reversed. Same facts if the canvas is still. Reduced motion keeps
          the stepped list and skips the rise.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[640px] rounded-sm border p-5 md:p-7">
        <article className="font-ui">
          <p className="text-muted font-mono text-nano uppercase">
            {traceFailure.meta.label} · {TRACE_STEPS.length} loci
          </p>
          <ol className="relative mt-5 pl-6">
            <svg
              aria-hidden="true"
              viewBox="0 0 8 320"
              preserveAspectRatio="none"
              className="absolute top-1 bottom-1 left-0 w-2"
            >
              <line
                x1="4"
                y1="0"
                x2="4"
                y2="320"
                stroke="var(--color-rose)"
                strokeWidth="1.3"
                strokeDasharray="4 5"
                className={phase === 'armed' ? undefined : 'animate-dash'}
                opacity="0.7"
              />
            </svg>
            {TRACE_STEPS.map((step, index) => {
              const live = phase !== 'armed';
              const last = index === TRACE_STEPS.length - 1;
              const href = 'href' in step ? step.href : undefined;
              return (
                <li
                  key={step.id}
                  className={cn('mb-3 last:mb-0', phase === 'playing' && 'animate-rise')}
                  style={phase === 'playing' ? { animationDelay: `${index * 280}ms` } : undefined}
                  onAnimationEnd={phase === 'playing' && last ? handleLastStepEnd : undefined}
                >
                  <p className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 grid size-5 shrink-0 place-items-center rounded-xs border font-mono text-[10px]',
                        step.id === 'safe'
                          ? 'border-acid/45 text-acid'
                          : live
                            ? 'border-rose/45 text-rose'
                            : 'border-line text-muted',
                      )}
                    >
                      {step.mark}
                    </span>
                    <span className="min-w-0">
                      <span className="text-muted block font-mono text-nano uppercase">
                        {String(index + 1).padStart(2, '0')} · {step.kind}
                      </span>
                      {href ? (
                        <a
                          href={href}
                          onClick={(event) => handleOpenStep(event, href)}
                          className="text-text hover:text-acid mt-0.5 inline-block text-[15px] leading-snug tracking-tight underline decoration-dotted"
                        >
                          {step.title}
                        </a>
                      ) : (
                        <span className="text-text mt-0.5 block text-[15px] leading-snug tracking-tight">
                          {step.title}
                        </span>
                      )}
                      <span className="text-text-soft mt-1 block text-[13.5px] leading-relaxed">
                        {step.detail}
                      </span>
                    </span>
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="border-line mt-6 border-t pt-4">
            <p className="text-muted font-mono text-nano uppercase">Recovery · demo states</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {traceFailure.actions.map((item) => (
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
              {action
                ? TRACE_ACTION_COPY[action]
                : 'Select a recovery to see what it would mean. None of them write.'}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="text-text-soft hover:text-text mt-4 inline-block text-[13.5px] underline decoration-dotted"
            >
              Reset the trace
            </button>
          </div>
        </article>
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Behavior → gene → mutation → agents → descendants → generation 118
        </figcaption>
      </figure>
    </Section>
  );
};
