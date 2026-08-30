'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { ButtonLink } from '@/components/ui/Button';
import { connectCta } from '@/lib/site';
import { BEATS } from './beats';
import { LOCUS_LABELS } from './strands';
import { useHelixDriver } from './HelixStage';
import { HeroFallback } from './HeroFallback';

gsap.registerPlugin(useGSAP);

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
      <p className="text-muted mb-6 flex items-center gap-3 font-mono text-micro uppercase">
        <span aria-hidden="true" className="bg-acid h-px w-8 shrink-0" />
        A living genealogy for software
      </p>

      <h1 id="hero-title" className="text-hero">
        What if software
        <br />
        <span className="text-emphasis">had DNA?</span>
      </h1>

      <p className="text-title mt-5 max-w-[34ch] text-balance">
        Humans have family trees.
        <br />
        Why shouldn&rsquo;t machines?
      </p>

      <p className="text-text-soft mt-4 max-w-[540px] leading-relaxed">
        CodeAncestry creates a living genealogy for software, AI agents, and machines — tracking the
        capabilities they inherit, the mutations they acquire, and the generations that shaped them.
      </p>

      <p className="text-title mt-4">Every machine has ancestors.</p>

      {children}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink href="/lineage" size="lg">
          Explore the Lineage
        </ButtonLink>
        <ButtonLink href={connectCta.href} variant="secondary" size="lg">
          {connectCta.label}
        </ButtonLink>
      </div>

      <p className="text-muted mt-5 font-mono text-nano uppercase">
        Git tracks code. CodeAncestry tracks evolution.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <WhatAmILookingAt />
      </div>
    </div>
  );
}

/** Three lines of plain language, for anyone who does not want the metaphor. */
function WhatAmILookingAt() {
  const [open, setOpen] = useState(false);
  const panelId = 'hero-explainer';

  const handleToggle = () => setOpen((value) => !value);

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
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

function BeatBody({
  index,
  headline,
  outlined,
  body,
  hideIndex,
}: (typeof BEATS)[number] & { hideIndex?: boolean }) {
  return (
    <>
      {!hideIndex && (
        <p className="text-muted font-mono text-micro uppercase">
          {index} / {String(BEATS.length).padStart(2, '0')}
        </p>
      )}
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
 * Six capability genes, in DOM text.
 *
 * The chips on the canvas show the same six accessions, but at `tier === 'low'`,
 * on reduced motion, or without WebGL the chips are not mounted and the
 * universal gene labels disappear from the page. `docs/design-system.md` says
 * "3D must not hold unique information", so this is the text equivalent.
 *
 * The voice matches `LocusLabels` in `HelixScene.tsx`: `text-acid` accession,
 * `text-faint` short label, `font-mono text-[9px] tracking-[0.14em] uppercase`.
 * `LOCUS_LABELS.filter(l => l.strand === 'keylit')` is the same set beat 1
 * lights via `geneFocus: 1` — the section the headline refers to.
 */
function GeneReadout() {
  const keylitLoci = LOCUS_LABELS.filter((locus) => locus.strand === 'keylit');
  return (
    <figure
      aria-label="Six capability genes at generation 0"
      className="border-line bg-panel-2 mt-8 max-w-[560px] rounded-xs border p-5"
    >
      <figcaption className="text-faint mb-3 font-mono text-nano uppercase">
        Generation 0 · capability genes
      </figcaption>
      <ul className="border-line/60 border-t">
        {keylitLoci.map((locus) => (
          <li
            key={locus.accession}
            data-locus={locus.accession}
            className="border-line/60 flex items-baseline justify-between gap-4 border-b py-2 last:border-b-0"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-acid font-mono text-[9px] tracking-[0.14em] uppercase">
                {locus.accession}
              </span>
              <span className="text-text text-[14px]">{locus.gene}</span>
            </div>
            <span className="text-faint font-mono text-[10px] tracking-[0.08em] uppercase">
              {locus.short}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/**
 * Reduced-motion and no-WebGL hero.
 *
 * The twelve positions collapse to a readable list. The canvas is not mounted.
 */
function StaticHero() {
  const origin = BEATS[0];
  if (!origin) return null;

  return (
    <section
      aria-labelledby="hero-title"
      data-hero="static"
      data-beat="0"
      data-beat-side="left"
      className="border-line relative border-b"
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
          {BEATS.slice(1).map((beat) => (
            <li key={beat.id} className="border-line/70 border-l pl-5">
              <BeatBody {...beat} />
            </li>
          ))}
        </ol>

        <GeneReadout />

        <div className="mt-12 lg:hidden">
          <HeroFallback />
        </div>

        <p className="text-muted mt-10 font-mono text-nano uppercase">
          Static view · reduced motion
        </p>
      </div>
    </section>
  );
}

/** Copy only. The canvas lives on `HelixStage`. Two sections, two beats. */
function AnimatedHero() {
  const genes = BEATS[1];
  if (!genes) return null;

  return (
    <div data-hero="animated">
      <section
        data-beat="0"
        data-beat-side="left"
        aria-labelledby="hero-title"
        className="relative min-h-svh"
      >
        <div className="shell-wide relative z-10 flex min-h-svh flex-col justify-center pt-24 pb-16">
          <HeroCopy />
          <p className="text-muted mt-10 font-mono text-nano uppercase">
            Scroll to descend the lineage
          </p>
        </div>
        <div className="sr-only">
          <h2>The lineage</h2>
          <HeroFallback />
        </div>
      </section>

      <section
        data-beat="1"
        data-beat-side="left"
        aria-label={genes.headline}
        className="relative"
      >
        <div className="shell-wide relative z-10 flex min-h-[68svh] flex-col justify-center py-16">
          <BeatBody {...genes} hideIndex />
          <GeneReadout />
        </div>
      </section>
    </div>
  );
}

export function HelixHero() {
  const { animated } = useHelixDriver();
  if (!animated) return <StaticHero />;
  return <AnimatedHero />;
}
