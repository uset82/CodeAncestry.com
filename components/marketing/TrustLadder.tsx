import { getHeroMutation } from '@/lib/registry';
import { EvidenceChip } from '@/components/ui/EvidenceChip';
import { Eyebrow, Section } from './Section';

/**
 * The trust ladder, rendered against the real state of the hero mutation.
 *
 * Rungs read bottom-up, the way trust is actually accumulated: an AI proposal
 * is the weakest possible claim, and maintainer approval is the only rung that
 * lets anything move. The checklist values come from the fixture, so the last
 * rung being unmet is a fact about the data, not decoration.
 */

const RUNGS = [
  {
    id: 'proposal',
    label: 'AI proposal',
    detail: 'A model claims a change helps. On its own, this is worth nothing.',
    code: 'AII' as const,
    key: null,
  },
  {
    id: 'source',
    label: 'Source verified',
    detail: 'The content digest matches what was reviewed. No substitution.',
    code: 'STA' as const,
    key: 'sourceDigestVerified' as const,
  },
  {
    id: 'build',
    label: 'Build verified',
    detail: 'SLSA provenance ties the artifact to the commit and the workflow.',
    code: 'DEP' as const,
    key: 'buildProvenanceVerified' as const,
  },
  {
    id: 'tests',
    label: 'Tests passed',
    detail: "The receiving project's own suite ran green in a sandbox.",
    code: 'TST' as const,
    key: 'testsPassed' as const,
  },
  {
    id: 'policy',
    label: 'Security and licence passed',
    detail: 'No new advisories, and the SPDX expression stays compatible.',
    code: 'SEC' as const,
    key: 'securityPolicyPassed' as const,
  },
  {
    id: 'human',
    label: 'Maintainer approved',
    detail: 'A person with authority over the receiving project said yes.',
    code: 'HVR' as const,
    key: 'maintainerApproved' as const,
  },
];

export function TrustLadder() {
  const mutation = getHeroMutation();
  const met = (key: (typeof RUNGS)[number]['key']) =>
    key === null ? true : mutation.checklist[key];

  const cleared = RUNGS.filter((rung) => met(rung.key)).length;

  return (
    <Section id="trust">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <Eyebrow index="05">Trust ladder</Eyebrow>
          <h2 className="text-headline mt-4 text-balance">
            Confidence is earned
            <br />
            <span className="text-outline">one rung at a time.</span>
          </h2>
          <p className="text-text-soft mt-6 leading-relaxed">
            Most tools present machine output and human review as equivalent. They are not. Every
            claim in this registry carries the reason it should be believed, and a claim can be
            correct and still be unverified.
          </p>

          <p className="text-muted mt-6 text-[15px] leading-relaxed">
            {mutation.shortId} has cleared {cleared} of {RUNGS.length} rungs. It has been measured,
            sandboxed and signed. It is still waiting on the one rung that matters most — and it
            will keep waiting.
          </p>
        </div>

        <ol className="flex flex-col-reverse gap-2">
          {RUNGS.map((rung, i) => {
            const cleared = met(rung.key);
            return (
              <li
                key={rung.id}
                className={`flex items-start gap-4 rounded-md border px-4 py-4 transition-colors ${
                  cleared
                    ? 'border-acid/25 bg-acid/[0.045]'
                    : 'border-line-strong bg-panel-2/60 border-dashed'
                }`}
                /* Staircase indent, but never so deep that it squeezes the copy
                   on a narrow screen. */
                style={{ marginInlineStart: `clamp(0px, ${i * 2}vw, ${i * 14}px)` }}
              >
                <span
                  aria-hidden="true"
                  className={`mt-[3px] grid size-6 shrink-0 place-items-center rounded-sm border font-mono text-[11px] ${
                    cleared ? 'border-acid/40 text-acid' : 'border-line-strong text-faint'
                  }`}
                >
                  {cleared ? '✓' : '○'}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h3
                      className={`text-[15.5px] font-semibold tracking-tight ${
                        cleared ? 'text-text' : 'text-muted'
                      }`}
                    >
                      {rung.label}
                    </h3>
                    <EvidenceChip code={rung.code} />
                    {!cleared && (
                      <span className="text-amber font-mono text-nano uppercase">
                        Not met — cannot propagate
                      </span>
                    )}
                  </div>
                  <p className="text-muted mt-1.5 text-[13.5px] leading-relaxed">{rung.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
