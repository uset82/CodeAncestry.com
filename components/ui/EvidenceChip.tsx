import { cn } from '@/lib/cn';
import { EVIDENCE_CODE_META, type EvidenceCode } from '@/lib/schema/vocabulary';

type Props = {
  code: EvidenceCode;
  /** Optional count, e.g. 214 tests behind a single TST chip. */
  count?: number;
  className?: string;
};

export function EvidenceChip({ code, count, className }: Props) {
  const meta = EVIDENCE_CODE_META[code];

  return (
    <span
      className={cn(
        'border-line bg-panel-2 inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-[3px] font-mono text-nano',
        className,
      )}
      title={`${meta.label} — ${meta.description}`}
    >
      <span aria-hidden="true" className={meta.tone}>
        {meta.glyph}
      </span>
      <span className="text-text-soft">{meta.code}</span>
      {count !== undefined && <span className="text-muted tabular-nums">{count}</span>}
      <span className="sr-only">
        {meta.label}. {meta.description}
      </span>
    </span>
  );
}

export function EvidenceChipRow({
  codes,
  counts,
  className,
}: {
  codes: readonly EvidenceCode[];
  counts?: Partial<Record<EvidenceCode, number>>;
  className?: string;
}) {
  if (codes.length === 0) {
    return <span className="text-faint font-mono text-nano uppercase">No evidence recorded</span>;
  }

  return (
    <span className={cn('flex flex-wrap items-center gap-1', className)}>
      {codes.map((code) => (
        <EvidenceChip key={code} code={code} count={counts?.[code]} />
      ))}
    </span>
  );
}
