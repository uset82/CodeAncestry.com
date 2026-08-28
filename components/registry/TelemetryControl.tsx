'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { useRadioGroup } from '@/lib/hooks/useRadioGroup';
import type { AgentRecord } from '@/lib/registry/agent';
import { NEVER_COLLECTED } from '@/lib/schema/agentDna';

/**
 * The telemetry ladder.
 *
 * Observability of an agent is a dial, not a switch, and the reason to show the
 * whole dial is that the *shape* of it is the privacy claim: each rung adds one
 * named category, the owner picks a rung, and three categories sit outside the
 * ladder entirely and cannot be reached from any setting.
 *
 * Selecting a rung here previews what it would capture. It does not change the
 * record — this build has no registry to write to — and the copy says so rather
 * than implying a saved setting.
 */

/** What each rung adds on top of the one below it. */
const ADDS: Record<string, string[]> = {
  none: [],
  'metadata-only': ['Tool names', 'Token counts', 'Durations'],
  'tool-io': ['Tool arguments', 'Tool results'],
  excerpts: ['Published conversation fragments'],
  full: ['Prompts', 'Completions'],
};

const CAPTURE_ROWS = [
  { key: 'captureToolMetadata', label: 'Tool metadata' },
  { key: 'captureTokenMetrics', label: 'Token metrics' },
  { key: 'capturePrompts', label: 'Prompts' },
  { key: 'captureCompletions', label: 'Completions' },
] as const;

/** What a rung would set the four capture flags to. */
function flagsAt(index: number): Record<(typeof CAPTURE_ROWS)[number]['key'], boolean> {
  return {
    captureToolMetadata: index >= 1,
    captureTokenMetrics: index >= 1,
    capturePrompts: index >= 4,
    captureCompletions: index >= 4,
  };
}

export function TelemetryControl({ telemetry }: { telemetry: AgentRecord['telemetry'] }) {
  const activeIndex = telemetry.levels.findIndex((level) => level.active);
  const [selected, setSelected] = useState(activeIndex);
  const groupId = useId();
  const { groupProps, radioProps } = useRadioGroup({
    count: telemetry.levels.length,
    index: selected,
    onSelect: setSelected,
    orientation: 'vertical',
  });

  const level = telemetry.levels[selected];
  const isActive = selected === activeIndex;

  /* The flags actually on record, versus the flags the chosen rung implies. */
  const recorded = {
    captureToolMetadata: telemetry.captureToolMetadata,
    captureTokenMetrics: telemetry.captureTokenMetrics,
    capturePrompts: telemetry.capturePrompts,
    captureCompletions: telemetry.captureCompletions,
  };
  const flags = isActive ? recorded : flagsAt(selected);

  /* Everything the chosen rung and every rung below it would capture. */
  const captured = telemetry.levels
    .slice(0, selected + 1)
    .flatMap((entry) => ADDS[entry.value] ?? []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      {/* ================================================================ the dial */}
      <div>
        <p id={groupId} className="text-faint font-mono text-nano uppercase">
          Telemetry level
        </p>

        <div {...groupProps} aria-labelledby={groupId} className="mt-2 space-y-1.5">
          {telemetry.levels.map((entry, index) => {
            const checked = index === selected;
            return (
              <button
                key={entry.value}
                {...radioProps(index)}
                className={cn(
                  'focus-visible:outline-acid flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:outline-2',
                  checked
                    ? 'border-cyan/50 bg-cyan/8'
                    : 'border-line hover:border-line-strong bg-panel-2/40',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-[3px] font-mono text-nano tabular-nums',
                    checked ? 'text-cyan' : 'text-faint',
                  )}
                >
                  {String(index).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span
                      className={cn(
                        'text-[13.5px] font-semibold',
                        checked ? 'text-text' : 'text-text-soft',
                      )}
                    >
                      {entry.label}
                    </span>
                    {index === activeIndex && (
                      <span className="text-acid font-mono text-nano uppercase">On record</span>
                    )}
                    {index > activeIndex && (
                      <span className="text-faint font-mono text-nano uppercase">
                        Not collected
                      </span>
                    )}
                  </span>
                  <span className="text-muted mt-0.5 block text-[12.5px] leading-relaxed">
                    {entry.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================== consequences */}
      <div className="border-line bg-panel-2/50 rounded-lg border p-4">
        <p className="text-text text-[13.5px] font-semibold">
          {level ? level.label : 'Telemetry'}
          {isActive && <span className="text-acid ml-2 font-mono text-nano uppercase">Actual</span>}
        </p>

        <table className="mt-3 w-full border-collapse text-[12px]">
          <caption className="sr-only">
            Capture flags {isActive ? 'on record' : 'this level would set'}.
          </caption>
          <tbody>
            {CAPTURE_ROWS.map((row) => (
              <tr key={row.key} className="border-line-soft border-b last:border-0">
                <th scope="row" className="text-text-soft py-1.5 text-left font-normal">
                  {row.label}
                </th>
                <td
                  className={cn(
                    'py-1.5 text-right font-mono text-nano uppercase',
                    flags[row.key] ? 'text-cyan' : 'text-faint',
                  )}
                >
                  {flags[row.key] ? 'Captured' : 'Off'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-faint mt-4 font-mono text-nano uppercase">
          Recorded at this level ({captured.length})
        </p>
        {captured.length > 0 ? (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {captured.map((item) => (
              <li
                key={item}
                className="border-line bg-void text-muted rounded-sm border px-2 py-[3px] font-mono text-nano"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mt-1.5 text-[12.5px]">
            Nothing. The agent still works; it simply leaves no trace here.
          </p>
        )}

        {/* ------------------------------------------------- outside the ladder */}
        <p className="text-faint border-line mt-4 border-t pt-4 font-mono text-nano uppercase">
          Never collected, at any level
        </p>
        <ul className="mt-1.5 space-y-1">
          {NEVER_COLLECTED.map((item) => (
            <li key={item} className="text-muted flex gap-2 text-[12.5px] leading-relaxed">
              <span aria-hidden="true" className="text-rose font-mono text-nano">
                ✕
              </span>
              {item}
            </li>
          ))}
        </ul>

        {!isActive && (
          <p aria-live="polite" className="text-faint mt-4 text-[12px] leading-relaxed">
            Preview only. The level on record is{' '}
            {telemetry.levels[activeIndex]?.label.toLowerCase()}, and changing it belongs to
            whoever owns the agent, not to a reader of its profile.
          </p>
        )}
      </div>
    </div>
  );
}
