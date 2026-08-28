import { Bar, ResultSkeleton } from '@/components/registry/ResultSkeleton';

export default function ExploreLoading() {
  return (
    <div className="shell-wide py-10 md:py-14">
      <p className="text-acid font-mono text-micro uppercase">Registry</p>
      <h1 className="text-headline mt-3">Explore the registry</h1>

      <div className="border-line bg-panel-2 mt-9 h-14 w-full rounded-lg border" aria-hidden="true" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[248px_1fr] lg:gap-12">
        <aside aria-hidden="true" className="flex flex-col gap-4">
          <div className="border-line bg-panel/40 rounded-xl border p-4">
            <Bar className="w-32" />
            <Bar className="mt-4 h-1.5 w-full" />
            <Bar className="mt-4 w-full max-w-[24ch]" />
          </div>
          <div className="border-line bg-panel/40 rounded-xl border p-4">
            <Bar className="w-28" />
            {Array.from({ length: 7 }).map((_, i) => (
              <Bar key={i} className="mt-3 w-full" />
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <span className="sr-only" role="status">
            Loading registry records
          </span>
          <ResultSkeleton rows={4} className="mt-8" />
        </div>
      </div>
    </div>
  );
}
