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
function HeroCopy({
  children,
  width = 'wider',
}: {
  children?: React.ReactNode;
  /** Wider for the animated hero (the helix absorbs the right edge).
   *  Narrower for the static hero, where a fallback image claims the right 46%. */
  width?: 'wider' | 'narrower';
}) {
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

  const total = String(BEATS.length).padStart(2, '0');
  const origin = BEATS[0];

  return (
    // The column leaves the specimen a zone. A fixed 1040px was right at 1600
    // and far too much at 1280, where the shell is only 1240px and the column
    // ran straight under the helix. 58% keeps the split at every width.
    <div
      ref={copy}
      data-hero-copy={width}
      className={width === 'wider' ? 'max-w-[min(1040px,58%)]' : 'max-w-[640px]'}
    >
      {/* The seam. A horizontal rule across the top of the copy column with the
          beat index on top of it. The rule runs from the column's left edge
          to the column's right edge, so the copy column now physically reaches
          toward the helix instead of stopping with empty void between them.
          At 1600 viewport the column is 1040px (87.5% of the 1480px shell)
          and the helix's first visible rail sits around x=920-1000, so the
          rule and the rail overlap by about 80-120px. That overlap is the
          seam: the index lives at the column's left edge, the rule travels
          across, and the helix begins where the rule ends.
          The line is `bg-line`, not `bg-acid`: the rule is the structural
          line of the page, the acid index is the mark on top of it. */}
      <div aria-hidden="true" className="border-line/70 relative mb-12 h-px w-full border-t" />
      <p className="text-text-soft -mt-[28px] mb-12 flex flex-wrap items-center gap-x-3 gap-y-2 pr-4 font-mono text-[13px] tracking-[0.14em] uppercase">
        <span className="text-acid border-acid/40 bg-void inline-flex items-center gap-2 rounded-xs border px-2 py-1 text-[13px] leading-none tracking-[0.14em]">
          {origin?.index ?? '01'}
          <span aria-hidden="true" className="text-acid/50">
            /
          </span>
          {total}
        </span>
        <span aria-hidden="true" className="text-faint">
          ·
        </span>
        <span>{origin?.id ?? 'project'}</span>
        <span aria-hidden="true" className="text-faint">
          ·
        </span>
        <span>A living genealogy for software</span>
      </p>

      {/* `text-hero` topped out at 92px, which put the widest line at x 537 —
          a headline occupying a third of a 1600px frame, with the specimen
          starting 770px later. `text-display` is 128px: the line reaches x 724
          and the headline finally has the size the page is asking for. */}
      <h1 id="hero-title" className="text-display">
        What if software
        <br />
        <span className="text-emphasis">had DNA?</span>
      </h1>

      {/* The deck is short and it is the sentence that earns the scroll, so it
          gets `text-title` (32px) rather than sharing the body's 20px. At 20px
          it read as a third paragraph instead of the turn in the argument. */}
      <p className="text-title text-text mt-8 max-w-[22ch] text-balance">
        Humans have family trees.
        <br />
        <span className="text-emphasis">Why shouldn&rsquo;t machines?</span>
      </p>

      {/* 52ch, not 58ch. At 1280 the body was the widest thing in the column —
          wider than the headline — so it, not the H1, decided where the copy
          ended and how much room the specimen had. */}
      <p className="text-lead text-text-soft mt-7 max-w-[52ch] leading-[1.7]">
        CodeAncestry creates a living genealogy for software, AI agents, and machines &mdash;
        tracking the capabilities they inherit, the mutations they acquire, and the generations
        that shaped them.
      </p>

      {/* The thesis used to be `text-headline` (40-64px). It competed with the
          H1 instead of supporting it. At `text-title` (24-32px) it reads as
          a quiet conclusion, weighted by `font-emphasis` to mark it as the
          sentence the rest has been building to. */}
      <p className="text-title text-text mt-10 max-w-[28ch] text-balance">
        <span className="text-emphasis">Every machine has ancestors.</span>
      </p>

      {children}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <ButtonLink href="/lineage" size="lg">
          Explore the Lineage
        </ButtonLink>
        <ButtonLink href={connectCta.href} variant="secondary" size="lg">
          {connectCta.label}
        </ButtonLink>
      </div>

      {/* `Git tracks code. CodeAncestry tracks evolution.` is dropped.
          It repeated the page's title sentence in eleven pixels at the bottom
          of the column, where it sat as a small voice the reader had to lean
          in to hear. The lead now carries that idea at body weight. */}

      <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2">
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
        className="border-line text-text hover:border-line-strong hover:text-text inline-flex items-center gap-2 rounded-xs border px-4 py-2.5 font-mono text-[13px] tracking-[0.08em] uppercase transition-colors"
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
          <ol className="text-text-soft space-y-2.5 text-[15px] leading-[1.6]">
            <li>
              <span className="text-acid mr-3 font-mono text-[13px] tracking-[0.06em]">01</span>
              Each strand is one software project. Each dot on it is one thing that project can
              do.
            </li>
            <li>
              <span className="text-acid mr-3 font-mono text-[13px] tracking-[0.06em]">02</span>
              Strands branching downward are projects that came from the one above them.
            </li>
            <li>
              <span className="text-acid mr-3 font-mono text-[13px] tracking-[0.06em]">03</span>
              The violet dot travelling upward is an improvement a descendant found, being
              offered back to its ancestors.
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
        <p className="text-muted text-micro font-mono uppercase">
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
 * It deliberately does NOT match `LocusLabels` in `HelixScene.tsx` in size.
 * The canvas chips stay at 9px because they are annotations pinned to a
 * specimen — growing them would let the labels compete with the thing they
 * label. This ledger is the readable copy, so it sits at `text-micro` (11px):
 * two steps of hierarchy, 11 / 15 / 11, instead of the chips' flat 9.
 *
 * The right column is `text-muted`, not `text-faint`. `faint` is a void token
 * — 4.78:1 measured against `#07090d` — and this figure sits on `bg-panel-2`
 * (`#111722`), where it drops under AA.
 *
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
      <figcaption className="text-muted text-micro mb-3 font-mono uppercase">
        Generation 0 · capability genes
      </figcaption>
      <ul className="border-line/60 border-t">
        {keylitLoci.map((locus) => (
          <li
            key={locus.accession}
            data-locus={locus.accession}
            className="border-line/60 flex items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-acid text-micro font-mono">{locus.accession}</span>
              <span className="text-text text-[15px]">{locus.gene}</span>
            </div>
            <span className="text-muted text-micro font-mono">{locus.short}</span>
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
        <HeroCopy width="narrower" />

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

        <p className="text-text-soft mt-10 font-mono text-[13px] tracking-[0.14em] uppercase">
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
          {/* The cue is the last line of the copy column, so it takes the
              column's width. It used to be a bare sibling of `HeroCopy`, which
              let it stretch across all 1480px of the shell and run out under
              the specimen, making it the one line in the hero that does not
              belong to the column it is the foot of. */}
          <p className="text-text-soft mt-12 max-w-[720px] font-mono text-[13px] tracking-[0.14em] uppercase">
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
