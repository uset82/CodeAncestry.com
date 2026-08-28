'use client';

import { useRef, type KeyboardEvent } from 'react';

/**
 * Keyboard behaviour for an ARIA radio group.
 *
 * A group of buttons with `role="radio"` is not a radio group until it moves
 * focus like one: exactly one member in the tab sequence, arrows moving both
 * focus and selection, Home and End jumping to the ends. Without that the
 * pattern is worse than plain buttons, because it promises radio semantics to a
 * screen reader and then behaves like a toolbar.
 */

type Options = {
  count: number;
  /** Index of the selected member. */
  index: number;
  onSelect: (index: number) => void;
  /** Whether arrows on the cross axis also move. Defaults to both axes. */
  orientation?: 'horizontal' | 'vertical' | 'both';
};

const NEXT_KEYS: Record<string, 'next' | 'prev' | 'first' | 'last'> = {
  ArrowRight: 'next',
  ArrowDown: 'next',
  ArrowLeft: 'prev',
  ArrowUp: 'prev',
  Home: 'first',
  End: 'last',
};

const AXIS: Record<string, 'horizontal' | 'vertical'> = {
  ArrowRight: 'horizontal',
  ArrowLeft: 'horizontal',
  ArrowDown: 'vertical',
  ArrowUp: 'vertical',
};

export function useRadioGroup({ count, index, onSelect, orientation = 'both' }: Options) {
  const items = useRef<(HTMLButtonElement | null)[]>([]);

  function move(to: number) {
    /* Radio groups wrap, unlike tree items. */
    const next = ((to % count) + count) % count;
    onSelect(next);
    items.current[next]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const intent = NEXT_KEYS[event.key];
    if (!intent) return;

    const axis = AXIS[event.key];
    if (axis && orientation !== 'both' && axis !== orientation) return;

    event.preventDefault();
    if (intent === 'next') move(index + 1);
    else if (intent === 'prev') move(index - 1);
    else if (intent === 'first') move(0);
    else move(count - 1);
  }

  return {
    /** Spread on the element wrapping the radios. */
    groupProps: {
      role: 'radiogroup' as const,
      'aria-orientation': orientation === 'both' ? undefined : orientation,
    },
    /** Spread on each radio button. */
    radioProps(position: number) {
      return {
        type: 'button' as const,
        role: 'radio' as const,
        'aria-checked': position === index,
        tabIndex: position === index ? 0 : -1,
        ref: (node: HTMLButtonElement | null) => {
          items.current[position] = node;
        },
        onClick: () => onSelect(position),
        onKeyDown: handleKeyDown,
      };
    },
  };
}
