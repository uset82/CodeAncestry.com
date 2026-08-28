'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const query = window.matchMedia(QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;

/* The server cannot know the preference. Assume reduced so the markup it emits
   is the static composition — a user who asked for less motion never sees a
   frame of animation. */
const getServerSnapshot = () => true;

/**
 * Tracks `prefers-reduced-motion`.
 *
 * Deliberately NOT rAF-gated. The previous implementation resolved inside
 * `requestAnimationFrame`, which never fires in a tab that is not compositing
 * (backgrounded, throttled, or rendered offscreen) — so the value stayed stuck
 * at its pessimistic default and the animated hero never mounted at all.
 * `useSyncExternalStore` reads the real value during render instead.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
