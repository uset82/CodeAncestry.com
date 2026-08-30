import { cn } from '@/lib/cn';
import { demoAccession, type DemoGene } from '@/data/demo';

/**
 * Instrumentation readout for one homepage demo gene. Not a feature card.
 * Colour is paired with a mark so status survives greyscale.
 */

const STATUS_MARK = {
  VERIFIED: { mark: '✓', tone: 'text-acid border-acid/40' },
  Investigate: { mark: '!', tone: 'text-amber border-amber/45' },
} as const;

export function DemoGeneInspector({
  gene,
  className,
}: {
  gene: DemoGene;
  className?: string;
}) {
  const status = STATUS_MARK[gene.status];
  const health = `${(gene.health * 100).toFixed(1)}%`;

  return (
    <article className={cn('font-ui', className)}>
      <p className="text-muted font-mono text-nano uppercase">{gene.meta.label}</p>
      <p className="text-cyan mt-2 font-mono text-micro">{demoAccession(gene.id)}</p>
      <h3 className="mt-1 text-[18px] leading-tight font-semibold tracking-tight">{gene.name}</h3>
      <p className="text-text-soft mt-2 text-[14px] leading-relaxed">{gene.purpose}</p>

      <p
        className={cn(
          'mt-4 inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 font-mono text-nano uppercase',
          status.tone,
        )}
      >
        <span aria-hidden="true">{status.mark}</span>
        {gene.status}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        <Datum label="Origin" value={gene.origin} />
        <Datum label="Born" value={`generation ${gene.bornGeneration}`} />
        <Datum label="Current" value={`generation ${gene.currentGeneration}`} />
        <Datum label="Mutations" value={formatCount(gene.mutations)} />
        <Datum label="Dependencies" value={formatCount(gene.dependencies)} />
        <Datum label="Descendants" value={formatCount(gene.descendants)} />
        <Datum label="Health" value={health} />
        <Datum label="Capability" value={gene.capability} />
      </dl>
    </article>
  );
}

const Datum = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-muted font-mono text-nano uppercase">{label}</dt>
    <dd className="text-text mt-0.5 text-[13.5px] tracking-tight">{value}</dd>
  </div>
);

const formatCount = (value: number) => value.toLocaleString('en-GB');
