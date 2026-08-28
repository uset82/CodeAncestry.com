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

/** The eyebrow, headline and calls to action, shared by both hero variants. */
function HeroCopy({ children }: { children?: React.ReactNode }) {
  return (
    <div className="max-w-[720px]">
      <p className="text-acid mb-5 flex items-center gap-3 font-mono text-micro uppercase">
        <span
          aria-hidden="true"
          className="bg-acid size-[7px] animate-[breathe_4s_ease-in-out_infinite] rounded-full shadow-[0_0_16px_var(--color-acid)]"
        />
        A living genealogy for software
      </p>

      <h1 id="hero-title" className="text-hero">
        Every machine
        <br />
        <span className="text-outline">has ancestors.</span>
      </h1>

      {children}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <ButtonLink href="/family/keylit" size="lg">
          Open the CodeTree
        </ButtonLink>
        <ButtonLink href="/mutation/CAMUT:882" variant="secondary" size="lg">
          Follow one mutation
        </ButtonLink>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <WhatAmILookingAt />
        <p className="text-faint text-[13px]">
          Seeded with a real eight-project family.{' '}
          <Link href="/docs" className="text-muted hover:text-text underline decoration-dotted">
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
        className="border-line text-muted hover:border-line-strong hover:text-text inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-nano uppercase transition-colors"
      >
        <span aria-hidden="true" className="text-acid">
          ?
        </span>
        What am I looking at
      </button>

      {open && (
        <div
          id={panelId}
          className="border-line bg-panel/80 order-last w-full max-w-[560px] rounded-md border p-4 backdrop-blur-sm"
        >
          <ol className="text-text-soft space-y-2 text-[14px] leading-relaxed">
            <li>
              <span className="text-acid mr-2 font-mono text-nano">01</span>
              Each strand is one software project. Each dot on it is one thing that project can do.
            </li>
            <li>
              <span className="text-acid mr-2 font-mono text-nano">02</span>
              Strands branching downward are projects that came from the one above them.
            </li>
            <li>
              <span className="text-acid mr-2 font-mono text-nano">03</span>
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
      <p className="text-muted font-mono text-micro uppercase">
        {index} / {String(BEATS.length).padStart(2, '0')}
      </p>
      <p className="text-title mt-3">
        {headline}
        {outlined && (
          <>
            {' '}
            <span className="text-outline">{outlined}</span>
          </>
        )}
      </p>
      <p className="text-text-soft mt-3 max-w-[560px] leading-relaxed">{body}</p>
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
    <section aria-labelledby="hero-title" className="border-line relative -mt-[74px] border-b">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 hidden h-full w-[46%] place-items-center opacity-90 lg:grid"
      >
        <HeroFallback />
      </div>

      <div className="shell-wide relative pt-[168px] pb-24">
        <HeroCopy />

        <ol className="mt-14 grid max-w-[1080px] gap-x-12 gap-y-10 sm:grid-cols-2 xl:max-w-[640px] xl:grid-cols-1">
          {BEATS.map((beat) => (
            <li key={beat.id} className="border-line/70 border-l pl-5">
              <BeatBody {...beat} />
            </li>
          ))}
        </ol>

        <div className="mt-12 lg:hidden">
          <HeroFallback />
        </div>

        <p className="text-faint mt-10 font-mono text-nano uppercase">
          Static view · reduced motion
        </p>
      </div>
    </section>
  );
}

/** Scroll-driven hero: five pinned beats over a procedural helix. */
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
      /* Five beats of scroll runway, plus one viewport for the closing frame.
         Pulled under the 74px sticky header so the pinned frame is full-height
         from the first paint. */
      className="relative -mt-[74px] h-[560vh]"
    >
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* Offset right of the copy column on wide screens; dimmed and centred
            on narrow ones, where the copy needs the whole width. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-45 lg:translate-x-[14%] lg:opacity-100"
        >
          <div
            className="absolute top-1/2 left-1/2 size-[min(900px,90vw)] -translate-1/2 rounded-full opacity-70 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, rgb(99 231 255 / 0.1), rgb(183 255 57 / 0.05) 45%, transparent 68%)',
            }}
          />
          <Canvas
            dpr={tier === 'low' ? [1, 1.4] : [1, 1.9]}
            camera={{ position: [0, 2.2, 8.4], fov: 42, near: 0.1, far: 100 }}
            gl={{ antialias: tier === 'high', alpha: true, powerPreference: 'high-performance' }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <HelixScene state={state} tier={tier} />
          </Canvas>
        </div>

        {/* Keeps the copy legible over the brightest part of the helix. */}
        <div
          aria-hidden="true"
          className="from-void via-void/70 lg:via-void/20 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent"
        />

        <div className="shell-wide relative flex flex-1 flex-col justify-center pt-20 pb-24">
          <HeroCopy>
            {/* All five beats stay in the DOM; the active one is emphasised. */}
            <div className="relative mt-8 min-h-[188px]">
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
        </div>

        <div className="shell-wide relative pb-8">
          <div className="flex items-center justify-between gap-6">
            <ol className="flex items-center gap-2" aria-label="Hero progress">
              {BEATS.map((beat, i) => (
                <li key={beat.id}>
                  <span
                    className={cn(
                      'block h-[3px] rounded-full transition-all duration-500',
                      i <= active ? 'bg-acid w-9' : 'bg-line w-5',
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

            <p className="text-faint hidden font-mono text-nano uppercase sm:block">
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
