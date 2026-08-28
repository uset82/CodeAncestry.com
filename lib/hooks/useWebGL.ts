'use client';

import { useEffect, useState } from 'react';

export type WebGLTier = 'unknown' | 'none' | 'low' | 'high';

/**
 * Feature-detects WebGL2 and picks a level of detail.
 *
 * `low` covers small viewports, coarse pointers and machines that report few
 * logical cores — the hero drops instance counts rather than dropping frames.
 */
export function useWebGL(): { tier: WebGLTier; supported: boolean } {
  const [tier, setTier] = useState<WebGLTier>('unknown');

  useEffect(() => {
    let cancelled = false;

    const detect = () => {
      if (cancelled) return;

      let supported = false;
      try {
        const canvas = document.createElement('canvas');
        supported = Boolean(
          canvas.getContext('webgl2') ??
            canvas.getContext('webgl') ??
            canvas.getContext('experimental-webgl'),
        );
      } catch {
        supported = false;
      }

      if (!supported) {
        setTier('none');
        return;
      }

      const smallViewport = window.innerWidth < 900;
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const fewCores = (navigator.hardwareConcurrency ?? 4) <= 4;
      const saveData =
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData ===
        true;

      setTier(smallViewport || coarsePointer || fewCores || saveData ? 'low' : 'high');
    };

    /* Detected synchronously, never inside requestAnimationFrame. rAF does not
       fire in a tab that is not compositing, which left `tier` stuck on
       'unknown' and the animated hero permanently unmounted. */
    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  return { tier, supported: tier === 'low' || tier === 'high' };
}
