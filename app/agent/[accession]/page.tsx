import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TelemetryControl } from '@/components/registry/TelemetryControl';
import { StatRail } from '@/components/ui/Panel';
import { cn } from '@/lib/cn';
import { getAgentRecord } from '@/lib/registry/agent';

/**
 * The Agent DNA record.
 *
 * Read in the order a reviewer would ask: who says this agent is what it claims
 * to be, what is it allowed to do, what did it actually produce that we can
 * point at, what does it remember, and what is deliberately absent. The last
 * section is not a footnote — the boundary is the reason the rest is publishable.
 */

/* Not prerendered — an accession contains a colon, which cannot be a filename
   on Windows. See the note in app/project/[accession]/page.tsx. */

const TONE: Record<'weak' | 'medium' | 'strong', string> = {
  weak: 'text-amber',
  medium: 'text-cyan',
  strong: 'text-acid',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ accession: string }>;
}): Promise<Metadata> {
  const { accession } = await params;
  const record = getAgentRecord(decodeURIComponent(accession));
  if (!record) return { title: 'Agent not found' };

  return {
    title: `${record.displayName} — ${record.accession}`,
    description: `Agent DNA ${record.accession}: ${record.identity.providerLabel}, ${record.identity.verificationLabel.toLowerCase()} identity, ${record.capabilities.length} capabilities, ${record.authored.length} mutations authored. No model weights and no private reasoning are recorded.`,
  };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ accession: string }>;
}) {
  const { accession } = await params;
  const record = getAgentRecord(decodeURIComponent(accession));
  if (!record) notFound();

  const writers = record.capabilities.filter((capability) => capability.writes);
  const permissive = record.policies.filter((policy) => policy.permissive);
  const adopted = record.authored.filter((entry) => entry.outcome === 'adopted').length;

  return (
    <div className="shell py-10 md:py-14">
      {/* ============================================================== identity */}
      <header>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-violet font-mono text-micro uppercase">Agent DNA</p>
          <p className="text-faint font-mono text-micro">{record.accession}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="text-headline text-balance">{record.displayName}</h1>
          <span
            className={cn(
              'border-line bg-panel-2 rounded-sm border px-2 py-[3px] font-mono text-nano uppercase',
              TONE[record.identity.verificationTone],
            )}
          >
            {record.identity.verificationLabel} identity
          </span>
        </div>

        <p className="text-text-soft mt-4 max-w-[74ch] leading-relaxed">
          Provider-reported as {record.identity.providerLabel}
          {record.identity.providerAgentId && (
            <>
              {' '}
              (<span className="font-mono text-[13px]">{record.identity.providerAgentId}</span>)
            </>
          )}
          , working on{' '}
          {record.genome ? (
            <Link
              href={`/project/${record.genome.accession}`}
              className="text-acid hover:text-acid/80 transition-colors"
            >
              {record.genome.name}
            </Link>
          ) : (
            record.project
          )}
          . The provider label is a claim we pass through, not a measurement: CodeAncestry can verify
          a signature and a digest, and it cannot inspect a model.
        </p>
      </header>

      <StatRail
        className="mt-9"
        stats={[
          { label: 'Generation', value: record.generation },
          { label: 'Identity', value: record.identity.verificationLabel },
          {
            label: 'Capabilities',
            value: record.capabilities.length,
            hint: `${writers.length} can write`,
          },
          {
            label: 'Mutations authored',
            value: record.authored.length,
            hint: record.authored.length > 0 ? `${adopted} adopted` : 'none yet',
          },
          { label: 'Reliability', value: record.trust.reliability.toFixed(2), hint: 'asserted' },
          { label: 'Telemetry', value: record.telemetry.mode },
        ]}
      />

      {/* ================================================================== trust */}
      <section className="mt-12">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          What can be checked
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          Three of these four are mechanically verifiable: a signature resolves or it does not, and a
          schema field that cannot hold <code className="font-mono text-[13px]">true</code> is a
          guarantee rather than a promise. Reliability is the odd one out, and it is labelled as such.
        </p>

        {/* The container tint shows through the 1px gaps as hairline dividers. */}
        <div className="border-line bg-line mt-5 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
          <TrustCell
            label="Identity"
            value={record.trust.identityVerified ? 'Verified' : 'Unverified'}
            good={record.trust.identityVerified}
            detail={record.identity.verificationDetail}
          />
          <TrustCell
            label="Outputs signed"
            value={record.trust.outputsSigned ? 'Signed' : 'Unsigned'}
            good={record.trust.outputsSigned}
            detail={
              record.identity.signingKey
                ? `Key ${record.identity.signingKey.slice(0, 22)}…`
                : 'No signing key on record.'
            }
          />
          <TrustCell
            label="Private reasoning"
            value="Never stored"
            good
            detail="Forbidden by the schema, not by policy. The field cannot be set to true."
          />
          <TrustCell
            label="Reliability"
            value={record.trust.reliability.toFixed(2)}
            good={record.trust.reliability >= 0.85}
            detail="A score carried on the record. Nothing on this page derives it, so read it as an assertion."
          />
        </div>
      </section>

      {/* =========================================================== capabilities */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          Granted capabilities
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          Permissions rather than skills: what the agent may do to a genome, not how good it is at
          doing it. Only two capabilities in the vocabulary can change anything, and this agent holds{' '}
          {writers.length === 0
            ? 'neither of them'
            : writers.map((entry) => entry.label.toLowerCase()).join(' and ')}
          .
        </p>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {record.capabilities.map((capability) => (
            <li
              key={capability.value}
              className="border-line bg-panel-2/40 rounded-md border px-3 py-2.5"
            >
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-text-soft text-[13.5px] font-semibold">
                  {capability.label}
                </span>
                <span
                  className={cn(
                    'font-mono text-nano uppercase',
                    capability.writes ? 'text-amber' : 'text-faint',
                  )}
                >
                  {capability.writes ? 'Writes' : 'Reads'}
                </span>
              </div>
              <p className="text-muted mt-0.5 text-[12.5px] leading-relaxed">{capability.detail}</p>
            </li>
          ))}
        </ul>

        {record.withheld.length > 0 && (
          <p className="text-faint mt-4 max-w-[74ch] text-[13px] leading-relaxed">
            Not granted: {record.withheld.map((entry) => entry.label.toLowerCase()).join(', ')}. An
            absent capability is recorded as absent rather than left ambiguous.
          </p>
        )}
      </section>

      {/* ================================================================ policies */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          The safety envelope
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          Nothing this agent proposes reaches a genome without passing these.{' '}
          {permissive.length === 0
            ? 'Every setting here is the cautious one, so nothing lands without a person and a signature.'
            : `${
                permissive.length === 1 ? 'One row is permissive' : `${permissive.length} rows are permissive`
              }: ${permissive.map((policy) => policy.permissivePhrase).join(', and ')}.`}
        </p>

        <div className="border-line bg-panel mt-5 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <caption className="sr-only">
              Policy settings for {record.displayName}, with the permissive settings marked.
            </caption>
            <thead>
              <tr className="border-line bg-panel-2/70 border-b">
                {['Policy', 'Setting', 'What it governs'].map((heading) => (
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
              {record.policies.map((policy) => (
                <tr key={policy.label} className="border-line/60 border-b last:border-0">
                  <th
                    scope="row"
                    className="text-text-soft px-3 py-2.5 align-top text-[13.5px] font-normal"
                  >
                    {policy.label}
                  </th>
                  <td className="px-3 py-2.5 align-top">
                    <span
                      className={cn(
                        'font-mono text-[12px] uppercase',
                        policy.permissive ? 'text-amber' : 'text-acid',
                      )}
                    >
                      {policy.value ? 'Yes' : 'No'}
                    </span>
                    {policy.permissive && (
                      <span className="text-amber ml-2 font-mono text-nano">permissive</span>
                    )}
                  </td>
                  <td className="text-muted px-3 py-2.5 align-top text-[12.5px] leading-relaxed">
                    {policy.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ------------------------------------------------- relations and tools */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="border-line bg-panel-2/40 rounded-lg border p-4">
            <p className="text-faint font-mono text-nano uppercase">Accepts knowledge from</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {record.trustedRelations.map((relation) => (
                <li
                  key={relation}
                  className="border-acid/40 bg-acid/8 text-acid rounded-sm border px-2 py-[3px] font-mono text-nano"
                >
                  {relation}
                </li>
              ))}
              {record.untrustedRelations.map((relation) => (
                <li
                  key={relation}
                  className="border-line text-faint rounded-sm border px-2 py-[3px] font-mono text-nano"
                >
                  <span className="line-through">{relation}</span>
                  <span className="sr-only"> — refused</span>
                </li>
              ))}
            </ul>
            <p className="text-muted mt-3 text-[12.5px] leading-relaxed">
              Struck-through relations are refused. An agent that trusts nothing learns nothing; one
              that trusts everything propagates everything.
            </p>
          </div>

          <div className="border-line bg-panel-2/40 rounded-lg border p-4">
            <p className="text-faint font-mono text-nano uppercase">
              Interfaces and tools ({record.tools.length})
            </p>
            <p className="text-muted mt-2 font-mono text-[12px]">
              MCP {record.interfaces.mcp ? 'enabled' : 'off'} · agent-to-agent{' '}
              {record.interfaces.a2a ? 'enabled' : 'off'}
            </p>
            <ul className="mt-3 space-y-1.5">
              {record.tools.map((tool) => (
                <li key={tool.uri} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-text-soft font-mono text-[12.5px]">{tool.name}</span>
                  <span
                    className={cn(
                      'font-mono text-nano uppercase',
                      tool.writes ? 'text-amber' : 'text-faint',
                    )}
                  >
                    {tool.scopeLabel}
                  </span>
                  <span className="text-faint block w-full font-mono text-nano">{tool.uri}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* =============================================================== authored */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          Knowledge produced
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          {record.authored.length === 0
            ? 'This agent has authored no mutations. It reads, reviews and tests; it has not proposed a change.'
            : `Every mutation this agent authored, and what the family did with it. Authoring is not merit — ${adopted} of ${record.authored.length} were adopted by at least one genome.`}
        </p>

        {record.authored.length > 0 && (
          <ul className="mt-5 space-y-2">
            {record.authored.map((entry) => (
              <li key={entry.accession}>
                <Link
                  href={`/mutation/${entry.accession}`}
                  className="border-line bg-panel hover:border-line-strong block rounded-md border px-4 py-3 transition-colors"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-violet font-mono text-[12px]">{entry.shortId}</span>
                    <span className="text-text-soft flex-1 text-[14px] font-semibold">
                      {entry.title}
                    </span>
                    <span
                      className={cn(
                        'font-mono text-nano uppercase',
                        entry.outcome === 'adopted'
                          ? 'text-acid'
                          : entry.outcome === 'rejected'
                            ? 'text-rose'
                            : entry.outcome === 'quarantined'
                              ? 'text-amber'
                              : 'text-cyan',
                      )}
                    >
                      {entry.stateLabel}
                    </span>
                  </div>
                  <p className="text-muted mt-1 font-mono text-nano">
                    {entry.geneName} · proposed {entry.proposedAt} · adopted by {entry.adoptedBy},
                    refused by {entry.rejectedBy}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ================================================================= memory */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          Authorized memory
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          Mode: <span className="text-text-soft">{record.memory.modeLabel}</span>.{' '}
          {record.memory.modeDetail} What follows is what the agent chose to write down and, in{' '}
          {record.memory.shared} of {record.memory.artifacts.length} cases, offer to a relative.
        </p>

        <StatRail
          className="mt-5"
          stats={[
            { label: 'Lineage summaries', value: record.memory.lineageSummaries },
            { label: 'Mutations accepted', value: record.memory.acceptedMutations },
            { label: 'Mutations rejected', value: record.memory.rejectedMutations },
            { label: 'Artifacts', value: record.memory.artifacts.length },
          ]}
        />

        <ul className="mt-5 space-y-2">
          {record.memory.artifacts.map((artifact) => (
            <li
              key={artifact.accession}
              className="border-line bg-panel-2/40 rounded-md border px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className="border-line bg-void text-muted rounded-sm border px-1.5 py-[1px] font-mono text-nano"
                  title={artifact.kindLabel}
                >
                  {artifact.kindAbbr}
                </span>
                <span className="text-faint font-mono text-nano">{artifact.accession}</span>
                <span className="text-faint ml-auto font-mono text-nano">
                  {artifact.producedAt}
                  {artifact.signed ? ' · signed' : ' · unsigned'}
                </span>
              </div>
              <p className="text-text-soft mt-1.5 text-[13.5px] leading-relaxed">
                {artifact.summary}
              </p>
              {artifact.offeredTo.length > 0 ? (
                <p className="text-muted mt-1.5 font-mono text-nano">
                  Offered to{' '}
                  {artifact.offeredTo.map((target, index) => (
                    <span key={target.accession}>
                      {index > 0 && ', '}
                      <Link
                        href={`/project/${target.accession}`}
                        className="hover:text-acid transition-colors"
                      >
                        {target.name}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : (
                <p className="text-faint mt-1.5 font-mono text-nano">
                  Kept local — not offered to any relative.
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ============================================================== telemetry */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">
          Telemetry and the boundary
        </h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          How much of this agent&rsquo;s working is observable, chosen by whoever runs it. Each rung
          adds one named category, and three categories sit outside the ladder entirely — no setting
          on it reaches them.
        </p>

        <div className="border-line bg-panel mt-5 rounded-lg border p-4 md:p-5">
          <TelemetryControl telemetry={record.telemetry} />
        </div>
      </section>

      {/* ================================================================ lineage */}
      <section className="mt-14">
        <h2 className="text-[22px] leading-tight font-semibold tracking-tight">Agent lineage</h2>
        <p className="text-muted mt-2 max-w-[74ch] leading-relaxed">
          Agents descend alongside the projects they work on. A child agent starts from its
          parent&rsquo;s authorized memory, not from a blank slate — which is the point, and also the
          reason the memory above is bounded.
        </p>

        <div className="mt-5 flex flex-wrap items-stretch gap-3">
          {record.parent ? (
            <AgentChip
              accession={record.parent.accession}
              name={record.parent.displayName}
              generation={record.parent.generation}
              relation="Parent"
            />
          ) : (
            <div className="border-line bg-panel-2/40 rounded-md border px-3 py-2">
              <p className="text-faint font-mono text-nano uppercase">Parent</p>
              <p className="text-muted mt-0.5 text-[13px]">None — this is a root agent.</p>
            </div>
          )}

          {record.children.map((child) => (
            <AgentChip
              key={child.accession}
              accession={child.accession}
              name={child.displayName}
              generation={child.generation}
              relation="Child"
            />
          ))}
        </div>
      </section>

      <p className="text-faint border-line mt-14 max-w-[80ch] border-t pt-6 text-[13px] leading-relaxed">
        This record describes what an agent did, asserted, tested and shared. It is not a model card,
        it contains no weights and no provider-internal reasoning, and the reliability figure is a
        review outcome rather than a benchmark score.
      </p>
    </div>
  );
}

function TrustCell({
  label,
  value,
  good,
  detail,
}: {
  label: string;
  value: string;
  good: boolean;
  detail: string;
}) {
  return (
    <div className="bg-panel p-4">
      <p className="text-faint font-mono text-nano uppercase">{label}</p>
      <p className={cn('mt-1 text-[15px] font-semibold', good ? 'text-acid' : 'text-amber')}>
        {value}
      </p>
      <p className="text-muted mt-1.5 text-[12.5px] leading-relaxed">{detail}</p>
    </div>
  );
}

function AgentChip({
  accession,
  name,
  generation,
  relation,
}: {
  accession: string;
  name: string;
  generation: number;
  relation: string;
}) {
  return (
    <Link
      href={`/agent/${accession}`}
      className="border-line bg-panel hover:border-line-strong rounded-md border px-3 py-2 transition-colors"
    >
      <p className="text-faint font-mono text-nano uppercase">{relation}</p>
      <p className="text-text-soft mt-0.5 text-[13.5px] font-semibold">{name}</p>
      <p className="text-faint font-mono text-nano">Generation {generation}</p>
    </Link>
  );
}
