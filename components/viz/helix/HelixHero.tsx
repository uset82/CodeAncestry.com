'use client';

import { Canvas } from '@react-three/fiber';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useWebGL } from '@/lib/hooks/useWebGL';
import { ButtonLink } from '@/components/ui/Button';
import { BEATS, beatStateAt, type BeatState } from './beats';
import { HeroFallback } from './HeroFallback';

const HelixScene = dynamic(() => import('./HelixScene').then((m) => m.HelixScene), {
  ssr: false,
});

/* ==========================================================================
   Plate I

   The hero is a folio spread: the argument set on paper in the left column,
   the specimen mounted in a dark instrument plate on the right. The helix is
   never full-bleed — it is a figure, framed, captioned and numbered, which is
   the whole difference between a screensaver and a record.
   ========================================================================== */

/** Corner ticks on the instrument, the way a plate is trimmed to register. */
function PlateCorners() {
  const arm = 'border-paper/25 absolute size-3';
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className={`${arm} top-2 left-2 border-t border-l`} />
      <span className={`${arm} top-2 right-2 border-t border-r`} />
      <span className={`${arm} bottom-2 left-2 border-b border-l`} />
      <span className={`${arm} right-2 bottom-2 border-r border-b`} />
    </div>
  );
}

/**
 * The mounted specimen: dark instrument ground, hairline frame, figure caption
 * ruled off underneath. Accepts whatever renders the specimen itself.
 */
function InstrumentPlate({
  children,
  caption,
  className,
}: {
  children: React.ReactNode;
  caption: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn('instrument recessed m-0 flex flex-col', className)}>
      <div className="relative flex-1 overflow-hidden">
        {children}
        <PlateCorners />
      </div>
      <figcaption className="border-line text-faint runhead flex shrink-0 items-center justify-between gap-4 border-t px-4 py-2.5 text-[9px]">
        {caption}
      </figcaption>
    </figure>
  );
}

/** The eyebrow, headline and calls to action, shared by both hero variants. */
function HeroCopy({ children }: { children?: React.ReactNode }) {
  return (
    <div className="max-w-[660px]">
      <p className="flex items-center gap-4">
        <span className="text-press-vermilion runhead text-[10px]">Plate I</span>
        <span aria-hidden="true" className="bg-ink/25 h-px w-12" />
        <span className="text-ink-muted runhead text-[10px]">
          A living genealogy for software
        </span>
      </p>

      <h1 id="hero-title" className="text-hero mt-7">
        Every machine
        <br />
        <span className="text-emphasis">has ancestors.</span>
      </h1>

      {children}

      <div className="mt-9 flex flex-wrap items-center gap-4">
        <ButtonLink href="/family/keylit" size="lg">
          Open the CodeTree
        </ButtonLink>
        <ButtonLink href="/mutation/CAMUT:882" variant="secondary" size="lg">
          Follow one mutation
        </ButtonLink>
      </div>

      <div className="border-ink/15 mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-5">
        <WhatAmILookingAt />
        <p className="text-ink-muted text-[14px] leading-snug">
          Seeded with a real eight-project family.{' '}
          <Link
            href="/docs"
            className="decoration-press-vermilion/60 hover:text-ink underline underline-offset-[3px]"
          >
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="border-ink/40 text-ink-muted hover:border-ink hover:text-ink runhead inline-flex items-center gap-2 border px-3 py-2 text-[9.5px] transition-colors"
      >
        <span aria-hidden="true" className="text-press-vermilion">
          {open ? '–' : '+'}
        </span>
        What am I looking at
      </button>

      {open && (
        <div
          id={panelId}
          className="border-ink/25 bg-paper-2 order-last w-full max-w-[600px] border-l-2 border-l-press-vermilion border p-5"
        >
          <ol className="text-ink-soft space-y-3 text-[15px] leading-[1.6]">
            <li className="flex gap-3">
              <span className="text-press-vermilion runhead shrink-0 pt-1 text-[9px]">01</span>
              Each strand is one software project. Each dot on it is one thing that project can do.
            </li>
            <li className="flex gap-3">
              <span className="text-press-vermilion runhead shrink-0 pt-1 text-[9px]">02</span>
              Strands branching downward are projects that came from the one above them.
            </li>
            <li className="flex gap-3">
              <span className="text-press-vermilion runhead shrink-0 pt-1 text-[9px]">03</span>
              The violet dot travelling upward is an improvement a descendant found, being offered
              back to its ancestors.
            </li>
          </ol>
        </div>
      )}
    </>
  );
}

function BeatBody({ index, headline, outlined, body }: (typeof BEATS)[number]) {
  return (
    <>
      <p className="text-ink-faint runhead text-[9.5px]">
        {index} / {String(BEATS.length).padStart(2, '0')}
      </p>
      <p className="text-title mt-3 font-display">
        {headline}
        {outlined && (
          <>
            {' '}
            <span className="text-emphasis">{outlined}</span>
          </>
        )}
      </p>
      <p className="text-ink-soft mt-2.5 max-w-[52ch] text-[15.5px] leading-[1.6]">{body}</p>
    </>
  );
}

