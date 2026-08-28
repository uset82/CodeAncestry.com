import { cn } from '@/lib/cn';

/**
 * Loading skeletons that mirror the real layout rather than a generic spinner,
 * so the page does not shift when data lands.
 */
export function ResultSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <ul className={cn('grid gap-px', className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="bg-line/40">
          <div className="bg-void border-line-strong/40 border-l-2 p-5 md:p-6">
            <div className="flex gap-3">
              <Bar className="w-24" />
              <Bar className="w-32" />
            </div>
            <Bar className="mt-4 h-4 w-1/2" />
            <Bar className="mt-3 w-40" />
            <Bar className="mt-4 w-full max-w-[52ch]" />
            <Bar className="mt-2 w-full max-w-[40ch]" />
            <div className="mt-5 flex gap-2">
              <Bar className="w-14" />
              <Bar className="w-14" />
              <Bar className="w-20" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Bar({ className }: { className?: string }) {
  return (
    <span
      className={cn('bg-panel-3 animate-breathe block h-2.5 rounded-sm', className)}
      style={{ animationDuration: '1.6s' }}
    />
  );
}
