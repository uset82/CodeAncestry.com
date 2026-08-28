'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import {
  RELATION_GLOSS,
  type PedigreeLink,
  type ProvenanceRecord,
  type ProvKind,
  type ProvNode,
} from '@/lib/registry/provenance';

/**
 * Provenance as the existing standards would draw it.
 *
 * Four panes, one record: the SLSA claim with the honest ceiling, the in-toto
 * statements reconstructed from attestations, the CycloneDX pedigree, and the
 * W3C PROV triples. The genetic vocabulary on the rest of the site is a reading
 * of this graph, not a replacement for it.
 */

const TABS = [
  { id: 'slsa', label: 'SLSA' },
  { id: 'statements', label: 'in-toto' },
  { id: 'pedigree', label: 'CycloneDX' },
  { id: 'prov', label: 'W3C PROV' },
] as const;

type Tab = (typeof TABS)[number]['id'];

const KIND_TONE: Record<ProvKind, string> = {
  entity: 'text-cyan border-cyan/40',
  activity: 'text-violet border-violet/40',
  agent: 'text-amber border-amber/40',
};

const ROLE_TONE: Record<PedigreeLink['role'], string> = {
  ancestor: 'text-cyan',
  descendant: 'text-acid',
  variant: 'text-violet',
  commit: 'text-muted',
  patch: 'text-amber',
};

