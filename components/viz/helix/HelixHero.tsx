'use client';

import { Canvas } from '@react-three/fiber';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useWebGL } from '@/lib/hooks/useWebGL';
import { ButtonLink } from '@/components/ui/Button';
import { BEATS, beatStateAt, daylight, type BeatState } from './beats';
import { HeroFallback } from './HeroFallback';

gsap.registerPlugin(useGSAP);

const HelixScene = dynamic(() => import('./HelixScene').then((m) => m.HelixScene), {
  ssr: false,
});

/** The eyebrow, headline and calls to action, shared by both hero variants. */
function HeroCopy({ children }: { children?: React.ReactNode }) {
  const copy = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion || !copy.current) return;
      const node = copy.current;
      const id = requestAnimationFrame(() => {
        gsap.fromTo(
          node.children,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.07, ease: 'power3.out' },
        );
      });
      return () => cancelAnimationFrame(id);
    },
    { scope: copy, dependencies: [reducedMotion] },
  );

  return (
    <div ref={copy} className="max-w-[720px]">
      {/* A rule, not a pulsing dot. The dot claimed something was live when
          nothing was, and its glow shadow was decoration. */}
      <p className="text-muted mb-6 flex items-center gap-3 font-mono text-micro uppercase">
        <span aria-hidden="true" className="bg-acid h-px w-8 shrink-0" />
        A living genealogy for software
      </p>

      <h1 id="hero-title" className="text-hero">
        Every machine
        <br />
        <span className="text-emphasis">has ancestors.</span>
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
        className="border-line text-muted hover:border-line-strong hover:text-text inline-flex items-center gap-2 rounded-xs border px-3 py-1.5 font-mono text-nano uppercase transition-colors"
      >
        <span aria-hidden="true" className="text-acid">
          ?
        </span>
        What am I looking at
      </button>

      {open && (
        <div
          id={panelId}
          className="border-line bg-panel-2 order-last w-full max-w-[560px] rounded-xs border p-4"
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
            <span className="text-emphasis">{outlined}</span>
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
    <section
      aria-labelledby="hero-title"
      data-hero="static"
      className="border-line relative -mt-[74px] border-b"
    >
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

    /* Measured straight out of the scroll event, never deferred into
       requestAnimationFrame. Browsers already coalesce scroll events to one per
       frame, so the rAF hop bought nothing — and rAF does not fire in a
       non-compositing tab, which froze the sequence on the first beat. */
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;

      const next = beatStateAt(progress);
      state.current = next;
      /* Written straight to the element, not through React state — the ground
         has to move every frame of the scroll, and re-rendering the hero for a
         colour would be an unnecessary render per pixel scrolled. `StudioRig`
         reads the same `daylight()` off the state ref. */
      node.style.setProperty('--daylight', daylight(progress).toFixed(4));
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

  return (
    <section
      ref={track}
      aria-labelledby="hero-title"
      data-hero="animated"
      /* Five beats of scroll runway, plus one viewport for the closing frame.
         Pulled under the 74px sticky header so the pinned frame is full-height
         from the first paint. */
      /* No colour transition. The ground is driven continuously by scroll, so a
         300ms ease would make it lag the scroll — and the text inside it, which
         inherits the same tokens without a transition, would arrive first. */
      className="hero-dawn relative -mt-[74px] h-[560vh]"
    >
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* The aperture.
            Lifted out of the centred `shell-wide` container so it can bleed off
            the right and vertical edges of the viewport. Once the scene owns an
            opaque, lightening ground, a canvas boxed inside the content column
            would read as a pale rectangle pasted onto a dark page — the same
            failure as the grey shadow quad. Running it to three edges makes it
            a window instead: a dark room with a lit world visible through it.

            No CSS glow behind it either. A blurred gradient orb sitting *behind*
            a transparent canvas cannot light anything in it; the atmosphere
            belongs to the scene, where it can wrap the specimen. `StudioRig`
            owns the background and the fog. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-45 lg:inset-y-0 lg:right-0 lg:left-[44%] lg:opacity-100"
        >
          <Canvas
            shadows={tier === 'high' ? { type: PCFSoftShadowMap, enabled: true } : false}
            dpr={tier === 'low' ? [1, 1.4] : [1, 1.9]}
            camera={{ position: [0, 2.2, 8.4], fov: 42, near: 0.1, far: 100 }}
            gl={{
              antialias: tier === 'high',
              alpha: true,
              powerPreference: 'high-performance',
              toneMapping: ACESFilmicToneMapping,
              outputColorSpace: SRGBColorSpace,
            }}
            onCreated={({ gl }) => {
              gl.toneMappingExposure = 1.16;
            }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <HelixScene state={state} tier={tier} />
          </Canvas>
        </div>

        {/* Narrow screens have no second column, so the copy sits on top of the
            aperture. As the scene lights up, that would put body text on bone;
            this veil deepens with the same `--daylight` to hold it back. Never
            shown on `lg`, where the two do not overlap. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{
            background: 'color-mix(in oklab, transparent, #07090d calc(var(--daylight, 0) * 74%))',
          }}
        />

        <div className="shell-wide relative z-10 flex flex-1 flex-col justify-center pt-20 pb-16 lg:grid lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] lg:items-center lg:gap-10">
          <div className="lg:order-1">
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
        </div>

        <div className="shell-wide relative z-10 pb-8">
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
