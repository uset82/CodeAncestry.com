import type { Metadata } from 'next';
import Link from 'next/link';
import { Mermaid } from '@/components/docs/Mermaid';
import { SpecTable } from '@/components/docs/SpecTable';
import { PaperFigure, PaperMasthead, PaperSection, PaperToc } from '@/components/research/Paper';
import { AccessionBadge } from '@/components/ui/AccessionBadge';
import { LINEAGE_GRAPH_DIAGRAM, LINEAGE_STACK_DIAGRAM, PROPAGATION_DIAGRAM } from '@/lib/docs/diagrams';
import { JsonLd } from '@/components/seo/JsonLd';
import { PAPER, PAPER_CONTRIBUTIONS, PAPER_PRECEDENTS, REPRODUCTION_MODES } from '@/lib/docs/paper';
import { getGeneTimeline, getProjectTimeline, OPEN_QUESTIONS } from '@/lib/docs/timeline';
import { PROPAGATION_PROTOCOL } from '@/lib/schema/mutation';
import { paperJsonLd } from '@/lib/seo/jsonld';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: `${PAPER.runningTitle} — ${PAPER.title}`,
  description:
    'Working paper: a living lineage protocol for software genomes, agent inheritance, and evolutionary software ecosystems. Origin, model, KEYLIT specimen, and open questions.',
  path: '/research',
});

