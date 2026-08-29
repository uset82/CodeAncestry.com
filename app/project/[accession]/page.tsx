import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CodePaintingStrip } from '@/components/registry/CodePaintingStrip';
import { ExportPanel } from '@/components/registry/ExportPanel';
import { ProvenanceViewer } from '@/components/registry/ProvenanceViewer';
import { JsonLd } from '@/components/seo/JsonLd';
import { StatRail } from '@/components/ui/Panel';
import { GenomeBrowser } from '@/components/viz/genome/GenomeBrowser';
import { getGenomeBrowserModel } from '@/lib/registry/genome';
import { getDataPackage } from '@/lib/registry/pack';
import { getProvenanceForGenome } from '@/lib/registry/provenance';
import { EVIDENCE_TIER_META } from '@/lib/schema/vocabulary';
import { genomeJsonLd } from '@/lib/seo/jsonld';
import { pageMeta } from '@/lib/seo/metadata';

/**
 * The Project Genome Browser page — the signature registry screen.
 *
 * Accession-first, the way an NCBI or UniProt record is: the identifier and the
 * commit it pins are the headline, the prose comes second, and the browser
 * itself is the body of the page.
 */

/*
 * Deliberately not prerendered. An accession contains a colon, and prerendering
 * writes one file per route, which Windows will not accept as a filename — the
 * build fails locally while passing in CI. Rendering on demand costs a handful
 * of cached requests and keeps the accession in the URL, where it belongs.
 *
 * Switching the canonical URL to the genome slug would let these prerender
 * again; that is a decision for every accession route at once, not this one.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accession: string }>;
}): Promise<Metadata> {
  const { accession } = await params;
  const model = getGenomeBrowserModel(decodeURIComponent(accession));
  if (!model) return { title: 'Genome not found' };

  const { genome, stats } = model;
  return pageMeta({
    title: `${genome.name} — ${genome.accession}`,
    description: `Genome browser for ${genome.name}: generation ${stats.generation}, ${stats.genes} capabilities, ${stats.mutations} mutations, ${stats.verifiedReleases} verified releases. ${genome.tagline}`,
    path: `/project/${genome.accession}`,
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ accession: string }>;
}) {
  const { accession } = await params;
  const model = getGenomeBrowserModel(decodeURIComponent(accession));
  if (!model) notFound();

  const { genome, stats, parents, children, painting } = model;
  const tier = EVIDENCE_TIER_META[genome.lineageAssurance];
  const compareTarget = parents[0]?.accession ?? children[0]?.accession ?? null;
  const provenance = getProvenanceForGenome(genome.accession);
  const pack = getDataPackage(genome.accession);

  return (
    <div className="shell-wide py-10 md:py-14">
      <JsonLd data={genomeJsonLd(genome)} />
      {/* ============================================================== header */}
      <header>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-cyan font-mono text-micro uppercase">Project genome</p>
          <p className="text-faint font-mono text-micro">{genome.accession}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="min-w-0">
            <h1 className="text-headline text-balance">{genome.name}</h1>
            <p className="text-text-soft mt-3 max-w-[70ch] leading-relaxed">{genome.description}</p>
          </div>

          {compareTarget && (
            <Link
              href={`/compare?a=${encodeURIComponent(genome.accession)}&b=${encodeURIComponent(compareTarget)}`}
              className="border-line-strong text-text hover:border-acid/50 hover:text-acid shrink-0 rounded-md border px-4 py-2 font-mono text-nano transition-colors"
            >
              Compare genomes →
            </Link>
          )}
        </div>

        {/* ----------------------------------------------------- source pinning */}
        <dl className="border-line/70 mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t pt-4">
          <Pin label="Repository" value={genome.repository} />
          <Pin label="Commit" value={`commit:${genome.commit.slice(0, 10)}`} />
          <Pin label="Tree digest" value={genome.treeDigest} />
          <Pin label="Branch" value={genome.defaultBranch} />
          <Pin label="License" value={genome.license} />
          <Pin label="Visibility" value={genome.visibility} />
        </dl>

        {/* ------------------------------------------------------------ lineage */}
        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2">
          <span className="text-faint font-mono text-nano">Lineage</span>
          {model.lineage.map((step, index) => (
            <span key={step.accession} className="flex items-center gap-2">
              {index > 0 && (
                <span aria-hidden="true" className="text-faint font-mono text-nano">
                  →
                </span>
              )}
              {step.accession === genome.accession ? (
                <span className="border-acid/40 bg-acid/10 text-acid rounded-sm border px-2 py-[3px] font-mono text-nano">
                  {step.name} Gen {step.generation}
                </span>
              ) : (
                <Link
                  href={`/project/${step.accession}`}
                  className="border-line bg-panel-2 text-text-soft hover:border-line-strong rounded-sm border px-2 py-[3px] font-mono text-nano transition-colors"
                >
                  {step.name} Gen {step.generation}
                </Link>
              )}
            </span>
          ))}
        </div>
      </header>

      {/* ================================================== overview statistics */}
      <StatRail
        className="mt-9"
        stats={[
          { label: 'Generation', value: stats.generation },
          { label: 'Capabilities', value: stats.genes, hint: 'genes' },
          {
            label: 'Known parents',
            value: stats.parents,
            hint: stats.parents === 0 ? 'origin' : parents.map((p) => p.relationship).join(', '),
          },
          {
            label: 'Verified releases',
            value: `${stats.verifiedReleases}/${stats.totalReleases}`,
            hint: 'attested',
          },
          { label: 'Direct children', value: children.length },
          { label: 'Mutations', value: stats.mutations },
          {
            label: 'Coverage',
            value: stats.coverage === null ? '—' : `${Math.round(stats.coverage * 100)}%`,
            hint: 'latest run',
          },
        ]}
      />

      {/* ------------------------------------------------- lineage assurance note */}
      <p className="text-muted mt-6 max-w-[80ch] text-[14px] leading-relaxed">
        The ancestry claim itself is{' '}
        <strong className={`font-semibold ${tier.tone}`}>{genome.lineageAssurance}</strong>.{' '}
        {tier.description}
        {parents.length > 0 && (
          <>
            {' '}
            {parents
              .map(
                (parent) =>
                  `${parent.name} contributes ${Math.round(parent.contribution * 100)}% as a ${parent.relationship}, born from commit:${parent.bornFromCommit.slice(0, 10)}`,
              )
              .join('; ')}
            .
          </>
        )}
      </p>

      {/* ======================================================= Code Painting */}
      <section className="mt-12">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">Code Painting</h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          What share of {genome.name} came from where, by declared capability weight — the same idea
          as a chromosome painting in consumer genomics. Hover or focus a segment for the
          capabilities it covers.
        </p>
        <div className="border-line bg-panel mt-5 rounded-lg border p-4 sm:p-6">
          <CodePaintingStrip painting={painting} />
        </div>
      </section>

      {/* ======================================================= Genome Browser */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">Genome browser</h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          Ten tracks over one shared axis. Switch the coordinate system to re-ask the question:
          temporal for when things happened, repository for where the code sits, semantic for what it
          does. Everything is also available as tables.
        </p>
        <div className="mt-5">
          <GenomeBrowser model={model} />
        </div>
      </section>

      {/* ========================================================== descendants */}
      {children.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
            Direct descendants
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <li key={child.accession}>
                <Link
                  href={`/project/${child.accession}`}
                  className="border-line bg-panel hover:border-line-strong block h-full rounded-lg border p-4 transition-colors"
                >
                  <p className="text-faint font-mono text-nano">{child.accession}</p>
                  <p className="mt-1.5 text-[15px] font-semibold tracking-tight">{child.name}</p>
                  <p className="text-muted mt-1 font-mono text-nano">
                    Generation {child.generation} · founded {child.createdAt}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ========================================================== provenance */}
      {provenance && (
        <section className="mt-14">
          <h2 className="text-[22px] leading-tight font-semibold tracking-tight">Provenance</h2>
          <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
            How this genome was produced, in the vocabulary of the standards it already sits on:
            W3C PROV triples, in-toto statements, an inferred SLSA Build level, and a CycloneDX
            pedigree. The genetic language on the rest of this page is a reading of this graph, not
            a replacement for it.
          </p>
          <div className="mt-5">
            <ProvenanceViewer record={provenance} />
          </div>
        </section>
      )}

      {/* ============================================================== export */}
      {pack && (
        <section className="mt-14">
          <h2 className="text-[22px] leading-tight font-semibold tracking-tight">Export</h2>
          <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
            An NCBI-style data package: named files, a README, and nothing invented. Download the
            archive or save one file.
          </p>
          <div className="mt-5">
            <ExportPanel pack={pack} />
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- honesty note */}
      <p className="border-line/70 text-faint mt-14 max-w-[80ch] border-t pt-5 text-[13px] leading-relaxed">
        Every number on this page comes from the seeded KEYLIT fixtures, not from a live scan of the
        repository. Track positions on the temporal axis are declared in the genome record rather
        than derived from commit timestamps, and features with no coordinate under the current
        system are reported as unplaced instead of being given an invented position.
      </p>
    </div>
  );
}

function Pin({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-faint font-mono text-nano uppercase">{label}</dt>
      <dd className="text-text-soft mt-1 font-mono text-[13px] break-all">{value}</dd>
    </div>
  );
}
