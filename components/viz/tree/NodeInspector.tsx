'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { FamilyTree, TreeNode } from '@/lib/registry/tree';
import { INHERITANCE_META } from '@/lib/schema/vocabulary';
import { StateBadge } from '@/components/ui/StateBadge';

/**
 * The node inspector.
 *
 * Whatever layout is on screen, selecting a project answers the same questions:
 * what generation is it, what is it made of, who are its parents, what do its
 * agents remember, and where do I go to read the genome itself.
 */
export function NodeInspector({
  family,
  node,
  onSelect,
  className,
}: {
  family: FamilyTree;
  node: TreeNode | null;
  onSelect: (accession: string | null) => void;
  className?: string;
}) {
  if (!node) return <InspectorEmpty family={family} className={className} />;

  const byId = new Map(family.nodes.map((entry) => [entry.accession, entry]));
  const parents = node.parents.flatMap((parent) => {
    const record = byId.get(parent.genome);
    return record ? [{ ...parent, record }] : [];
  });
  const children = node.children.flatMap((id) => {
    const record = byId.get(id);
    return record ? [record] : [];
  });

  const lateral = family.edges.filter(
    (edge) =>
      (edge.upstream || edge.type === 'TRANSFERRED_FROM') &&
      (edge.from === node.accession || edge.to === node.accession),
  );

  return (
    <div className={cn('border-line bg-panel/50 rounded-xl border p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-faint font-mono text-nano uppercase">
            Generation {node.generation} · {node.visibility}
          </p>
          <h3 className="mt-1.5 text-[19px] leading-tight font-semibold tracking-[-0.03em]">
            {node.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-label="Close inspector"
          className="text-faint hover:text-text font-mono text-[13px]"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <p className="text-muted mt-2.5 text-[13.5px] leading-relaxed">{node.tagline}</p>

      <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        <Field label="Genes" value={node.geneCount} />
        <Field label="Authored" value={node.mutationsAuthored} />
        <Field label="Adopted" value={node.mutationsAdopted} />
        {node.openProposals > 0 && (
          <Field label="Open offers" value={node.openProposals} tone="text-amber" />
        )}
      </dl>

      <div className="mt-5">
        <p className="text-muted font-mono text-nano uppercase">Composition</p>
        <div className="border-line bg-panel-2 mt-2 flex h-6 overflow-hidden rounded-sm border">
          {node.composition.map((segment) => (
            <span
              key={segment.mode}
              style={{ flexBasis: `${segment.share * 100}%` }}
              className={cn('shrink grow-0', INHERITANCE_META[segment.mode].swatch)}
              title={`${INHERITANCE_META[segment.mode].label}: ${Math.round(segment.share * 100)}%`}
            />
          ))}
        </div>
        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
          {node.composition.map((segment) => (
            <li key={segment.mode} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn('size-2 rounded-[2px]', INHERITANCE_META[segment.mode].swatch)}
              />
              <span className="text-text-soft text-[12.5px]">
                {INHERITANCE_META[segment.mode].label}
              </span>
              <span className="text-faint font-mono text-nano tabular-nums">
                {segment.count} · {Math.round(segment.share * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-line/60 mt-5 border-t pt-4">
        <p className="text-muted font-mono text-nano uppercase">Lineage assurance</p>
        <div className="mt-2">
          <StateBadge state={node.lineageAssurance} />
        </div>
      </div>

      {parents.length > 0 && (
        <Relations title={parents.length > 1 ? 'Parents (hybrid)' : 'Parent'}>
          {parents.map((parent) => (
            <RelationRow
              key={parent.genome}
              label={parent.record.name}
              detail={`${parent.relationship} · ${Math.round(parent.contribution * 100)}% contribution`}
              onClick={() => onSelect(parent.genome)}
            />
          ))}
        </Relations>
      )}

      {children.length > 0 && (
        <Relations title={`Descendants (${children.length})`}>
          {children.map((child) => (
            <RelationRow
              key={child.accession}
              label={child.name}
              detail={`Generation ${child.generation} · ${child.geneCount} genes`}
              onClick={() => onSelect(child.accession)}
            />
          ))}
        </Relations>
      )}

      {lateral.length > 0 && (
        <Relations title="Beyond descent">
          {lateral.map((edge) => {
            const other = edge.from === node.accession ? byId.get(edge.to) : byId.get(edge.from);
            const outbound = edge.from === node.accession;
            return (
              <RelationRow
                key={edge.id}
                label={`${outbound ? '→' : '←'} ${other?.name ?? 'unknown'}`}
                detail={`${edge.label} · confidence ${edge.confidence.toFixed(2)}`}
                tone={edge.tone}
                onClick={() => other && onSelect(other.accession)}
              />
            );
          })}
        </Relations>
      )}

      {node.agents.length > 0 && (
        <div className="border-line/60 mt-5 border-t pt-4">
          <p className="text-muted font-mono text-nano uppercase">Agent memory</p>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {node.agents.map((agent) => (
              <li key={agent.accession}>
                <Link
                  href={`/agent/${agent.accession}`}
                  className="hover:text-acid text-[13.5px] font-semibold transition-colors"
                >
                  {agent.name}
                </Link>
                <p className="text-faint mt-0.5 font-mono text-nano uppercase">
                  {agent.provider} · gen {agent.generation}
                </p>
                <p className="text-muted mt-1 text-[12.5px]">
                  Remembers {agent.memory.summaries} lineage summaries, {agent.memory.accepted}{' '}
                  accepted and {agent.memory.rejected} rejected mutations. Authored {agent.authored}.
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-line/60 mt-5 flex flex-col gap-2 border-t pt-4">
        <Link
          href={`/project/${node.accession}`}
          className="border-acid/40 bg-acid/10 text-acid hover:bg-acid/15 rounded-md border px-3 py-2 text-center font-mono text-nano uppercase transition-colors"
        >
          Open genome browser
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/compare?a=${family.root}&b=${node.accession}`}
            className="border-line bg-panel-2 hover:border-line-strong flex-1 rounded-md border px-3 py-2 text-center font-mono text-nano uppercase transition-colors"
          >
            Compare to root
          </Link>
          <a
            href={`https://${node.repository.replace('github:', 'github.com/')}`}
            rel="noreferrer noopener"
            target="_blank"
            className="border-line bg-panel-2 hover:border-line-strong flex-1 rounded-md border px-3 py-2 text-center font-mono text-nano uppercase transition-colors"
          >
            Repository
          </a>
        </div>
        <p className="text-faint text-center font-mono text-nano">
          commit:{node.commit.slice(0, 10)}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function InspectorEmpty({ family, className }: { family: FamilyTree; className?: string }) {
  return (
    <div className={cn('border-line-strong rounded-xl border border-dashed p-5', className)}>
      <p className="text-muted font-mono text-nano uppercase">Node inspector</p>
      <p className="mt-3 text-[15px] leading-snug font-semibold tracking-[-0.02em]">
        Select a project to read what it inherited.
      </p>
      <p className="text-muted mt-3 text-[13.5px] leading-relaxed">
        Click a node in any layout, or move through the nested list with the arrow keys. The
        inspector reports the same facts whichever view found it.
      </p>

      <dl className="border-line/60 mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4">
        {[
          ['Projects', family.stats.projects],
          ['Generations', family.generations],
          ['Capabilities', family.stats.genes],
          ['Mutations', family.stats.mutations],
          ['Hybrids', family.stats.hybrids],
          ['Lateral transfers', family.stats.transfers],
        ].map(([label, value]) => (
          <div key={label as string}>
            <dt className="text-faint font-mono text-nano uppercase">{label}</dt>
            <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Field({
  label,
  value,
  tone = 'text-text',
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div>
      <dt className="text-faint font-mono text-nano uppercase">{label}</dt>
      <dd className={cn('mt-0.5 text-[16px] font-semibold tabular-nums', tone)}>{value}</dd>
    </div>
  );
}

function Relations({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-line/60 mt-5 border-t pt-4">
      <p className="text-muted font-mono text-nano uppercase">{title}</p>
      <ul className="mt-2 flex flex-col gap-1">{children}</ul>
    </div>
  );
}

function RelationRow({
  label,
  detail,
  tone,
  onClick,
}: {
  label: string;
  detail: string;
  tone?: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="hover:bg-panel-2 -mx-1.5 w-full rounded-sm px-1.5 py-1.5 text-left transition-colors"
      >
        <span className={cn('block text-[13.5px] font-medium', tone)}>{label}</span>
        <span className="text-faint block text-[12px]">{detail}</span>
      </button>
    </li>
  );
}
