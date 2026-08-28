import Link from 'next/link';
import { nav, site } from '@/lib/site';
import { HelixMark } from '@/components/ui/HelixMark';

/**
 * The colophon.
 *
 * A bound volume ends by telling you how it was made and what it is not. The
 * imprint line at the bottom is the honest part: none of this is live data,
 * and the footer says so before anyone has to ask.
 */

const RESOURCES = [
  { href: '/docs', label: 'Protocol specification' },
  { href: '/docs/formats', label: 'File formats' },
  { href: '/docs/standards', label: 'Standards interop' },
  { href: '/docs/language', label: 'Language and ethics' },
  { href: '/research', label: 'Research' },
];

function Column({
  heading,
  children,
  label,
}: {
  heading: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={label}>
      <h2 className="text-press-vermilion border-ink/25 runhead mb-4 border-b pb-2.5 text-[9.5px]">
        {heading}
      </h2>
      {children}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-ink/25 border-t-2">
      {/* The wordmark, set as a full-measure display line. */}
      <div className="border-ink/12 border-b">
        <div className="shell-wide flex items-end justify-between gap-8 py-10">
          <p className="font-display flex items-baseline gap-4 text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.85] tracking-[-0.03em]">
            {site.name}
            <span className="text-emphasis text-[0.28em] tracking-[0.02em]">
              every machine has ancestors
            </span>
          </p>
          <HelixMark className="text-press-vermilion hidden size-12 shrink-0 md:block" />
        </div>
      </div>

      <div className="shell-wide grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
        <div>
          <h2 className="text-ink-faint border-ink/25 runhead mb-4 border-b pb-2.5 text-[9.5px]">
            The layer
          </h2>
          <p className="text-ink-soft max-w-[300px] text-[14.5px] leading-[1.62]">
            A semantic lineage layer above Git. Software genealogy, capability genomes and
            accountable agents.
          </p>
          <p className="text-ink-faint runhead mt-6 text-[9.5px]">2026 → ∞</p>
        </div>

        <Column heading="Product" label="Product">
          <ul className="flex flex-col gap-2.5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-ink-soft hover:text-ink decoration-press-vermilion/50 text-[14px] hover:underline hover:underline-offset-[3px]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Column>

        <Column heading="Resources" label="Resources">
          <ul className="flex flex-col gap-2.5">
            {RESOURCES.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-ink-soft hover:text-ink decoration-press-vermilion/50 text-[14px] hover:underline hover:underline-offset-[3px]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Column>

        <div>
          <h2 className="text-ink-faint border-ink/25 runhead mb-4 border-b pb-2.5 text-[9.5px]">
            Ecosystem
          </h2>
          <ul className="flex flex-col gap-2.5">
            {site.subdomains.map((entry) => (
              <li key={entry.host} className="border-ink/10 flex flex-col border-b pb-2 last:border-0">
                <span className="text-ink font-mono text-[11.5px]">{entry.host}</span>
                <span className="text-ink-faint text-[12.5px]">{entry.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The imprint. Dark bar, the way a press stamps the last page. */}
      <div className="bg-ink text-paper/65">
        <div className="shell-wide runhead flex flex-wrap items-center justify-between gap-4 py-4 text-[9px] tracking-[0.22em]">
          <p>Working concept · seeded fixtures · no live repository data</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-paper">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-paper">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
