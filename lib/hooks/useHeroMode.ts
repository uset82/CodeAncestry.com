'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

export type HeroMode = 'static' | 'low' | 'high';

/**
 * Decides which hero the visitor gets, in one place.
 *
 * This replaces the old split between `useWebGL` and a separate CSS breakpoint
 * on the canvas, which disagreed: below `lg` the canvas was `display:none`, but
 * the tier still reported `low`, so phones mounted five viewports of scroll
 * runway over an invisible scene and downloaded three.js to render nothing.
 *
 * The width test and the capability test now produce a single answer:
 *
 *   static  no WebGL, reduced motion, or a viewport too narrow to show the
 *           scene beside the copy — render the static composition
 *   low     capable but modest: fewer instances, no labels, lower DPR
 *   high    full scene
 *
 * Detection is synchronous inside the effect. It is never wrapped in
 * `requestAnimationFrame`, because rAF does not fire in a non-compositing tab
 * and the hero would silently stay static forever.
 */

/* Matches the breakpoint at which the scene column appears.
   Deliberately `md` (768px), not `lg`. The scene is ~18 draw calls and a few
   instanced meshes — any laptop runs it. Gating at 1024 meant a 1012px window
   fell through to a static text list with half the hero empty, which is the
   worst version of this page and a very common width. */
const WIDE = '(min-width: 48rem)';

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

export function useHeroMode(): HeroMode {
  const reducedMotion = useReducedMotion();
  const [capability, setCapability] = useState<HeroMode>('static');

  useEffect(() => {
    const wide = window.matchMedia(WIDE);

    const resolve = () => {
      if (!wide.matches || !detectWebGL()) {
        setCapability('static');
        return;
      }

      const fewCores = (navigator.hardwareConcurrency ?? 4) <= 4;
      const saveData =
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
        true;

      setCapability(fewCores || saveData ? 'low' : 'high');
    };

    resolve();
    wide.addEventListener('change', resolve);
    return () => wide.removeEventListener('change', resolve);
  }, []);

  return reducedMotion ? 'static' : capability;
}
