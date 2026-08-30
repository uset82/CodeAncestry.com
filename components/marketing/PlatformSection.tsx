import { Eyebrow, Section } from './Section';

/**
 * Homepage 03 — what CodeAncestry is. Beat 3. External sources feed a centre.
 * Does not replace Git. Motion is CSS `animate-dash` on the feed marks; no rAF
 * on the helix scroll path. `prefers-reduced-motion` kills the dash globally.
 */

const REPOS = [
  'GitHub',
  'GitLab',
  'Gitee',
  'GitCode',
  'Bitbucket',
  'Codeberg',
  'Self-hosted Git',
  'Future repositories',
] as const;

const AGENTS = [
  'Codex',
  'Claude',
  'Grok',
  'Cursor',
  'Open-source agents',
  'Enterprise agents',
  'Future agents',
] as const;

const OUTPUTS = [
  'Genome',
  'Lineage',
  'Provenance',
  'Genes',
  'Agents',
  'Mutations',
  'Health',
] as const;

export function PlatformSection() {
  return (
    <Section id="platform" beat={3} beatSide="left">
      <div className="max-w-[640px]">
        <Eyebrow index="03">What is CodeAncestry</Eyebrow>
        <h2 className="text-headline mt-4 text-balance">
          A genealogy layer
          <br />
          <span className="text-emphasis">for software.</span>
        </h2>
        <p className="text-text-soft mt-6 leading-relaxed">
          CodeAncestry does not replace GitHub or GitLab. It connects the evolutionary history
          living across them. Repositories stay where they are. Agents stay where they run.
        </p>
      </div>

      <figure className="border-line bg-panel mt-12 max-w-[720px] rounded-sm border p-5 md:p-7">
        <figcaption className="text-muted mb-6 font-mono text-nano uppercase">
          External sources feed the registry
        </figcaption>

        <div className="grid items-stretch gap-6 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
          <FeedColumn kicker="Repositories" items={REPOS} tone="cyan" inbound />

          <div className="flex flex-col items-center justify-center gap-3 py-2">
            <FeedMark tone="cyan" />
            <p className="border-acid/40 bg-void text-acid rounded-xs border px-3 py-2.5 text-center font-mono text-micro uppercase">
              CodeAncestry
            </p>
            <FeedMark tone="violet" />
          </div>

          <FeedColumn kicker="Agents" items={AGENTS} tone="violet" inbound={false} />
        </div>

        <ul className="border-line mt-7 flex flex-wrap gap-1.5 border-t pt-5">
          {OUTPUTS.map((output) => (
            <li
              key={output}
              className="border-line bg-void text-muted rounded-sm border px-2 py-1 font-mono text-nano uppercase"
            >
              {output}
            </li>
          ))}
        </ul>
      </figure>
    </Section>
  );
}

function FeedColumn({
  kicker,
  items,
  tone,
  inbound,
}: {
  kicker: string;
  items: readonly string[];
  tone: 'cyan' | 'violet';
  inbound: boolean;
}) {
  const kickerClass = tone === 'cyan' ? 'text-cyan' : 'text-violet';

  return (
    <div>
      <p className={`mb-3 font-mono text-nano uppercase ${kickerClass}`}>{kicker}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            {inbound && <FeedTick tone={tone} />}
            <span className="text-text-soft min-w-0 flex-1 text-[13.5px] leading-snug">{item}</span>
            {!inbound && <FeedTick tone={tone} reverse />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeedTick({ tone, reverse = false }: { tone: 'cyan' | 'violet'; reverse?: boolean }) {
  const stroke = tone === 'cyan' ? 'var(--color-cyan)' : 'var(--color-violet)';

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 6"
      className={`h-1.5 w-7 shrink-0 ${reverse ? 'rotate-180' : ''}`}
    >
      <line
        x1="0"
        y1="3"
        x2="28"
        y2="3"
        stroke={stroke}
        strokeWidth="1.2"
        strokeDasharray="4 5"
        className="animate-dash"
        opacity="0.7"
      />
    </svg>
  );
}

function FeedMark({ tone }: { tone: 'cyan' | 'violet'; reverse?: boolean }) {
  const stroke = tone === 'cyan' ? 'var(--color-cyan)' : 'var(--color-violet)';

  return (
    <svg aria-hidden="true" viewBox="0 0 12 28" className="h-7 w-3">
      <line
        x1="6"
        y1="0"
        x2="6"
        y2="28"
        stroke={stroke}
        strokeWidth="1.2"
        strokeDasharray="4 5"
        className="animate-dash"
        opacity="0.75"
      />
    </svg>
  );
}
