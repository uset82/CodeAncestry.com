import Link from 'next/link';
import { cn } from '@/lib/cn';
import { agentA184 } from '@/data/demo';

/**
 * Three-graph join. Agent, project, and gene rails are separate histories.
 * They couple at A-184 — the same idea the helix poses when `agents` is 1.
 * Marks encode kind (● agent, ■ project, △ gene). Colour is secondary.
 */

type LineageNode = {
  id: string;
  mark: string;
  label: string;
  detail?: string;
  href?: string;
  current?: boolean;
};

const RAILS: readonly {
  id: 'agent' | 'project' | 'gene';
  label: string;
  tone: string;
  stroke: string;
  nodes: readonly LineageNode[];
}[] = [
  {
    id: 'agent',
    label: 'Agent lineage',
    tone: 'text-violet',
    stroke: 'var(--color-violet)',
    nodes: agentA184.lineages.agent,
  },
  {
    id: 'project',
    label: 'Project lineage',
    tone: 'text-cyan',
    stroke: 'var(--color-cyan)',
    nodes: agentA184.lineages.project,
  },
  {
    id: 'gene',
    label: 'Gene lineage',
    tone: 'text-acid',
    stroke: 'var(--color-acid)',
    nodes: agentA184.lineages.gene,
  },
];

const JOIN = RAILS.map((rail) => rail.nodes.find((node) => node.current) ?? rail.nodes.at(-1)).filter(
  (node): node is LineageNode => Boolean(node),
);

export function ThreeLineage({ className }: { className?: string }) {
  return (
    <div className={cn('font-ui', className)}>
      <p className="text-muted font-mono text-nano uppercase">Ancestry chain</p>
      <ol className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {agentA184.ancestry.map((step, index) => (
          <li key={step} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden="true" className="text-muted font-mono text-nano">
                →
              </span>
            )}
            <span
              className={cn(
                'rounded-xs border px-2 py-1 font-mono text-nano uppercase',
                step === 'AGENT A-184'
                  ? 'border-violet/45 text-violet'
                  : 'border-line text-text-soft',
              )}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>

      <p className="text-muted mt-8 font-mono text-nano uppercase">Three lineages</p>
      <div className="mt-4 space-y-5">
        {RAILS.map((rail) => (
          <Rail key={rail.id} rail={rail} />
        ))}
      </div>

      <JoinPlate nodes={JOIN} />
    </div>
  );
}

const Rail = ({
  rail,
}: {
  rail: (typeof RAILS)[number];
}) => (
  <div>
    <p className={cn('mb-2 font-mono text-nano uppercase', rail.tone)}>{rail.label}</p>
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {rail.nodes.map((node, index) => (
        <li key={node.id} className="flex items-center gap-1">
          {index > 0 && <RailTick stroke={rail.stroke} />}
          <NodeChip node={node} tone={rail.tone} />
        </li>
      ))}
    </ol>
  </div>
);

const NodeChip = ({ node, tone }: { node: LineageNode; tone: string }) => {
  const current = Boolean(node.current);
  const className = cn(
    'inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 text-left font-mono text-nano uppercase transition-colors',
    current ? `border-current ${tone}` : 'border-line text-text-soft hover:text-text',
  );

  const body = (
    <>
      <span aria-hidden="true">{node.mark}</span>
      <span>{node.label}</span>
    </>
  );

  if (node.href) {
    return (
      <Link
        href={node.href}
        className={className}
        aria-label={
          node.detail ? `${node.label}. ${node.detail}` : `${node.label}, open ${node.href}`
        }
      >
        {body}
      </Link>
    );
  }

  return (
    <span className={className} title={node.detail}>
      {body}
    </span>
  );
};

const RailTick = ({ stroke }: { stroke: string }) => (
  <svg aria-hidden="true" viewBox="0 0 22 6" className="h-1.5 w-5 shrink-0">
    <line
      x1="0"
      y1="3"
      x2="22"
      y2="3"
      stroke={stroke}
      strokeWidth="1.2"
      strokeDasharray="3 4"
      className="animate-dash"
      opacity="0.7"
    />
  </svg>
);

const JoinPlate = ({ nodes }: { nodes: readonly LineageNode[] }) => (
  <div className="border-violet/35 mt-8 border-t pt-5">
    <p className="text-violet font-mono text-nano uppercase">Three-graph join</p>
    <p className="text-text-soft mt-2 max-w-[36rem] text-[13.5px] leading-relaxed">
      The rails stay independent until they couple. Agent A-184 did not author M-94012 — it
      contributed knowledge into that family. Colour is not the join; the spine is.
    </p>

    <ol className="relative mt-5 max-w-[20rem] pl-6">
      <svg
        aria-hidden="true"
        viewBox="0 0 8 120"
        preserveAspectRatio="none"
        className="absolute top-1 bottom-1 left-0 w-2"
      >
        <line
          x1="4"
          y1="0"
          x2="4"
          y2="120"
          stroke="var(--color-violet)"
          strokeWidth="1.4"
          strokeDasharray="4 5"
          className="animate-dash"
          opacity="0.8"
        />
      </svg>
      {nodes.map((node) => (
        <li key={node.id} className="py-2 first:pt-0 last:pb-0">
          <p className="text-text flex items-center gap-2 font-mono text-micro uppercase">
            <span aria-hidden="true" className="text-violet">
              {node.mark}
            </span>
            {node.label}
          </p>
          {node.detail && <p className="text-muted mt-1 text-[13px] leading-snug">{node.detail}</p>}
        </li>
      ))}
    </ol>
  </div>
);
