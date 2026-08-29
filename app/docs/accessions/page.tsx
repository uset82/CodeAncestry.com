import type { Metadata } from 'next';
import { DocsArticle } from '@/components/docs/DocsShell';
import { SpecTable } from '@/components/docs/SpecTable';
import { AccessionBadge } from '@/components/ui/AccessionBadge';
import { CodeBlock, DocSection } from '@/components/registry/RegistryShell';
import { demo } from '@/lib/site';
import {
  ACCESSION_KINDS,
  ACCESSION_PREFIXES,
  parseAccession,
} from '@/lib/schema/accession';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Accession scheme',
  description:
    'Stable, immutable CodeAncestry identifiers in the tradition of NCBI, UniProt and PDB.',
  path: '/docs/accessions',
});

const EXAMPLES = [
  'CAPROJ:01JKEYLIT000',
  'CAGENOME:01JKEYLIT7H2',
  'CAGENE:MIDI-SCHEDULING',
  'CAALLELE:MIDI-SCHEDULING:5',
  'CAMUT:882',
  'CAAGENT:KIDSES:12',
  'CAEV:991',
  'CAPHENO:882',
  'CAMEM:104',
] as const;

export default function AccessionsPage() {
  return (
    <DocsArticle
      eyebrow="Documentation · Protocol"
      title="Accession scheme"
      lede="The human-readable label of an entity stays editable forever. The accession never changes. NCBI's own sample records recommend searching by accession for exactly this reason."
    >
      <DocSection heading="Shape">
        <p>
          An accession is <code>PREFIX:local-id</code>. The prefix is one of{' '}
          {ACCESSION_PREFIXES.length} controlled values. Parsing never throws: free-text search and
          accession resolution share the same function, and a miss returns null.
        </p>
        <CodeBlock>
          {`parseAccession("CAGENE:MIDI-SCHEDULING")
${JSON.stringify(parseAccession('CAGENE:MIDI-SCHEDULING'), null, 2)}`}
        </CodeBlock>
      </DocSection>

      <DocSection heading="Prefixes">
        <SpecTable
          caption="Accession prefixes and whether each entity has its own page"
          columns={[
            { key: 'prefix', label: 'Prefix', mono: true },
            { key: 'label', label: 'Entity' },
            { key: 'plural', label: 'Plural' },
            { key: 'routable', label: 'Canonical page' },
          ]}
          rows={ACCESSION_PREFIXES.map((prefix) => {
            const kind = ACCESSION_KINDS[prefix];
            return {
              prefix: kind.prefix,
              label: kind.label,
              plural: kind.plural,
              routable: kind.routable ? 'Yes' : 'Inline on the owner',
            };
          })}
        />
        <p>
          Evidence, phenotypes and memories have accessions so they can be cited. They do not have
          their own routes — they appear on the genome, mutation or agent that owns them.
        </p>
      </DocSection>

      <DocSection heading="Seeded examples">
        <ul className="flex flex-col gap-2">
          {EXAMPLES.map((accession) => {
            const parsed = parseAccession(accession);
            const kind = parsed ? ACCESSION_KINDS[parsed.prefix] : null;
            return (
              <li key={accession} className="flex flex-wrap items-center gap-3">
                <AccessionBadge accession={accession} />
                <span className="text-muted text-[13px]">{kind?.label ?? 'Unparsed'}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4">
          Try a live record:{' '}
          <a href={demo.heroGene} className="text-cyan underline-offset-2 hover:underline">
            {demo.heroGene}
          </a>
          .
        </p>
      </DocSection>
    </DocsArticle>
  );
}
