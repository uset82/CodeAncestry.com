import type { Metadata } from 'next';
import { DocsArticle } from '@/components/docs/DocsShell';
import { Mermaid } from '@/components/docs/Mermaid';
import { SpecTable } from '@/components/docs/SpecTable';
import { StateBadge } from '@/components/ui/StateBadge';
import { CodeBlock, DocSection } from '@/components/registry/RegistryShell';
import { MUTATION_STATE_DIAGRAM, PROPAGATION_DIAGRAM } from '@/lib/docs/diagrams';
import { PROPAGATION_PROTOCOL, TRUST_LADDER } from '@/lib/schema/mutation';
import {
  MUTATION_HAPPY_PATH,
  MUTATION_STATE_META,
  MUTATION_STATES,
} from '@/lib/schema/vocabulary';
import { pageMeta } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMeta({
  title: 'Mutation protocol',
  description:
    'The mutation state machine, the seven-step propagation protocol, and the trust ladder.',
  path: '/docs/mutations',
});

export default function MutationsPage() {
  return (
    <DocsArticle
      eyebrow="Documentation · Protocol"
      title="Mutation protocol"
      lede="A mutation never spreads because a related agent recommends it. It walks a state machine, and a human or an explicit policy makes the final call."
    >
      <DocSection heading="State machine">
        <p>
          {MUTATION_STATES.length} states. Rejected and quarantined are terminal. Adopted is
          terminal on the receiving genome. The linear happy path used by progress rails is{' '}
          {MUTATION_HAPPY_PATH.length} steps long.
        </p>
        <Mermaid
          chart={MUTATION_STATE_DIAGRAM}
          caption="Mutation lifecycle. Rejected and quarantined end the walk; adopted is the only successful terminal."
        />
        <SpecTable
          caption="Mutation states, the lineage state they render as, and whether they are terminal"
          columns={[
            { key: 'state', label: 'State', mono: true },
            { key: 'label', label: 'Label' },
            { key: 'lineage', label: 'Renders as' },
            { key: 'terminal', label: 'Terminal' },
          ]}
          rows={MUTATION_STATES.map((state) => {
            const meta = MUTATION_STATE_META[state];
            return {
              state,
              label: meta.label,
              lineage: <StateBadge state={meta.lineageState} />,
              terminal: meta.terminal ? 'Yes' : 'No',
            };
          })}
        />
      </DocSection>

      <DocSection heading="Propagation protocol">
        <p>
          Seven steps. A mutation never skips one. Discover is not describe; attest is not
          sandbox; evaluate is not decide.
        </p>
        <Mermaid
          chart={PROPAGATION_DIAGRAM}
          caption="The seven-step propagation protocol. Decide is the only step that can adopt, reject or quarantine."
        />
        <SpecTable
          caption="Propagation protocol steps"
          columns={[
            { key: 'step', label: 'Step' },
            { key: 'detail', label: 'What happens' },
          ]}
          rows={PROPAGATION_PROTOCOL.map((item) => ({
            step: item.step,
            detail: item.detail,
          }))}
        />
        <CodeBlock>
          {PROPAGATION_PROTOCOL.map((item, index) => `${index + 1}. ${item.step} — ${item.detail}`).join(
            '\n',
          )}
        </CodeBlock>
      </DocSection>

      <DocSection heading="Trust ladder">
        <p>
          Each rung is a claim that has actually been checked. An AI proposal is recorded; it is
          not trusted. Maintainer approval is trusted. The ladder is not a score — it is a list of
          gates.
        </p>
        <SpecTable
          caption="Trust ladder rungs and whether the registry treats them as trusted"
          columns={[
            { key: 'rung', label: 'Rung' },
            { key: 'detail', label: 'Meaning' },
            { key: 'trusted', label: 'Trusted' },
          ]}
          rows={TRUST_LADDER.map((item) => ({
            rung: item.rung,
            detail: item.detail,
            trusted: item.trusted ? 'Yes' : 'No',
          }))}
        />
      </DocSection>
    </DocsArticle>
  );
}
