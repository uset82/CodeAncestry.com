'use client';

import { useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { EVOLUTION_DIRECTIONS, type EvolutionDirectionId } from '@/data/demo';

/**
 * Four-direction instrument for Distributed Evolutionary Development.
 * Arrow keys map to the compass (not a linear list). Colour is paired with a
 * glyph so the selected ray survives greyscale. Motion is CSS `animate-dash`.
 */

const DEFAULT: EvolutionDirectionId = 'upward';

const KEY_TO_DIRECTION: Record<string, EvolutionDirectionId> = {
  ArrowUp: 'upward',
  ArrowDown: 'downward',
  ArrowLeft: 'sideways',
  ArrowRight: 'cross-family',
  Home: 'upward',
  End: 'cross-family',
};

const RAY: Record<EvolutionDirectionId, { x2: number; y2: number }> = {
  upward: { x2: 100, y2: 12 },
  downward: { x2: 100, y2: 188 },
  sideways: { x2: 12, y2: 100 },
  'cross-family': { x2: 188, y2: 100 },
};

export function DirectionMap({ className }: { className?: string }) {
  const [selected, setSelected] = useState<EvolutionDirectionId>(DEFAULT);
  const active = EVOLUTION_DIRECTIONS.find((item) => item.id === selected) ?? EVOLUTION_DIRECTIONS[1];

  const handleSelect = (id: EvolutionDirectionId) => {
    setSelected(id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const next = KEY_TO_DIRECTION[event.key];
    if (!next) return;
    event.preventDefault();
    handleSelect(next);
  };

  return (
    <div className={cn('font-ui', className)}>
      <p className="text-muted font-mono text-nano uppercase">Knowledge directions</p>

      <div className="mt-5 grid items-center gap-6 md:grid-cols-[minmax(13rem,16rem)_minmax(0,1fr)]">
        <div className="relative mx-auto aspect-square w-full max-w-[16rem]">
          <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
            {(Object.keys(RAY) as EvolutionDirectionId[]).map((id) => {
              const ray = RAY[id];
              const on = id === selected;
              return (
                <line
                  key={id}
                  x1="100"
                  y1="100"
                  x2={ray.x2}
                  y2={ray.y2}
                  stroke={on ? 'var(--color-acid)' : 'var(--color-line-strong)'}
                  strokeWidth={on ? 1.8 : 1.2}
                  strokeDasharray="4 5"
                  className={on ? 'animate-dash' : undefined}
                  opacity={on ? 0.95 : 0.55}
                />
              );
            })}
            <polygon
              points="100,90 110,100 100,110 90,100"
              fill="var(--color-void)"
              stroke="var(--color-acid)"
              strokeWidth="1.4"
            />
          </svg>

          <div
            role="radiogroup"
            aria-label="Evolution direction"
            className="absolute inset-0 grid grid-cols-3 grid-rows-3"
          >
            <span />
            <DirectionRadio
              id="upward"
              selected={selected}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              align="center"
            />
            <span />
            <DirectionRadio
              id="sideways"
              selected={selected}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              align="start"
            />
            <span aria-hidden="true" className="text-acid grid place-items-center font-mono text-nano">
              ◆
            </span>
            <DirectionRadio
              id="cross-family"
              selected={selected}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              align="end"
            />
            <span />
            <DirectionRadio
              id="downward"
              selected={selected}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              align="center"
            />
            <span />
          </div>
        </div>

        <div aria-live="polite">
          <p className="text-acid flex items-center gap-2 font-mono text-micro uppercase">
            <span aria-hidden="true">{active.glyph}</span>
            {active.label}
          </p>
          <p className="text-text mt-2 text-[15px] leading-snug tracking-tight">{active.example}</p>
          <p className="text-text-soft mt-2 text-[13.5px] leading-relaxed">{active.detail}</p>
        </div>
      </div>
    </div>
  );
}

const DirectionRadio = ({
  id,
  selected,
  onSelect,
  onKeyDown,
  align,
}: {
  id: EvolutionDirectionId;
  selected: EvolutionDirectionId;
  onSelect: (id: EvolutionDirectionId) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  align: 'start' | 'center' | 'end';
}) => {
  const item = EVOLUTION_DIRECTIONS.find((direction) => direction.id === id);
  if (!item) return null;

  const active = selected === id;
  const justify =
    align === 'start' ? 'justify-self-start' : align === 'end' ? 'justify-self-end' : 'justify-self-center';

  const handleClick = () => {
    onSelect(id);
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      aria-label={`${item.label}. ${item.example}`}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      className={cn(
        'z-10 self-center rounded-xs border px-2 py-1.5 text-left font-mono text-nano uppercase',
        justify,
        active ? 'border-acid/50 bg-void text-acid' : 'border-line bg-panel text-muted hover:text-text',
      )}
    >
      <span aria-hidden="true">{item.glyph}</span> {item.label}
    </button>
  );
};
