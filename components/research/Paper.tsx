import Link from 'next/link';
import { cn } from '@/lib/cn';
import { PAPER, PAPER_TOC } from '@/lib/docs/paper';

export function PaperMasthead() {
  return (
    <header className="border-line mb-14 border-b pb-12 md:mb-16 md:pb-16">
      <p className="text-acid font-mono text-[11px] tracking-[0.18em] uppercase">
        Working paper · v{PAPER.version} · {PAPER.dated}
      </p>
      <p className="text-faint mt-5 font-mono text-[12px] tracking-[0.16em] uppercase">
        {PAPER.runningTitle}
      </p>
      <h1 className="text-headline mt-3 max-w-[22ch]">{PAPER.title}</h1>
      <p className="text-muted mt-6 max-w-[46rem] text-[15px] leading-relaxed">{PAPER.status}</p>
      <ul className="text-faint mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[12px]">
        {PAPER.keywords.map((word) => (
          <li key={word}>{word}</li>
        ))}
      </ul>
      <p className="text-muted mt-8 max-w-[46rem] text-[14px] leading-relaxed">
        Canonical text of the concept paper. A typeset PDF is not in this repository. The protocol
        this argument describes is the working site —{' '}
        <Link href="/docs" className="text-cyan underline-offset-2 hover:underline">
          specification
        </Link>
        ,{' '}
        <Link href="/family/keylit" className="text-cyan underline-offset-2 hover:underline">
          KEYLIT family
        </Link>
        .
      </p>
    </header>
  );
}

export function PaperToc() {
  return (
    <nav aria-label="Paper contents" className="lg:sticky lg:top-24">
      <p className="text-faint mb-4 font-mono text-[11px] tracking-[0.18em] uppercase">Contents</p>
      <ol className="flex flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:flex-nowrap">
        {PAPER_TOC.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="text-muted hover:text-text inline-flex items-baseline gap-3 text-[13.5px] transition-colors"
            >
              {item.n && (
                <span className="text-acid w-4 shrink-0 font-mono text-[11px]">{item.n}</span>
              )}
              <span className={cn(!item.n && 'pl-7')}>{item.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PaperSection({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 mb-16 last:mb-0">
      <h2 className="text-title">
        <span className="text-acid mr-3 font-mono text-[13px]">{n}</span>
        {title}
      </h2>
      <div className="text-text-soft mt-5 flex flex-col gap-4 text-[16.5px] leading-[1.7]">
        {children}
      </div>
    </section>
  );
}

export function PaperFigure({
  id,
  n,
  caption,
  children,
}: {
  id: string;
  n: string;
  caption: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <figure id={id} className="border-line my-10 border-y py-8">
      {children}
      <figcaption className="text-muted mt-5 max-w-[46rem] text-[13px] leading-relaxed">
        <span className="text-acid mr-2 font-mono text-[11px] tracking-[0.12em] uppercase">
          Figure {n}
        </span>
        {caption}
      </figcaption>
    </figure>
  );
}
