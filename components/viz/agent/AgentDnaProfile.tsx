import Link from 'next/link';
import { cn } from '@/lib/cn';
import { agentA184, demoAccession } from '@/data/demo';

/**
 * Provenance readout for Agent A-184. Not a social profile.
 */

const formatCount = (value: number) => value.toLocaleString('en-GB');

export function AgentDnaProfile({ className }: { className?: string }) {
  const agent = agentA184;

  return (
    <article className={cn('font-ui', className)}>
      <p className="text-muted font-mono text-nano uppercase">{agent.meta.label}</p>
      <h3 className="mt-2 text-[18px] leading-tight font-semibold tracking-tight">
        Agent {demoAccession(agent.id)}
      </h3>
      <p className="text-text-soft mt-2 text-[14px] leading-relaxed">
        {agent.provider} · {agent.role}. Provenance of what this runtime authored and inherited —
        not a biography.
      </p>

      <p className="border-violet/40 text-violet mt-4 inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 font-mono text-nano uppercase">
        <span aria-hidden="true">◆</span>
        Agent DNA
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
        <Datum label="Projects" value={formatCount(agent.projects)} />
        <Datum label="Genes created" value={formatCount(agent.genesCreated)} />
        <Datum label="Mutations" value={formatCount(agent.mutations)} />
        <Datum label="Verified" value={formatCount(agent.verified)} />
        <Datum label="Rejected" value={formatCount(agent.rejected)} />
        <Datum label="Quarantined" value={formatCount(agent.quarantined)} />
        <Datum label="Knowledge inherited" value={formatCount(agent.knowledgeInherited)} />
        <Datum label="Knowledge contributed" value={formatCount(agent.knowledgeContributed)} />
      </dl>

      <p className="text-muted mt-6 font-mono text-nano uppercase">This demo follows</p>
      <ul className="mt-2 space-y-1.5">
        <li>
          <Link
            href="#codetree"
            className="text-text-soft hover:text-text text-[13.5px] underline decoration-dotted"
          >
            AXIS Agent Build
          </Link>
          <span className="text-muted"> · project among 142</span>
        </li>
        <li>
          <Link
            href="#genes"
            className="text-text-soft hover:text-text text-[13.5px] underline decoration-dotted"
          >
            G-INTERFACE-008
          </Link>
          <span className="text-muted"> · authored surface</span>
        </li>
        <li>
          <Link
            href="#mutation"
            className="text-text-soft hover:text-text text-[13.5px] underline decoration-dotted"
          >
            M-94012
          </Link>
          <span className="text-muted"> · knowledge contributed, authored by A-918</span>
        </li>
      </ul>
    </article>
  );
}

const Datum = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-muted font-mono text-nano uppercase">{label}</dt>
    <dd className="text-text mt-0.5 text-[13.5px] tracking-tight">{value}</dd>
  </div>
);
