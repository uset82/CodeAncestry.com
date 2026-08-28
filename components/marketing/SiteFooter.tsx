import Link from 'next/link';
import { nav, site } from '@/lib/site';
import { HelixMark } from '@/components/ui/HelixMark';

/**
 * Site footer.
 *
 * Ends on the honest note: nothing here is live repository data. Columns are
 * separated by space and a hairline rather than by boxes.
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
  items,
  label,
}: {
  heading: string;
  label: string;
  items: readonly { href: string; label: string }[];
}) {
  return (
    <nav aria-label={label}>
      <h2 className="text-faint label mb-4">{heading}</h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-text-soft hover:text-acid text-[14px] transition-colors duration-[160ms]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-line border-t">
      <div className="shell-wide grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <HelixMark className="text-acid size-5" />
            <span className="text-[15px] font-medium tracking-[-0.02em]">{site.name}</span>
          </div>
          <p className="text-muted mt-4 max-w-[30ch] text-[14px] leading-relaxed">
            A semantic lineage layer above Git. Software genealogy, capability genomes and
            accountable agents.
          </p>
          <p className="text-faint label mt-6">2026 → ∞</p>
        </div>

        <Column heading="Product" label="Product" items={nav} />
        <Column heading="Resources" label="Resources" items={RESOURCES} />

        <div>
          <h2 className="text-faint label mb-4">Ecosystem</h2>
          <ul className="flex flex-col gap-2.5">
            {site.subdomains.map((entry) => (
              <li key={entry.host}>
                <span className="text-text-soft block font-mono text-[12px]">{entry.host}</span>
                <span className="text-faint text-[12.5px]">{entry.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-line border-t">
        <div className="shell-wide text-faint flex flex-wrap items-center justify-between gap-4 py-5 text-[12.5px]">
          <p>Working concept · seeded fixtures · no live repository data</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-text-soft transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-text-soft transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
