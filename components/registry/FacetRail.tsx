'use client';

import { cn } from '@/lib/cn';
import type { FacetGroup, FacetKey } from '@/lib/registry/search';

export type FacetSelection = Partial<Record<FacetKey, string[]>>;

/**
 * Faceted narrowing, counted against the unfiltered universe so a reader can
 * see what exists before removing it. Every facet is a checkbox group rather
 * than a dropdown: the point is being able to see the shape of the corpus.
 */
export function FacetRail({
  groups,
  selection,
  onToggle,
  onClear,
  fitnessOnly,
  onFitnessOnly,
  className,
}: {
  groups: FacetGroup[];
  selection: FacetSelection;
  onToggle: (key: FacetKey, value: string) => void;
  onClear: () => void;
  fitnessOnly: boolean;
  onFitnessOnly: (value: boolean) => void;
  className?: string;
}) {
  const activeCount =
    Object.values(selection).reduce((sum, values) => sum + (values?.length ?? 0), 0) +
    (fitnessOnly ? 1 : 0);

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-muted font-mono text-nano uppercase">
          Filters
          {activeCount > 0 && <span className="text-acid ml-2 tabular-nums">{activeCount}</span>}
        </h3>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-faint hover:text-text font-mono text-nano uppercase underline decoration-dotted"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-4">
        <FacetCheckbox
          checked={fitnessOnly}
          onChange={() => onFitnessOnly(!fitnessOnly)}
          label="Has measured fitness"
        />
      </div>

      {groups.map((group) => (
        <fieldset key={group.key} className="border-line/60 mt-6 border-t pt-4">
          <legend className="text-faint font-mono text-nano uppercase">
            {group.label}
            <span className="text-faint/60 ml-2 normal-case">
              {group.appliesTo.length < 4 && `· ${group.appliesTo.join(', ')}`}
            </span>
          </legend>

          <div className="mt-2.5 flex flex-col gap-1">
            {group.options.map((option) => (
              <FacetCheckbox
                key={option.value}
                checked={selection[group.key]?.includes(option.value) ?? false}
                onChange={() => onToggle(group.key, option.value)}
                label={option.label}
                count={option.count}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

function FacetCheckbox({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label
      className={cn(
        'group flex cursor-pointer items-center gap-2.5 rounded-sm px-1.5 py-1 transition-colors',
        checked ? 'text-text' : 'text-text-soft hover:bg-panel-2',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only-focusable peer absolute"
      />
      <span
        aria-hidden="true"
        className={cn(
          'grid size-[15px] shrink-0 place-items-center rounded-[3px] border font-mono text-[9px] transition-colors',
          'peer-focus-visible:outline-acid peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
          checked ? 'border-acid bg-acid text-void' : 'border-line-strong group-hover:border-muted',
        )}
      >
        {checked ? '✓' : ''}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13.5px]">{label}</span>
      {count !== undefined && (
        <span className="text-faint shrink-0 font-mono text-nano tabular-nums">{count}</span>
      )}
    </label>
  );
}
