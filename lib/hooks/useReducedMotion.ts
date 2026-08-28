'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks `prefers-reduced-motion`. Starts pessimistic (true) so the first paint
 * on the server and the first client frame are both the static composition —
 * a user who asked for less motion never sees a flash of animation.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    const raf = requestAnimationFrame(sync);
    query.addEventListener('change', sync);
    return () => {
      cancelAnimationFrame(raf);
      query.removeEventListener('change', sync);
    };
  }, []);

  return reduced;
}
