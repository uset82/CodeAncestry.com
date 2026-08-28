import Link from 'next/link';
import { nav, site } from '@/lib/site';
import { HelixMark } from '@/components/ui/HelixMark';

const RESOURCES = [
  { href: '/docs', label: 'Protocol specification' },
  { href: '/docs/formats', label: 'File formats' },
  { href: '/docs/standards', label: 'Standards interop' },
  { href: '/docs/language', label: 'Language and ethics' },
  { href: '/research', label: 'Research' },
];

export function SiteFooter() {
  return (
    <footer className="border-line border-t">
      <div className="shell-wide grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2.5 font-bold tracking-[-0.03em]">
            <HelixMark className="text-acid size-5" />
            <span>{site.name}</span>
          </div>
          <p className="text-muted mt-3 max-w-[280px] text-[13px] leading-relaxed">
            A semantic lineage layer above Git. Software genealogy, capability genomes and
            accountable agents.
          </p>
          <p className="text-faint mt-4 font-mono text-nano uppercase">2026 → ∞</p>
        </div>

        <nav aria-label="Product">
          <h2 className="text-muted mb-3 font-mono text-nano uppercase">Product</h2>
          <ul className="flex flex-col gap-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-text-soft hover:text-text text-[13px]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Resources">
          <h2 className="text-muted mb-3 font-mono text-nano uppercase">Resources</h2>
          <ul className="flex flex-col gap-2">
            {RESOURCES.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-text-soft hover:text-text text-[13px]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-muted mb-3 font-mono text-nano uppercase">Ecosystem</h2>
          <ul className="flex flex-col gap-2">
            {site.subdomains.map((entry) => (
              <li key={entry.host} className="flex flex-col">
                <span className="text-text-soft font-mono text-[11px]">{entry.host}</span>
                <span className="text-faint text-[11px]">{entry.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-line border-t">
        <div className="shell-wide text-faint flex flex-wrap items-center justify-between gap-3 py-5 text-[11px]">
          <p>
            Working concept. Every screen on this site is driven by seeded fixtures, not live
            repository data.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-text-soft">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-text-soft">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