export default function ResearchPage() {
  const projectTime = getProjectTimeline();
  const geneTime = getGeneTimeline();

  return (
    <div className="shell-wide py-12 md:py-20">
      <JsonLd data={paperJsonLd(PAPER)} />
      <PaperMasthead />

      <div className="lg:grid lg:grid-cols-[13rem_minmax(0,42rem)] lg:items-start lg:gap-20 xl:grid-cols-[13rem_minmax(0,42rem)_minmax(0,1fr)]">
        <aside className="mb-12 lg:mb-0">
          <PaperToc />
        </aside>

        <article className="min-w-0">
          <section id="abstract" className="scroll-mt-28 mb-16">
            <h2 className="text-faint font-mono text-[11px] tracking-[0.18em] uppercase">Abstract</h2>
            <p className="text-text mt-4 text-[17px] leading-[1.7]">
              Software already reproduces. Forks, ports, rewrites and agent refactors move
              capabilities between projects every day. Git records the diff and loses the descent:
              which capabilities were inherited, why they exist, what a child changed, and what its
              agents learned. This paper proposes CodeAncestry as a semantic lineage layer above
              Git — not a host, not an SBOM, and not a literal genetics engine. The objects are
              genomes, capability genes, alleles, typed lineage edges, mutations with evidence, and
              portable agent identity. The contribution is the combination of those objects with a
              propagation protocol that never adopts automatically. Biology is the interface
              metaphor. Underneath it are commits, digests, manifests, signatures, tests and policy.
              The argument is illustrated on a seeded eight-project family, KEYLIT, which is a
              specimen, not a result.
            </p>
            <ol className="border-line mt-8 flex flex-col gap-3 border-t pt-6">
              {PAPER_CONTRIBUTIONS.map((item, index) => (
                <li key={item} className="grid grid-cols-[2.25rem_1fr] gap-3">
                  <span className="text-acid font-mono text-[12px]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </section>

          <PaperSection id="origin" n="1" title="Origin">
            <p>
              The idea started as a practical question about one project. KEYLIT is a browser piano
              tutor: Web MIDI, sampled audio, a lesson engine, a tool surface for agents. Once it
              existed, the obvious next things were children — a version for small hands, a studio,
              a classroom, an edition playable without sight. GitHub can fork the repository. It
              cannot keep saying, years later, which capabilities those children still carry, which
              they rewrote, and which improvements should be offered back.
            </p>
            <p>
              Music already has language for this: original, remix, cover, mashup. Software does
              not. A GitHub template starts a new history. A fork preserves commits and still loses
              the semantic claim — that this capability came from that project, under this
              evidence. The stronger version of a fork is a living lineage: every application knows
              its parent, the version it was born from, what it inherited, what it changed, which
              changes it should keep inheriting, and which new abilities it developed.
            </p>
            <p>
              Adding an agent to every generation changed the problem again. The lineage is then
              not only a history of repositories. Each project can carry a machine-readable genome,
              each capability can have ancestry, each mutation can carry evidence, and each project
              agent can offer a discovery to its relatives. Relatives decide. Nothing merges
              because an agent was confident.
            </p>
          </PaperSection>

          <PaperSection id="problem" n="2" title="What Git loses">
            <p>
              Git is the source of truth for bytes. It is not a genealogy. Two repositories that
              share no forge relationship can still share a capability. Two repositories that do
              share a fork edge can have rewritten every inherited gene. Cross-forge families
              recovered from shared commits already show that the platform-native fork graph is an
              incomplete pedigree.
            </p>
            <p>
              Software product-line research has long treated families of related products built
              from common assets. Research on software evolution has long treated change as a
              continuing process. Neither gives a maintainer a record they can point at and say:
              this allele of MIDI scheduling started here, travelled there, mutated under this
              measurement, and was offered upstream with this attestation.
            </p>
            <div className="border-line my-2 grid gap-6 border-y py-6 sm:grid-cols-2">
              <p>
                <span className="text-faint block font-mono text-[11px] tracking-[0.14em] uppercase">
                  Software today
                </span>
                <span className="text-text mt-2 block font-mono text-[13px] leading-relaxed">
                  Build → Ship → Maintain → Rewrite → Die
                </span>
              </p>
              <p>
                <span className="text-faint block font-mono text-[11px] tracking-[0.14em] uppercase">
                  The claim of this paper
                </span>
                <span className="text-text mt-2 block font-mono text-[13px] leading-relaxed">
                  Birth → Inherit → Adapt → Learn → Reproduce → Evolve
                </span>
              </p>
            </div>
            <p>
              The second sequence is a human-facing abstraction, not a compiler. The pyramid from
              the original sketch is one picture of descent. The data model is a temporal directed
              graph with typed provenance edges. Hybrids have two parents. A descendant can offer a
              change to an ancestor. Those edges are first-class, not errors.
            </p>
          </PaperSection>

          <PaperSection id="modes" n="3" title="Four reproduction modes">
            <p>
              Music already names the relationship between a work and what comes after it. The
              protocol borrows those names so a child is not only “a fork.” Each mode is a
              different inheritance contract. None of them is implemented as a product button on
              this site. They are the kinds of descent the records are meant to hold.
            </p>
            <div className="border-line my-2 grid gap-8 border-y py-7 sm:grid-cols-2">
              {REPRODUCTION_MODES.map((mode) => (
                <div key={mode.name}>
                  <h3 className="text-text text-[1.05rem] font-semibold tracking-[-0.02em]">
                    {mode.name}
                  </h3>
                  <p className="text-faint mt-2 font-mono text-[12px]">{mode.inherit}</p>
                  <p className="mt-2">{mode.intent}</p>
                </div>
              ))}
            </div>
            <p>
              A cover is the mode that Git handles worst. Two implementations can be the same
              capability without sharing a commit. A mashup is the mode a tree cannot draw: two
              parents, one child. The registry is a DAG because those cases are ordinary.
            </p>
          </PaperSection>

          <PaperSection id="model" n="4" title="The model">
            <p>
              A <strong className="text-text">gene</strong> is a stable semantic capability — MIDI
              scheduling, sample playback, adaptive lesson scoring. It is not a file and not a
              function. One capability may span many files; one utility file may serve ten
              capabilities. The logical gene identifier stays stable when the implementation is
              rewritten or ported.
            </p>
            <p>
              An <strong className="text-text">allele</strong> is one implementation of that
              capability. Two distant descendants can carry functionally related alleles even when
              language, path and version number differ. That is why allele is a better concept than
              version. A <strong className="text-text">mutation</strong> is one capability changing,
              with the measurement that justified it. A{' '}
              <strong className="text-text">genome</strong> is the versioned composition of a
              project at a point in its history.
            </p>
            <p>
              <strong className="text-text">Agent DNA</strong> is not model weights, hidden
              reasoning, or a chat log. It is a portable, auditable manifest: identity, permitted
              tools, policies, public decision memories, trusted relatives, and signed observations.
              MCP can expose the registry to agents. A2A can carry typed tasks between them. Neither
              creates safe inheritance. The policy layer is this protocol.
            </p>
            <p>
              Declared ancestry and inferred ancestry are separate. A maintainer saying this
              project is a child of KEYLIT is a first-class assertion. A model proposing the same
              edge is supporting evidence until a test or a human says otherwise. Fitness is a
              vector under a named environment, never one number that ranks a gene as better.
            </p>
            <PaperFigure
              id="fig-stack"
              n="1"
              caption="Every claim in the registry is supposed to rest on something underneath it. Git remains the source of truth for the code."
            >
              <Mermaid
                chart={LINEAGE_STACK_DIAGRAM}
                caption="Projects, knowledge and evidence sit above Git; they do not replace it."
              />
            </PaperFigure>
          </PaperSection>

          <PaperSection id="protocol" n="5" title="Propagation">
            <p>
              A mutation never spreads because a related agent recommends it. The biological
              metaphor stops where software safety begins. The steps are the same ones the live
              protocol implements:
            </p>
            <ol className="my-2 flex flex-col gap-3">
              {PROPAGATION_PROTOCOL.map((step, index) => (
                <li key={step.step} className="grid grid-cols-[2.25rem_1fr] gap-3">
                  <span className="text-acid font-mono text-[12px]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="text-text font-medium">{step.step}.</span> {step.detail}
                  </span>
                </li>
              ))}
            </ol>
            <PaperFigure
              id="fig-protocol"
              n="2"
              caption="Discover through decide. Adopt, reject and quarantine are the only terminals. Notify relatives is optional and never implied by adopt."
            >
              <Mermaid
                chart={PROPAGATION_DIAGRAM}
                caption="The seven-step propagation protocol implemented by the mutation records."
              />
            </PaperFigure>
            <p>
              Existing provenance standards are the skeleton, not the competition. W3C PROV already
              talks in entities, activities and agents. SLSA and in-toto already bind artifacts to
              how they were produced. CycloneDX already models component pedigree. Recording that
              software has ancestors is therefore not, on its own, a contribution. The distinctive
              claim is semantic capability lineage, agent identity, mutation evaluation,
              bidirectional offers, and a human-facing evolutionary record — built on those
              formats, not instead of them.
            </p>
          </PaperSection>

          <PaperSection id="specimen" n="6" title="KEYLIT specimen">
            <p>
              The working site is seeded with one family of eight projects. No live repository is
              read. The numbers on the registry screens are the numbers in the fixtures. That is
              enough to hold the two clocks the Human Genome Project made ordinary: project time
              (when a genome was born) and gene time (when a capability changed). They are not the
              same clock.
            </p>
            <p>
              MIDI Scheduling is the worked example. Allele 1 is a fixed 128-sample buffer,
              observed in KEYLIT on 28 August 2026. Allele 5 is an adaptive buffer, observed in
              KEYLIT Kids ES on 18 January 2027 — four generations of project time later, and still
              the same gene. Mutation M-83F12 is the record of that change. It has been offered
              upstream. It has not been adopted by the ancestor. Maintainer approval is the missing
              rung, and the page will not pretend otherwise.
            </p>
            <PaperFigure
              id="fig-family"
              n="3"
              caption={
                <>
                  Descent in the seeded family, plus one upstream offer. The hybrid Junior Music
                  Tutor has two parents. See the live graph at{' '}
                  <Link href="/family/keylit" className="text-cyan underline-offset-2 hover:underline">
                    /family/keylit
                  </Link>
                  .
                </>
              }
            >
              <Mermaid
                chart={LINEAGE_GRAPH_DIAGRAM}
                caption="KEYLIT descent, a recombination, and an offer back to the ancestor."
              />
            </PaperFigure>
            <div className="grid gap-10 md:grid-cols-2">
              <TimelineColumn
                heading="Project time"
                lede="When each genome in the seeded family was created."
                events={projectTime}
              />
              <TimelineColumn
                heading={`Gene time · ${geneTime.geneName}`}
                lede={
                  <>
                    Alleles of <AccessionBadge accession={geneTime.geneId} size="xs" />. The
                    adaptive buffer arrives after generation zero.
                  </>
                }
                events={geneTime.events}
              />
            </div>
            <p className="text-muted mt-8 text-[13.5px] leading-relaxed">
              Figure 4 is the dual timeline as lists, not as a picture. Project time and gene time
              share dates and disagree about what those dates mean.
            </p>
          </PaperSection>

          <PaperSection id="related" n="7" title="Related work">
            <p>
              The useful genetics inspiration is not “make the website look like DNA.” It is how
              genomic systems already expose identity, ancestry, scale, uncertainty, evidence and
              relationship. NCBI and UniProt show what a canonical record feels like. UCSC and
              Ensembl show many heterogeneous tracks over one axis. Gene Ontology shows concepts
              with evidence codes. Nextstrain puts mutations on a phylogeny. BLAST finds similarity
              without claiming identity. DeepMind showed that a hard structure can be made
              emotionally legible without becoming a toy.
            </p>
            <p>
              Software already has the low-level pieces. Provenance, SBOMs, attestations, forges,
              MCP and A2A exist. Software product lines exist. What they do not jointly provide is
              a semantic layer that names capabilities, versions them as alleles, attaches evidence
              to inheritance, and lets a descendant offer a measured change back to an ancestor
              under the ancestor’s own tests.
            </p>
            <SpecTable
              caption="Architectural precedents, and the surface each one informed on this site"
              columns={[
                { key: 'source', label: 'Source' },
                { key: 'borrow', label: 'Pattern borrowed' },
                { key: 'surface', label: 'Surface here' },
              ]}
              rows={PAPER_PRECEDENTS.map((row) => ({
                source: row.source,
                borrow: row.borrow,
                surface: row.surface,
              }))}
            />
          </PaperSection>

          <PaperSection id="questions" n="8" title="Open questions">
            <p>
              This is a working concept, not a closed theory. The model is designed to keep the
              following visible rather than paper them over.
            </p>
            <ol className="flex flex-col gap-6">
              {OPEN_QUESTIONS.map((question, index) => (
                <li key={question.title}>
                  <p className="text-acid font-mono text-[12px]">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="text-text mt-1 text-[1.15rem] font-semibold tracking-[-0.02em]">
                    {question.title}
                  </h3>
                  <p className="mt-2">{question.body}</p>
                </li>
              ))}
            </ol>
          </PaperSection>

          <PaperSection id="limits" n="9" title="Limits">
            <p>
              Nothing on this site has been measured against a live corpus. There is no GitHub App,
              no write integration, no sandbox that actually executes a stranger’s patch, and no
              claim that agents have learned across a family in production. The KEYLIT numbers are
              fixture numbers. A later paper can become a protocol specification —{' '}
              <code>genome.json</code>, <code>agent-dna.json</code>, mutation records, accession
              rules, the messages an ancestor and a descendant exchange. That paper does not exist
              until the objects stop being illustrative.
            </p>
            <p>
              The long horizon is still the one the origin thread stated: in a few decades a
              machine should be able to ask who its ancestors were and get an answer with evidence
              attached. The work that has to happen first is narrower. Connect a repository.
              Propose genes. Record a child. Offer one mutation. Run the adopter’s tests. Decide in
              public.
            </p>
            <p>
              Vocabulary is a constraint, not a style guide. Use lineage, variant, capability,
              fitness under environment X. Never bloodline, purity, dominant, superior genes. The
              full rule is on the{' '}
              <Link href="/docs/language" className="text-cyan underline-offset-2 hover:underline">
                language and ethics
              </Link>{' '}
              page.
            </p>
          </PaperSection>

          <footer className="border-line mt-6 border-t pt-10">
            <h2 className="text-faint font-mono text-[11px] tracking-[0.18em] uppercase">
              How to cite
            </h2>
            <p className="text-muted mt-3 font-mono text-[12.5px] leading-relaxed">{PAPER.citation}</p>
            <p className="text-muted mt-8 text-[14px] leading-relaxed">
              Continue in the{' '}
              <Link href="/docs" className="text-cyan underline-offset-2 hover:underline">
                protocol specification
              </Link>
              .
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}

const TimelineColumn = ({
  heading,
  lede,
  events,
}: {
  heading: string;
  lede: React.ReactNode;
  events: { date: string; label: string; detail: string; href?: string }[];
}) => (
  <div>
    <h3 className="text-text text-[1.05rem] font-semibold tracking-[-0.02em]">{heading}</h3>
    <p className="text-muted mt-2 mb-4 text-[13.5px] leading-relaxed">{lede}</p>
    <ol className="border-line border-l pl-4">
      {events.map((event) => (
        <li key={`${event.date}-${event.label}`} className="relative mb-5 last:mb-0">
          <span
            aria-hidden="true"
            className="bg-cyan absolute top-1.5 -left-[calc(0.5rem+5px)] size-2 rounded-full"
          />
          <p className="text-faint font-mono text-[12px]">{event.date}</p>
          {event.href ? (
            <Link href={event.href} className="text-text hover:text-acid font-medium transition-colors">
              {event.label}
            </Link>
          ) : (
            <p className="text-text font-medium">{event.label}</p>
          )}
          <p className="text-muted text-[13px]">{event.detail}</p>
        </li>
      ))}
    </ol>
  </div>
);
