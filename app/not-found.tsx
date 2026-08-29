import Link from 'next/link';
import { demo, nav } from '@/lib/site';
import { ButtonLink } from '@/components/ui/Button';

/**
 * Not found.
 *
 * Empty-state rule: say what is missing, why it matters, and what to do next.
 * An accession that resolves to nothing is a real answer in a registry — it
 * means no record carries that identifier.
 */
export default function NotFound() {
  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center py-20">
      <p className="text-acid label">404</p>
      <h1 className="text-headline mt-3">No record at this address</h1>
      <p className="text-muted mt-4 max-w-[46ch] text-lead">
        Either the accession does not exist in the seeded registry, or the page has moved. Every
        record on this site comes from a fixture describing the eight-project KEYLIT family.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/explore" size="lg">
          Search the registry
        </ButtonLink>
        <ButtonLink href={demo.family} variant="secondary" size="lg">
          Open the CodeTree
        </ButtonLink>
      </div>

      <nav aria-label="Site sections" className="border-line mt-14 border-t pt-6">
        <p className="text-muted label mb-4">Everywhere else</p>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-text-soft hover:text-acid text-[14px] transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
