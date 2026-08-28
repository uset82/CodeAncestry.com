import type { Metadata } from 'next';
import { DocSection, ReadingShell } from '@/components/registry/RegistryShell';

export const metadata: Metadata = {
  title: 'Research',
  description:
    'The concept paper and design research behind CodeAncestry, and the genomics precedents it draws on.',
};

const PRECEDENTS = [
  {
    source: 'NCBI Gene · GenBank',
    borrow: 'Stable accessions and evidence-rich canonical records',
    surface: 'Gene Registry',
  },
  {
    source: 'UCSC Genome Browser',
    borrow: 'Heterogeneous annotation tracks on one coordinate system',
    surface: 'Project Genome Browser',
  },
  {
    source: 'Ensembl · Compara',
    borrow: 'Comparative genomics across related organisms',
    surface: 'Family comparison',
  },
  {
    source: 'Gene Ontology · AmiGO',
    borrow: 'Formal concepts with evidence codes, faceted filtering',
    surface: 'Capability ontology',
  },
  {
    source: '23andMe',
    borrow: 'Chromosome painting and explicit confidence controls',
    surface: 'Code Painting · Evidence Threshold',
  },
  {
    source: 'Nextstrain',
    borrow: 'Mutations annotated onto phylogeny branches',
    surface: 'Family CodeTree',
  },
  {
    source: 'BLAST',
    borrow: 'Similarity without exact identity',
    surface: 'CodeBLAST',
  },
  {
    source: 'DeepMind AlphaFold',
    borrow: 'Complex structure made emotionally legible',
    surface: 'Homepage',
  },
];

export default function ResearchPage() {
  return (
    <ReadingShell
      eyebrow="Research"
      title="Where this comes from"
      lede="CodeAncestry began as a practical question about KEYLIT: what if a child project could stay connected to its parent instead of becoming an isolated fork?"
    >
      <DocSection heading="The argument">
        <p>
          Software already behaves like a species. Forks, rewrites, ports and agent refactors move
          capabilities between projects every day. Git captures the diff and loses the descent —
          which capabilities were inherited, why they exist, what the child changed, and what its
          agents learned.
        </p>
        <p>
          Modern genomics has already solved several of the information problems that follow:
          separating a reference from its variants, attaching evidence to assertions, viewing many
          heterogeneous tracks over one coordinate system, and reconstructing relationships among
          descendants. Those are architectural precedents, not decoration.
        </p>
      </DocSection>

      <DocSection heading="Precedents and what each contributes">
        <div className="border-line overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-panel-2 border-line border-b">
              <tr>
                <th scope="col" className="label text-muted px-4 py-3">
                  Source
                </th>
                <th scope="col" className="label text-muted px-4 py-3">
                  Pattern borrowed
                </th>
                <th scope="col" className="label text-muted px-4 py-3">
                  Surface here
                </th>
              </tr>
            </thead>
            <tbody>
              {PRECEDENTS.map((row) => (
                <tr key={row.source} className="border-line border-b last:border-0">
                  <th scope="row" className="px-4 py-3 align-top font-medium whitespace-nowrap">
                    {row.source}
                  </th>
                  <td className="text-text-soft px-4 py-3 align-top leading-relaxed">
                    {row.borrow}
                  </td>
                  <td className="text-acid px-4 py-3 align-top whitespace-nowrap">{row.surface}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection heading="The caution that shaped the model">
        <p>
          Do not copy biology literally. Software has no single natural chromosome coordinate;
          capabilities span many files; one file may serve ten capabilities; fitness is
          multi-objective and environment-dependent; and software can transfer functionality between
          unrelated families far more easily than organisms exchange genes.
        </p>
        <p>
          So the canonical structure is a temporal directed graph with typed provenance edges, not a
          tree — and the pyramid from the original sketch is one presentation of it, not the data
          model.
        </p>
      </DocSection>

      <DocSection heading="Status">
        <p>
          This site is a working concept. Every screen is driven by seeded fixtures describing an
          eight-project KEYLIT family — no live repository is read, and no repository is written to.
          The numbers on the registry screens are the same numbers the fixtures contain.
        </p>
      </DocSection>
    </ReadingShell>
  );
}
