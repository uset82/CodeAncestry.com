'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { ORIGIN_NODES, keylitOrigin, originChildren } from '@/data/demo/origin';
import { useRadioGroup } from '@/lib/hooks/useRadioGroup';

/**
 * Small historical tree. Beat 11 zooms the helix out; this plate is that
 * first family in type. Marks encode generation (● / ○ / ◇). Quechua has
 * no href — it was asked, not seeded.
 */

const MARK = ['●', '○', '◇'] as const;

export function KeylitOrigin({ className }: { className?: string }) {
  const [selected, setSelected] = useState(0);
  const handleSelect = (index: number) => {
    setSelected(index);
  };
  const radio = useRadioGroup({
    count: ORIGIN_NODES.length,
    index: selected,
    onSelect: handleSelect,
    orientation: 'vertical',
  });

  const locus = ORIGIN_NODES[selected] ?? ORIGIN_NODES[0];

  return (
    <article className={cn('font-ui', className)}>
      <p className="text-muted font-mono text-nano uppercase">
        {keylitOrigin.meta.label} · first family
      </p>
      <h3 className="mt-2 text-[18px] leading-tight font-semibold tracking-tight">KEYLIT</h3>
      <p className="text-text-soft mt-2 text-[14px] leading-relaxed">
        The specimen on the right pulls back. Those strands began as this family. AXIS was the
        product demo. This is the origin sketch — not the full seeded graph.
      </p>

      <p className="text-muted mt-8 font-mono text-nano uppercase">Origin tree</p>
      <div className="relative mt-3 pl-6">
        <svg
          aria-hidden="true"
          viewBox="0 0 8 220"
          preserveAspectRatio="none"
          className="absolute top-1 bottom-1 left-0 w-2"
        >
          <line
            x1="4"
            y1="0"
            x2="4"
            y2="220"
            stroke="var(--color-cyan)"
            strokeWidth="1.3"
            strokeDasharray="4 5"
            className="animate-dash"
            opacity="0.55"
          />
        </svg>
        <div {...radio.groupProps} aria-label="KEYLIT origin lineage">
          <OriginBranch parent={null} depth={0} selected={selected} radio={radio} />
        </div>
      </div>

      {locus && (
        <div aria-live="polite" className="border-line mt-5 border-t pt-4">
          <p className="text-cyan font-mono text-micro uppercase">
            <span aria-hidden="true">{MARK[Math.min(locus.generation, MARK.length - 1)]} </span>
            {locus.name}
            <span className="text-muted"> · gen {locus.generation}</span>
          </p>
          <p className="text-text-soft mt-2 text-[13.5px] leading-relaxed">{locus.role}</p>
          {locus.href ? (
            <Link
              href={locus.href}
              className="text-text-soft hover:text-text mt-2 inline-block text-[13.5px] underline decoration-dotted"
            >
              Open the seeded record
            </Link>
          ) : (
            <p className="text-muted mt-2 font-mono text-nano uppercase">Not seeded</p>
          )}
        </div>
      )}
    </article>
  );
}

const OriginBranch = ({
  parent,
  depth,
  selected,
  radio,
}: {
  parent: string | null;
  depth: number;
  selected: number;
  radio: ReturnType<typeof useRadioGroup>;
}) => (
  <div className={depth > 0 ? 'ml-4 border-l border-line/70 pl-3' : undefined}>
    {originChildren(parent).map((node) => {
      const index = ORIGIN_NODES.findIndex((entry) => entry.id === node.id);
      const active = index === selected;
      const mark = MARK[Math.min(node.generation, MARK.length - 1)];
      return (
        <div key={node.id}>
          <button
            {...radio.radioProps(index)}
            aria-label={`${node.name}, generation ${node.generation}${node.seeded ? '' : ', not seeded'}`}
            className={cn(
              'mb-1 flex w-full items-center gap-3 rounded-xs px-2 py-2 text-left',
              active ? 'bg-void' : 'hover:bg-hover',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-xs border font-mono text-[10px]',
                active
                  ? node.seeded
                    ? 'border-cyan/45 text-cyan'
                    : 'border-line text-muted'
                  : 'border-line text-muted',
              )}
            >
              {active ? '◆' : mark}
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-text block font-mono text-nano uppercase">{node.name}</span>
              <span className="text-muted block text-[12.5px]">
                gen {node.generation}
                {node.seeded ? '' : ' · not seeded'}
              </span>
            </span>
          </button>
          <OriginBranch parent={node.id} depth={depth + 1} selected={selected} radio={radio} />
        </div>
      );
    })}
  </div>
);
