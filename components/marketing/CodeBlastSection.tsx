import Link from 'next/link';
import { DemoBlast } from '@/components/viz/blast/DemoBlast';
import { Eyebrow, Section } from './Section';

/**
 * Homepage 10 — CodeBLAST. Beat 6. The helix is already streaming sources;
 * this names relatives across those streams. Prototype, not a live engine.
 */

export function CodeBlastSection() {
  return (
    <Section id="blast" beat={6} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="10">CodeBLAST</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          Find the relatives
          <br />
          <span className="text-emphasis">of any capability.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          Genomics asks what else looks like this. CodeBLAST asks the same of a job the code does.
          The console below is a labelled prototype. It does not pretend a production semantic
          engine exists.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[720px] rounded-sm border p-5 md:p-7">
        <DemoBlast />
        <figcaption className="text-muted mt-6 border-t border-line pt-4 font-mono text-nano uppercase">
          Seeded AXIS relatives · not measured similarity
        </figcaption>
      </figure>

      <p className="text-muted mt-6 max-w-[560px] text-[14px] leading-relaxed">
        The full paste-code console lives on{' '}
        <Link href="/blast" className="text-text-soft hover:text-text underline decoration-dotted">
          /blast
        </Link>
        . Same honesty: lexical demonstration, not a fingerprint service.
      </p>
    </Section>
  );
}