/**
 * Reduced-motion and no-WebGL hero.
 *
 * Not the animated hero with the animation removed: the five beats become a
 * single readable list and the scroll runway collapses, so nobody scrolls five
 * viewports to reach content that never moves.
 */
function StaticHero() {
  return (
    <section aria-labelledby="hero-title" className="border-ink/15 relative border-b">
      <div className="shell-wide grid gap-14 pt-20 pb-24 lg:grid-cols-[1fr_minmax(360px,44%)] lg:gap-16">
        <div>
          <HeroCopy />

          <ol className="mt-16 grid gap-x-14 gap-y-11 sm:grid-cols-2">
            {BEATS.map((beat) => (
              <li key={beat.id} className="border-ink/20 border-l pl-6">
                <BeatBody {...beat} />
              </li>
            ))}
          </ol>

          <p className="text-ink-faint runhead mt-12 text-[9.5px]">
            Static view · reduced motion
          </p>
        </div>

        <InstrumentPlate
          className="min-h-[440px] lg:sticky lg:top-28 lg:max-h-[74vh]"
          caption={
            <>
              <span>Fig. 1 — KEYLIT lineage</span>
              <span>Static reconstruction</span>
            </>
          }
        >
          <div className="grid size-full place-items-center p-4">
            <HeroFallback />
          </div>
        </InstrumentPlate>
      </div>
    </section>
  );
}

/** Scroll-driven hero: five pinned beats beside a procedural helix. */
function AnimatedHero({ tier }: { tier: 'low' | 'high' }) {
  const track = useRef<HTMLElement>(null);
  const state = useRef<BeatState>(beatStateAt(0));
  const [active, setActive] = useState(0);

  useEffect(() => {
    const node = track.current;
    if (!node) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;

      const next = beatStateAt(progress);
      state.current = next;
      setActive((prev) => (prev === next.activeIndex ? prev : next.activeIndex));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    frame = requestAnimationFrame(measure);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section
      ref={track}
      aria-labelledby="hero-title"
      /* Five beats of scroll runway, plus one viewport for the closing frame. */
      className="relative h-[560vh]"
    >
      <div className="sticky top-[94px] flex h-[calc(100vh-94px)] flex-col overflow-hidden">
        <div className="shell-wide grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1fr_minmax(340px,42%)] lg:gap-16">
          <HeroCopy>
            {/* All five beats stay in the DOM; the active one is emphasised. */}
            <div className="relative mt-9 min-h-[196px]">
              {BEATS.map((beat, i) => (
                <div
                  key={beat.id}
                  aria-hidden={i !== active}
                  className={cn(
                    'transition-[opacity,transform] duration-500 ease-out',
                    i === active
                      ? 'relative opacity-100'
                      : 'pointer-events-none absolute inset-0 translate-y-3 opacity-0',
                  )}
                >
                  <BeatBody {...beat} />
                </div>
              ))}
            </div>
          </HeroCopy>

          <InstrumentPlate
            className="hidden h-full max-h-[78vh] min-h-[380px] lg:flex"
            caption={
              <>
                <span>
                  Fig. 1 — KEYLIT lineage · beat {String(active + 1).padStart(2, '0')} of{' '}
                  {String(BEATS.length).padStart(2, '0')}
                </span>
                <span className="hidden xl:block">Procedural reconstruction</span>
              </>
            }
          >
            <Canvas
              dpr={tier === 'low' ? [1, 1.4] : [1, 1.9]}
              camera={{ position: [0, 2.2, 8.4], fov: 42, near: 0.1, far: 100 }}
              gl={{ antialias: tier === 'high', alpha: true, powerPreference: 'high-performance' }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <HelixScene state={state} tier={tier} />
            </Canvas>
          </InstrumentPlate>
        </div>

        {/* Beat register: a ruled scale, read like a measuring instrument. */}
        <div className="border-ink/15 shrink-0 border-t">
          <div className="shell-wide flex items-center justify-between gap-6 py-3.5">
            <ol className="flex items-stretch" aria-label="Hero progress">
              {BEATS.map((beat, i) => (
                <li key={beat.id}>
                  <span
                    className={cn(
                      'block h-[9px] w-10 border-r border-b-2 transition-colors duration-500',
                      i <= active
                        ? 'border-b-press-vermilion border-r-ink/25'
                        : 'border-b-ink/15 border-r-ink/10',
                    )}
                  >
                    <span className="sr-only">
                      {beat.index} {beat.headline} {beat.outlined ?? ''}
                      {i === active ? ' (current)' : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <p className="text-ink-faint runhead hidden text-[9px] sm:block">
              Scroll to descend the lineage
            </p>
          </div>
        </div>
      </div>

      {/* Text and diagram equivalent of the animation, for assistive tech. */}
      <div className="sr-only">
        <h2>The KEYLIT lineage</h2>
        <HeroFallback />
      </div>
    </section>
  );
}

export function HelixHero() {
  const reducedMotion = useReducedMotion();
  const { tier, supported } = useWebGL();

  if (!supported || reducedMotion) return <StaticHero />;
  return <AnimatedHero tier={tier === 'high' ? 'high' : 'low'} />;
}
