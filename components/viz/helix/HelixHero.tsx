'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { cn } from '@/lib/cn';
import { useHeroMode, type HeroMode } from '@/lib/hooks/useHeroMode';
import { ButtonLink } from '@/components/ui/Button';
import { BEATS, beatStateAt, type BeatState } from './beats';
import { HeroFallback } from './HeroFallback';

type LiveCanvas = ComponentType<{
  tier: Exclude<HeroMode, 'static'>;
  state: React.RefObject<BeatState>;
}>;

/* ==========================================================================
   Hero

   The scroll runway is declared in CSS, never in JavaScript:

     md:h-[720vh]                 seven beats of runway once the scene fits
     motion-reduce:md:h-auto      collapsed for anyone who asked for less motion

   That matters because the previous version chose its height from a JS state
   flip that lands one painted frame after hydration — swapping a ~1.5-viewport
   section for a multi-viewport one on every load. Height is now identical on the
   server and the client, so there is nothing to lurch.

   WebGL only decides what fills the frame. The beat narrative is DOM text
   driven by scroll, so it works with or without a GPU.
   ========================================================================== */

function HeroCopy({ children }: { children?: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  /* The one entrance sequence Nightglass allows per view: a short staggered
     reveal that establishes hierarchy, then gets out of the way. `useGSAP`
     scopes and reverts it automatically on unmount.

     Guarded on prefers-reduced-motion — GSAP writes inline styles, so the CSS
     kill-switch in globals.css cannot reach it. */
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      gsap.from('[data-reveal]', {
        opacity: 0,
        y: 16,
        duration: 0.52,
        ease: 'power3.out',
        stagger: 0.08,
        clearProps: 'opacity,transform',
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="max-w-[34rem] md:self-center">
      <p data-reveal className="flex items-center gap-3">
        <span className="text-acid label">Living registry</span>
        <span aria-hidden="true" className="bg-line h-px w-8" />
        <span className="text-muted label">Seeded · KEYLIT family</span>
      </p>

      <h1 data-reveal id="hero-title" className="text-hero mt-6">
        Every machine
        <br />
        <span className="text-acid">has ancestors.</span>
      </h1>

      <p data-reveal className="text-text-soft mt-5 text-lead">
        Trace what your software inherited, what it changed, and what it passes on.
      </p>

      {children}

      <div data-reveal className="mt-8 flex flex-wrap items-center gap-3">
        <ButtonLink href="/family/keylit" size="lg">
          Open the CodeTree
        </ButtonLink>
        <ButtonLink href="/explore" variant="secondary" size="lg">
          Explore the registry
        </ButtonLink>
      </div>

      <div data-reveal className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <WhatAmILookingAt />
        <p className="text-faint text-[13px]">
          Eight seeded projects.{' '}
          <Link href="/docs" className="text-muted hover:text-acid underline underline-offset-2">
            Read the protocol
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

/** Three lines of plain language, for anyone who does not want the metaphor. */
function WhatAmILookingAt() {
  const [open, setOpen] = useState(false);
  const panelId = 'hero-explainer';

  const LINES = [
    'Each strand is one software project. Each dot on it is one thing that project can do.',
    'Strands branching downward are projects that came from the one above them.',
    'The violet dot travelling upward is an improvement a descendant found, being offered back to its ancestors.',
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="border-line text-muted hover:text-text hover:bg-hover inline-flex h-11 items-center gap-2 rounded-md border px-4 text-[13px] transition-colors"
      >
        <span aria-hidden="true" className="text-acid">
          {open ? '−' : '+'}
        </span>
        What am I looking at
      </button>

      {open && (
        <div id={panelId} className="bg-panel border-line order-last w-full rounded-lg border p-5">
          <ol className="flex flex-col gap-3">
            {LINES.map((line, i) => (
              <li key={line} className="text-text-soft flex gap-3 text-[14px] leading-relaxed">
                <span className="text-acid label shrink-0 pt-1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {line}
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}

function BeatBody({ index, headline, outlined, body }: (typeof BEATS)[number]) {
  return (
    <>
      <p className="text-faint label" data-numeric>
        {index} / {String(BEATS.length).padStart(2, '0')}
      </p>
      <p className="text-title mt-2.5">
        {headline}
        {outlined && <span className="text-acid"> {outlined}</span>}
      </p>
      <p className="text-muted mt-2 max-w-[46ch] text-[15px] leading-relaxed">{body}</p>
    </>
  );
}

/**
 * The scene column: the 3D canvas when the GPU allows, the SVG otherwise.
 *
 * The height is explicit because `HelixCanvas` positions itself absolutely, so
 * this frame has no in-flow content to be measured from — left to size itself it
 * collapses to a hairline and the scene renders into nothing.
 */
function SceneFrame({ mode, state }: { mode: HeroMode; state: React.RefObject<BeatState> }) {
  const [Canvas, setCanvas] = useState<LiveCanvas | null>(null);

  /* Import three.js only after we know the scene will actually mount. A
     module-level `dynamic()` still preloads the chunk on first paint, which
     put ~400 KB of WebGL on phones that never show the canvas. */
  useEffect(() => {
    if (mode === 'static') return;
    let cancelled = false;
    void import('./HelixCanvas').then((mod) => {
      if (!cancelled) setCanvas(() => mod.HelixCanvas);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <div className="border-line bg-panel/40 relative hidden overflow-hidden rounded-lg border md:block md:h-full md:min-h-[26rem]">
      {mode === 'static' || !Canvas ? (
        <div className="grid size-full place-items-center p-6">
          <HeroFallback />
        </div>
      ) : (
        <Canvas tier={mode} state={state} />
      )}
      <p className="text-faint label absolute bottom-3 left-4">Fig. 1 · KEYLIT lineage</p>
    </div>
  );
}

export function HelixHero() {
  const mode = useHeroMode();
  const track = useRef<HTMLElement>(null);
  const state = useRef<BeatState>(beatStateAt(0));
  const [active, setActive] = useState(0);

  useEffect(() => {
    const node = track.current;
    if (!node) return;

    /* Measured straight out of the scroll event, never deferred into
       requestAnimationFrame.

       DO NOT reintroduce an rAF hop here "for throttling". Browsers already
       coalesce scroll events to at most one per frame, so it buys nothing — and
       it costs correctness: rAF does not fire in a tab that is not compositing,
       which leaves the whole sequence frozen on beat 00 forever. This codebase
       has hit that same trap three times now (feature detection in useWebGL and
       useReducedMotion, then this driver).

       `state.current` is a ref the 3D scene samples in useFrame; only the beat
       index goes through setState, and only when it actually changes. */
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;

      const next = beatStateAt(progress);
      state.current = next;
      setActive((prev) => (prev === next.activeIndex ? prev : next.activeIndex));
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);

    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const handleBeatSelect = (index: number) => {
    const node = track.current;
    if (!node) return;

    const scrollable = node.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const progress = BEATS[index]?.at ?? 0;
    const top = window.scrollY + node.getBoundingClientRect().top + progress * scrollable;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <section
      ref={track}
      aria-labelledby="hero-title"
      /* Height is pure CSS — identical on server and client. */
      className="relative md:h-[720vh] motion-reduce:md:h-auto"
    >
      <div className="md:sticky md:top-16 md:flex md:h-[calc(100vh-4rem)] md:flex-col motion-reduce:md:static motion-reduce:md:h-auto">
        <div className="shell-wide grid flex-1 items-center gap-12 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,42%)] md:items-stretch md:gap-16 md:py-10">
          <HeroCopy>
            {/* Pinned mode crossfades the beats; collapsed mode lists them. */}
            <div className="relative mt-8 hidden min-h-[180px] md:block motion-reduce:md:hidden">
              {BEATS.map((beat, i) => (
                <div
                  key={beat.id}
                  aria-hidden={i !== active}
                  className={cn(
                    'transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
                    i === active
                      ? 'relative opacity-100'
                      : 'pointer-events-none absolute inset-0 translate-y-3 opacity-0',
                  )}
                >
                  <BeatBody {...beat} />
                </div>
              ))}
            </div>

            {/* The sequence ends where the report ends it: on the ask. */}
            <div
              aria-hidden={active !== BEATS.length - 1}
              className={cn(
                'mt-6 hidden transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(0.16,1,0.3,1)] md:block motion-reduce:md:hidden',
                active === BEATS.length - 1
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-2 opacity-0',
              )}
            >
              <ButtonLink href="/explore" size="lg">
                Connect your first ancestor
              </ButtonLink>
            </div>
          </HeroCopy>

          <SceneFrame mode={mode} state={state} />
        </div>

        {/* Beat register — a measuring scale, not a progress bar. */}
        <div className="border-line hidden shrink-0 border-t md:block motion-reduce:md:hidden">
          <div className="shell-wide flex items-center justify-between gap-6 py-4">
            <ol className="flex items-center gap-1.5" aria-label="Hero progress">
              {BEATS.map((beat, i) => (
                <li key={beat.id}>
                  <button
                    type="button"
                    aria-current={i === active ? 'step' : undefined}
                    aria-label={`${beat.index} ${beat.headline} ${beat.outlined ?? ''}${i === active ? ' (current)' : ''}`}
                    onClick={() => handleBeatSelect(i)}
                    className="rounded-sm p-1"
                  >
                    {/* Fixed track, scaled fill — transform composites, width
                        does not. Colour is paired with scale so the current
                        beat is not colour-only. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'block h-0.5 w-10 origin-left rounded-full transition-[transform,background-color] duration-[520ms]',
                        i <= active ? 'bg-acid scale-x-100' : 'bg-line scale-x-[0.6]',
                      )}
                    />
                  </button>
                </li>
              ))}
            </ol>
            <p className="text-faint label">Scroll to descend the lineage</p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Collapsed composition: phones, and anyone who asked for less motion.

          This used to be the seven beats dumped into a two-column text grid
          with the lineage diagram buried underneath — a wall of prose with no
          visual anchor and no hierarchy. It is now a designed sequence:

            the diagram first, because it is the argument in one picture
            then the beats strung along a lineage spine, numbered at the node

          The spine is not decoration. It is the same descent the animated
          version walks, drawn as a line, so the collapsed page still says
          "this is a family" rather than "here are seven paragraphs".
          ------------------------------------------------------------------ */}
      <div className="shell-wide pb-20 md:hidden motion-reduce:md:block">
        <figure className="border-line bg-panel/40 m-0 overflow-hidden rounded-lg border px-4 py-8">
          <HeroFallback />
          <figcaption className="text-faint label mt-6 text-center">
            Fig. 1 · KEYLIT lineage · eight projects, four generations
          </figcaption>
        </figure>

        <ol className="border-line mt-14 border-l">
          {BEATS.map((beat) => (
            <li key={beat.id} className="relative pb-10 pl-7 last:pb-0">
              {/* The node on the spine. */}
              <span
                aria-hidden="true"
                className="bg-acid absolute top-[7px] -left-[4.5px] size-[9px] rounded-full"
              />
              <p className="text-faint label" data-numeric>
                {beat.index} / {String(BEATS.length).padStart(2, '0')}
              </p>
              <p className="text-title mt-2">
                {beat.headline}
                {beat.outlined && <span className="text-acid"> {beat.outlined}</span>}
              </p>
              <p className="text-muted mt-2 max-w-[46ch] text-[15px] leading-relaxed">
                {beat.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="border-line mt-12 border-t pt-8">
          <ButtonLink href="/explore" size="lg">
            Connect your first ancestor
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
