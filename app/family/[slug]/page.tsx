import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPangenomeMatrix } from '@/lib/registry/pangenome';
import { getFamilyTree, listFamilies } from '@/lib/registry/tree';
import { PangenomeHeatmap } from '@/components/registry/PangenomeHeatmap';
import { CodeTree } from '@/components/viz/tree/CodeTree';
import { StatRail } from '@/components/ui/Panel';

/** The hero mutation's upstream offer — the pulse the CodeTree animates. */
const PULSE_EDGE_ID = 'e-kidses-keylit-m882';

export function generateStaticParams() {
  return listFamilies().map((family) => ({ slug: family.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const family = getFamilyTree(slug);
  if (!family) return { title: 'Family not found' };

  return {
    title: `${family.name} CodeTree`,
    description: `${family.stats.projects} projects across ${family.generations} generations, ${family.stats.genes} capabilities, ${family.stats.mutations} recorded mutations. The ${family.name} family lineage.`,
  };
}

export default async function FamilyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const family = getFamilyTree(slug);
  if (!family) notFound();

  const root = family.nodes.find((node) => node.accession === family.root)!;
  const upstream = family.edges.filter((edge) => edge.type === 'PROPOSED_TO').length;
  const pangenome = getPangenomeMatrix();

  return (
    <div className="shell-wide py-10 md:py-14">
      <header className="max-w-[820px]">
        <p className="text-cyan font-mono text-micro uppercase">Family CodeTree</p>
        <h1 className="text-headline mt-3 text-balance">
          {family.name} and its {family.stats.projects - 1} descendants
        </h1>
        <p className="text-text-soft mt-4 leading-relaxed">
          Everything below descends from {root.name} — “{root.tagline}” Six layouts of the same
          graph, because no single picture answers every question about a family: descent reads best
          as a tree, hybrids need physics, and capability flow needs a Sankey.
        </p>
      </header>

      <StatRail
        className="mt-9"
        stats={[
          { label: 'Projects', value: family.stats.projects },
          { label: 'Generations', value: family.generations },
          { label: 'Capabilities', value: family.stats.genes },
          { label: 'Mutations', value: family.stats.mutations },
          {
            label: 'Hybrids',
            value: family.stats.hybrids,
            hint: 'two parents',
          },
          {
            label: 'Upstream offers',
            value: upstream,
            hint: 'child → ancestor',
          },
        ]}
      />

      <div className="border-violet/25 bg-violet/[0.04] mt-8 rounded-xl border p-5 md:p-6">
        <p className="text-violet font-mono text-nano uppercase">What to look for</p>
        <p className="mt-2.5 max-w-[76ch] text-[15px] leading-relaxed">
          {family.stats.transfers > 0 && (
            <>
              One capability in this family did not descend at all — it crossed from an unrelated
              project, drawn as a dashed amber arc.{' '}
            </>
          )}
          {upstream > 0 && (
            <>
              And {upstream} changes travelled the wrong way up the tree: a great-grandchild offering
              its ancestor something the ancestor never had.{' '}
            </>
          )}
          <Link href="/explore" className="text-text-soft underline decoration-dotted">
            Search the same records
          </Link>
          .
        </p>
      </div>

      <div className="mt-12">
        <CodeTree family={family} pulseEdgeId={PULSE_EDGE_ID} />
      </div>

      {/* ============================================================== pangenome */}
      <section className="mt-16">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          The family pangenome
        </h2>
        <p className="text-muted mt-2 max-w-[78ch] leading-relaxed">
          The tree shows how the family is related. This shows what it is made of: every project
          against every capability, with {pangenome.counts.core} genes carried by all{' '}
          {pangenome.columns.length} and {pangenome.counts.cloud} carried by exactly one. Bacterial
          pangenomics draws the same distinction, and for the same reason — the core is the family&rsquo;s
          identity, and the cloud is where members are actually experimenting.
        </p>

        <StatRail
          className="mt-6"
          stats={[
            {
              label: 'Core genes',
              value: pangenome.counts.core,
              hint: `in all ${pangenome.columns.length}`,
            },
            { label: 'Shell genes', value: pangenome.counts.shell, hint: 'in several' },
            { label: 'Cloud genes', value: pangenome.counts.cloud, hint: 'in one' },
            {
              label: 'Matrix filled',
              value: `${Math.round(
                (pangenome.totals.present / pangenome.totals.cells) * 100,
              )}%`,
              hint: `${pangenome.totals.present} of ${pangenome.totals.cells} cells`,
            },
            { label: 'Busiest cell', value: pangenome.peak, hint: 'mutation events' },
            {
              label: 'Awaiting a decision',
              value: pangenome.totals.pending,
              hint: 'offered, undecided',
            },
          ]}
        />

        <div className="mt-7">
          <PangenomeHeatmap pangenome={pangenome} />
        </div>
      </section>
    </div>
  );
}
