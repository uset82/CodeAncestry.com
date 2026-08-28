import type { Metadata } from 'next';
import Link from 'next/link';
import { BLAST_EXAMPLES } from '@/lib/registry/search';
import { BlastConsole } from '@/components/registry/BlastConsole';
import { runCodeBlast } from './actions';

export const metadata: Metadata = {
  title: 'CodeBLAST',
  description:
    'Paste an implementation and find the capabilities in the registry that do the same job, with a breakdown of which fingerprint facets produced the alignment.',
};

export default function BlastPage() {
  return (
    <div className="shell-wide py-10 md:py-14">
      <header className="max-w-[820px]">
        <p className="text-violet font-mono text-micro uppercase">Prototype</p>
        <h1 className="text-headline mt-3 text-balance">CodeBLAST</h1>
        <p className="text-text-soft mt-4 leading-relaxed">
          Genomics has a tool for the question &ldquo;what else looks like this?&rdquo; — BLAST. This
          is the same idea aimed at capabilities: paste an implementation, get the genes in the
          registry that do the same job, ranked by how much of the fingerprint aligned.
        </p>

        <div className="border-amber/25 bg-amber/[0.05] mt-6 rounded-lg border p-4">
          <p className="text-amber font-mono text-nano uppercase">Read this first</p>
          <p className="text-text-soft mt-2 text-[14px] leading-relaxed">
            The matching engine here is a demonstration. It scores lexical overlap and distributes it
            across the six fingerprint facets deterministically, so the interface can be designed and
            argued about before the real comparison exists. The percentages are honest about their own
            method and should not be read as measured similarity.{' '}
            <Link href="/docs" className="text-amber underline decoration-dotted">
              What a real implementation requires
            </Link>
            .
          </p>
        </div>
      </header>

      <div className="mt-12">
        <BlastConsole examples={BLAST_EXAMPLES} search={runCodeBlast} />
      </div>
    </div>
  );
}