export function ProvenanceViewer({ record }: { record: ProvenanceRecord }) {
  const [tab, setTab] = useState<Tab>('slsa');

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <p className="text-muted max-w-[74ch] text-[13.5px] leading-relaxed">
          Signatures are not re-checked in this browser. <em>Verified</em> means the seed data says
          the signature checked at ingest.
        </p>
        <div role="tablist" aria-label="Provenance standard" className="flex flex-wrap gap-1.5">
          {TABS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={tab === option.id}
              onClick={() => setTab(option.id)}
              className={cn(
                'rounded border px-2.5 py-1 font-mono text-nano uppercase transition-colors',
                tab === option.id
                  ? 'border-cyan/50 bg-cyan/10 text-cyan'
                  : 'border-line text-muted hover:border-line-strong hover:text-text-soft',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className="mt-5">
        {tab === 'slsa' && <SlsaPane record={record} />}
        {tab === 'statements' && <StatementsPane record={record} />}
        {tab === 'pedigree' && <PedigreePane record={record} />}
        {tab === 'prov' && <ProvPane record={record} />}
      </div>
    </div>
  );
}

function SlsaPane({ record }: { record: ProvenanceRecord }) {
  const slsa = record.slsa;
  const slsaStatements = record.statements.filter(
    (entry) =>
      entry.type === 'slsa-provenance' || entry.type === 'github-artifact-attestation',
  );

  return (
    <div className="border-line bg-panel rounded-lg border p-4 md:p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-[18px] font-semibold tracking-tight">{slsa.label}</p>
        <span className="text-faint font-mono text-nano uppercase">inferred from attestations</span>
      </div>

      <ol className="mt-4 flex flex-wrap gap-2" aria-label="SLSA Build levels">
        {([0, 1, 2] as const).map((level) => {
          const current = slsa.level === level;
          const passed = slsa.level > level && level > 0;
          return (
            <li
              key={level}
              className={cn(
                'rounded-sm border px-2.5 py-1 font-mono text-nano uppercase',
                current
                  ? 'border-acid/50 bg-acid/10 text-acid'
                  : passed
                    ? 'border-acid/30 text-acid'
                    : 'border-line text-faint',
              )}
            >
              {level === 0 ? 'None' : `L${level}`}
              {current && <span className="sr-only"> — current claim</span>}
              {passed && <span className="sr-only"> — reached</span>}
              {!current && !passed && slsa.level < level && (
                <span className="sr-only"> — not claimed</span>
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-text-soft mt-4 max-w-[78ch] text-[13.5px] leading-relaxed">{slsa.basis}</p>
      <p className="text-muted mt-3 max-w-[78ch] text-[13.5px] leading-relaxed">
        Next rung: {slsa.next}
      </p>

      {slsaStatements.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {slsaStatements.map((entry) => (
            <li
              key={`${entry.type}:${entry.subjectDigest}`}
              className="border-line bg-void rounded-md border px-3 py-2"
            >
              <p className="text-text-soft font-mono text-[12.5px]">{entry.typeLabel}</p>
              <p className="text-faint mt-1 font-mono text-nano break-all">
                {entry.issuer} · {entry.issuedAt} ·{' '}
                {entry.verified ? 'verified at ingest' : 'unverified'}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-faint mt-5 text-[13px]">No SLSA provenance on this record.</p>
      )}
    </div>
  );
}

function StatementsPane({ record }: { record: ProvenanceRecord }) {
  if (record.statements.length === 0) {
    return (
      <p className="text-faint border-line bg-panel rounded-lg border p-4 text-[13.5px] leading-relaxed">
        No attestations on this record, so there is no in-toto statement to reconstruct.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {record.statements.map((entry) => (
        <article
          key={`${entry.type}:${entry.subjectDigest}`}
          className="border-line bg-panel overflow-hidden rounded-lg border"
        >
          <header className="border-line bg-panel-2/60 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-2.5">
            <p className="text-text-soft text-[13.5px] font-semibold">{entry.typeLabel}</p>
            <span
              className={
                entry.verified
                  ? 'text-acid font-mono text-nano uppercase'
                  : 'text-amber font-mono text-nano uppercase'
              }
            >
              {entry.verified ? 'verified at ingest' : 'unverified'}
            </span>
          </header>
          <dl className="grid gap-x-8 gap-y-2 px-4 py-3 sm:grid-cols-2">
            <Field label="Predicate" value={entry.predicateType} />
            <Field label="Subject" value={`${entry.subjectName} · ${entry.subjectDigest}`} />
            <Field label="Issuer" value={entry.issuer} />
            <Field label="Issued" value={entry.issuedAt} />
          </dl>
          <pre className="border-line bg-void text-text-soft overflow-x-auto border-t p-4 font-mono text-[11.5px] leading-relaxed">
            {JSON.stringify(entry.statement, null, 2)}
          </pre>
        </article>
      ))}
    </div>
  );
}

function PedigreePane({ record }: { record: ProvenanceRecord }) {
  const groups: { role: PedigreeLink['role']; label: string }[] = [
    { role: 'ancestor', label: 'Ancestors' },
    { role: 'descendant', label: 'Descendants' },
    { role: 'variant', label: 'Variants' },
    { role: 'commit', label: 'Commits' },
    { role: 'patch', label: 'Patches' },
  ];

  return (
    <div className="border-line bg-panel rounded-lg border">
      <p className="text-muted border-line border-b px-4 py-3 text-[13px] leading-relaxed">
        CycloneDX already models ancestors, descendants, variants, commits and patches. This is that
        pedigree, read from the genome rather than from a second SBOM we invented.
      </p>
      <div className="divide-line divide-y">
        {groups.map((group) => {
          const links = record.pedigree.filter((link) => link.role === group.role);
          return (
            <div key={group.role} className="px-4 py-3">
              <p className={cn('font-mono text-nano uppercase', ROLE_TONE[group.role])}>
                {group.label}
                <span className="text-faint ml-2">{links.length}</span>
              </p>
              {links.length === 0 ? (
                <p className="text-faint mt-1.5 text-[13px]">None on record.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {links.map((link) => (
                    <li key={`${link.role}:${link.accession}`}>
                      {link.href ? (
                        <Link
                          href={link.href}
                          className="text-text-soft hover:text-acid text-[13.5px] font-medium transition-colors"
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <span className="text-text-soft font-mono text-[13px]">{link.name}</span>
                      )}
                      <p className="text-faint font-mono text-nano">{link.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProvPane({ record }: { record: ProvenanceRecord }) {
  const byId = new Map(record.nodes.map((entry) => [entry.id, entry]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Legend kind="entity" label={`Entity · ${record.counts.entities}`} />
        <Legend kind="activity" label={`Activity · ${record.counts.activities}`} />
        <Legend kind="agent" label={`Agent · ${record.counts.agents}`} />
      </div>

      <div className="border-line bg-panel overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">
            W3C PROV triples for {record.subject.name}. Each row is one relation between two nodes.
          </caption>
          <thead>
            <tr className="border-line bg-panel-2/70 border-b">
              {['Subject', 'Relation', 'Object', 'Reading'].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="text-faint px-3 py-2 font-mono text-nano uppercase"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {record.triples.map((row, index) => (
              <tr
                key={`${row.subject}:${row.relation}:${row.object}:${index}`}
                className="border-line/60 border-b last:border-0"
              >
                <td className="px-3 py-2 align-top">
                  <NodeRef node={byId.get(row.subject) ?? null} fallback={row.subject} />
                </td>
                <td className="text-violet px-3 py-2 align-top font-mono text-[12px]">
                  {row.relation}
                  <span className="sr-only"> ({RELATION_GLOSS[row.relation]})</span>
                </td>
                <td className="px-3 py-2 align-top">
                  <NodeRef node={byId.get(row.object) ?? null} fallback={row.object} />
                </td>
                <td className="text-muted px-3 py-2 align-top text-[13px] leading-relaxed">
                  {row.gloss}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {record.triples.length === 0 && (
        <p className="text-faint text-[13px]">No PROV relations could be reconstructed.</p>
      )}
    </div>
  );
}

function Legend({ kind, label }: { kind: ProvKind; label: string }) {
  return (
    <span
      className={cn(
        'rounded-sm border px-1.5 py-[2px] font-mono text-nano uppercase',
        KIND_TONE[kind],
      )}
    >
      {label}
    </span>
  );
}

function NodeRef({ node, fallback }: { node: ProvNode | null; fallback: string }) {
  if (!node) {
    return <span className="text-faint font-mono text-[12px]">{fallback}</span>;
  }

  const inner = (
    <>
      <span className="text-text-soft text-[13px] font-medium">{node.label}</span>
      <span
        className={cn(
          'ml-1.5 font-mono text-nano uppercase',
          node.kind === 'entity' ? 'text-cyan' : node.kind === 'activity' ? 'text-violet' : 'text-amber',
        )}
      >
        {node.kind}
      </span>
    </>
  );

  return node.href ? (
    <Link href={node.href} className="hover:text-acid transition-colors">
      {inner}
    </Link>
  ) : (
    <span>{inner}</span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-faint font-mono text-nano uppercase">{label}</dt>
      <dd className="text-text-soft mt-0.5 font-mono text-[12px] break-all">{value}</dd>
    </div>
  );
}
