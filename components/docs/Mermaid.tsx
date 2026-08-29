'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Client-only Mermaid renderer.
 *
 * The source string is the accessible equivalent: a screen reader gets the
 * diagram as text inside a disclosure, not as an unlabeled SVG. Colour is
 * structural, not the only encoding — every diagram on the spec also has a
 * table or a list next to it.
 */
export function Mermaid({
  chart,
  caption,
  className,
}: {
  chart: string;
  caption: string;
  className?: string;
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
          themeVariables: {
            background: 'transparent',
            primaryColor: '#f3f4f6',
            primaryTextColor: '#0d1014',
            primaryBorderColor: '#b9bfc8',
            lineColor: '#5b6470',
            secondaryColor: '#e8eaee',
            tertiaryColor: '#ffffff',
            fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
          },
        });
        const { svg: drawn } = await mermaid.render(`docs-mermaid-${rawId}`, chart);
        if (!cancelled) {
          setSvg(drawn);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Diagram failed to render');
        }
      }
    };

    void render();
    return () => {
      cancelled = true;
    };
  }, [chart, rawId]);

  return (
    <figure className={cn('border-line bg-panel overflow-x-auto rounded-lg border', className)}>
      {svg ? (
        <div
          className="p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
          role="img"
          aria-label={caption}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="p-4" role="status">
          {error ? (
            <p className="text-rose font-mono text-[12px]">{error}</p>
          ) : (
            <p className="text-muted font-mono text-[12px]">Drawing diagram…</p>
          )}
        </div>
      )}
      <figcaption className="border-line text-muted border-t px-4 py-2.5 text-[13px]">
        {caption}
      </figcaption>
      <details className="border-line border-t">
        <summary className="text-muted hover:text-text cursor-pointer px-4 py-2 font-mono text-nano uppercase tracking-[0.08em]">
          Diagram source
        </summary>
        <pre className="bg-panel-2 overflow-x-auto px-4 py-3 font-mono text-[12px] leading-relaxed">
          <code>{chart.trim()}</code>
        </pre>
      </details>
    </figure>
  );
}
