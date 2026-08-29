import { Eyebrow, Section } from './Section';

/**
 * The positioning argument, and the one section that has to be unambiguous:
 * CodeAncestry sits above Git, it does not replace it.
 *
 * The stack diagram is plain HTML rather than SVG so the layer names are real
 * text, selectable and readable in document order top to bottom.
 */

type Layer = {
  id: string;
  label: string;
  detail: string;
  entities?: string[];
  tone: string;
  edge: string;
};

const LAYERS: Layer[] = [
  {
    id: 'evidence',
    label: 'Evidence',
    detail: 'Why any of it should be believed',
    entities: ['Test runs', 'Sandbox measurements', 'Attestations', 'Human review'],
    tone: 'text-acid',
    edge: 'border-acid/35',
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    detail: 'What was learned and can be reused',
    entities: ['Learning artifacts', 'Fitness vectors', 'Phenotypes'],
    tone: 'text-violet',
    edge: 'border-violet/30',
  },
  {
    id: 'entities',
    label: 'Projects · Genes · Agents',
    detail: 'The things the registry names and versions',
    entities: ['Genomes', 'Capability genes', 'Alleles', 'Agent DNA'],
    tone: 'text-cyan',
    edge: 'border-cyan/30',
  },
  {
    id: 'layer',
    label: 'CodeAncestry layer',
    detail: 'Accessions, typed lineage edges, mutation records',
    tone: 'text-acid',
    edge: 'border-acid/25',
  },
  {
    id: 'artifacts',
    label: 'Artifacts',
    detail: 'Builds, packages, SBOMs, releases',
    tone: 'text-muted',
    edge: 'border-line',
  },
  {
    id: 'git',
    label: 'Git',
    detail: 'Commits, trees, blobs — still the source of truth',
    tone: 'text-faint',
    edge: 'border-line',
  },
];

const CONTRASTS = [
  {
    git: 'A fork is a new repository with no memory of the original.',
    ca: 'A fork is a child genome with a typed edge and a contribution share.',
  },
  {
    git: 'A rewrite in another language looks like unrelated code.',
    ca: 'A rewrite carries the same gene with a new allele and the same origin.',
  },
  {
    git: 'A diff tells you 400 lines changed.',
    ca: 'A mutation tells you latency fell 22 ms and complexity rose 5.',
  },
  {
    git: 'A commit author is a name and an email.',
    ca: 'An agent is an identity with declared capabilities and signed outputs.',
  },
];

export function MeaningLayer() {
  return (
    <Section id="meaning" beat={3} beatSide="left">
      <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div>
          <Eyebrow index="02">Position</Eyebrow>
          <h2 className="text-headline mt-4 text-balance">
            Git stores lines.
            <br />
            <span className="text-emphasis">CodeAncestry stores meaning.</span>
          </h2>
          <p className="text-text-soft mt-6 max-w-[560px] leading-relaxed">
            This is a semantic layer, not a replacement. Git keeps every commit; CodeAncestry adds
            the statement Git was never designed to make — that this capability came from that
            project, and here is the evidence.
          </p>

          <dl className="mt-10 space-y-px">
            {CONTRASTS.map((row) => (
              <div key={row.git} className="bg-line/40">
                <div className="bg-void grid gap-2 py-4 sm:grid-cols-2 sm:gap-8">
                  <dt className="text-faint text-[14px] leading-relaxed">
                    <span className="text-faint mr-2 font-mono text-nano uppercase">Git</span>
                    {row.git}
                  </dt>
                  <dd className="text-text-soft text-[14px] leading-relaxed">
                    <span className="text-acid mr-2 font-mono text-nano uppercase">Here</span>
                    {row.ca}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <p className="text-muted mt-8 max-w-[560px] text-[13px] leading-relaxed">
            Each layer only makes claims it can support with the layer below it. Nothing in the
            registry is asserted without something underneath it to check.
          </p>
        </div>

        <figure className="m-0">
          <figcaption className="text-muted mb-4 font-mono text-nano uppercase">
            The stack, top to bottom
          </figcaption>

          <ol className="space-y-2">
            {LAYERS.map((layer, i) => (
              <li key={layer.id} className="relative">
                <div
                  className={`bg-panel-2 rounded-xs border ${layer.edge} px-4 py-3.5`}
                  style={{
                    /* Narrows toward Git so the diagram reads as a stack rather
                       than a list, without needing perspective transforms. */
                    marginInlineStart: `clamp(0px, ${i * 1.4}vw, ${i * 10}px)`,
                  }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className={`text-[15px] font-semibold tracking-tight ${layer.tone}`}>
                      {layer.label}
                    </span>
                    <span className="text-faint text-[13px]">{layer.detail}</span>
                  </div>

                  {layer.entities && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {layer.entities.map((entity) => (
                        <li
                          key={entity}
                          className="border-line bg-panel-2 text-muted rounded-sm border px-1.5 py-[3px] font-mono text-nano"
                        >
                          {entity}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {i < LAYERS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="text-faint absolute -bottom-[9px] left-1/2 text-[10px] leading-none"
                  >
                    ▲
                  </span>
                )}
              </li>
            ))}
          </ol>
        </figure>
      </div>
    </Section>
  );
}
