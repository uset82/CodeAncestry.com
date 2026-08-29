'use client';

import { useState, type ChangeEvent } from 'react';
import { cn } from '@/lib/cn';
import { CodeBlock } from '@/components/registry/RegistryShell';

export type SchemaViewerEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  schema: string;
  example: string | null;
};

/**
 * Live schema browser. The documents are compiled on the server from Zod;
 * this component only switches panes and copies. Draft 2020-12 is the
 * emitted dialect — not a hand-written snapshot.
 */
export function SchemaViewer({ entries }: { entries: readonly SchemaViewerEntry[] }) {
  const [selected, setSelected] = useState(entries[0]?.id ?? '');
  const [pane, setPane] = useState<'schema' | 'example'>('schema');
  const entry = entries.find((item) => item.id === selected) ?? entries[0];

  if (!entry) return null;

  const body = pane === 'example' && entry.example ? entry.example : entry.schema;

  const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelected(event.target.value);
    setPane('schema');
  };

  const handlePane = (next: 'schema' | 'example') => {
    setPane(next);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      /* clipboard can be denied; the text is still on the page */
    }
  };

  return (
    <div className="border-line overflow-hidden rounded-lg border">
      <div className="border-line bg-panel-2 flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <label className="text-muted label" htmlFor="schema-select">
          Schema
        </label>
        <select
          id="schema-select"
          value={entry.id}
          onChange={handleSelect}
          className="border-line bg-panel text-text rounded-md border px-2 py-1.5 font-mono text-[13px]"
        >
          {entries.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <a
          href={entry.href}
          className="text-cyan font-mono text-[12px] underline-offset-2 hover:underline"
        >
          {entry.href}
        </a>
      </div>

      <p className="text-muted border-line border-b px-4 py-3 text-[13.5px] leading-relaxed">
        {entry.description} JSON Schema Draft 2020-12, generated with{' '}
        <code>z.toJSONSchema</code> from the live Zod module.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div role="tablist" aria-label="Schema or example" className="flex gap-1.5">
          {(
            [
              { id: 'schema', label: 'JSON Schema' },
              { id: 'example', label: 'Example payload' },
            ] as const
          ).map((tab) => {
            const disabled = tab.id === 'example' && !entry.example;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={pane === tab.id}
                disabled={disabled}
                onClick={() => handlePane(tab.id)}
                className={cn(
                  'rounded border px-2.5 py-1 font-mono text-nano uppercase transition-colors',
                  pane === tab.id
                    ? 'border-cyan/50 bg-cyan/10 text-cyan'
                    : 'border-line text-muted hover:border-line-strong hover:text-text-soft',
                  disabled && 'cursor-not-allowed opacity-40',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted hover:text-text font-mono text-nano uppercase"
          aria-label={pane === 'schema' ? `Copy ${entry.title} schema` : `Copy ${entry.title} example`}
        >
          Copy
        </button>
      </div>

      <CodeBlock>{body}</CodeBlock>
    </div>
  );
}
