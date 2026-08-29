'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';
import dynamic from 'next/dynamic';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useWebGL } from '@/lib/hooks/useWebGL';
import { beatStateAt, daylight, measureViewportBeat, type BeatState } from './beats';

const HelixScene = dynamic(() => import('./HelixScene').then((m) => m.HelixScene), {
  ssr: false,
});

export type HelixDriverValue = {
  activeIndex: number;
  animated: boolean;
};

const HelixDriverContext = createContext<HelixDriverValue>({
  activeIndex: 0,
  animated: false,
});

export function useHelixDriver(): HelixDriverValue {
  return useContext(HelixDriverContext);
}

declare global {
  interface Window {
    __HELIX_FRAMES?: number;
    __HELIX_LOOP?: 'always' | 'demand';
    __HELIX_BEAT?: number;
  }
}

function FrameProbe() {
  useFrame(() => {
    window.__HELIX_FRAMES = (window.__HELIX_FRAMES ?? 0) + 1;
  });
  return null;
}

/**
 * Page-level helix. The canvas is a fixed backdrop; sections scroll over it.
 * Measurement is synchronous in the scroll handler — no rAF on that path.
 */
export function HelixStage({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const { tier, supported } = useWebGL();
  const animated = supported && !reducedMotion;
  const quality: 'low' | 'high' = tier === 'high' ? 'high' : 'low';

  const state = useRef<BeatState>(beatStateAt(0, 0));
  const invalidate = useRef<(() => void) | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loop, setLoop] = useState<'always' | 'demand'>('always');

  useEffect(() => {
    if (!animated) return;

    const measure = () => {
      const next = measureViewportBeat();
      state.current = next.state;
      const nextLoop = next.owns3d ? 'always' : 'demand';
      window.__HELIX_BEAT = next.state.activeIndex;
      window.__HELIX_LOOP = nextLoop;
      document.documentElement.dataset.helixLoop = nextLoop;
      document.documentElement.style.setProperty(
        '--daylight',
        daylight(next.state.progress).toFixed(4),
      );
      setLoop((prev) => (prev === nextLoop ? prev : nextLoop));
      setActiveIndex((prev) => (prev === next.state.activeIndex ? prev : next.state.activeIndex));
      invalidate.current?.();
    };

    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [animated]);

  return (
    <HelixDriverContext.Provider value={{ activeIndex, animated }}>
      {animated && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <Canvas
            frameloop={loop}
            shadows={quality === 'high' ? { type: PCFSoftShadowMap, enabled: true } : false}
            dpr={quality === 'low' ? [1, 1.4] : [1, 1.9]}
            camera={{ position: [-4.6, -2.35, 8.4], fov: 42, near: 0.1, far: 120 }}
            gl={{
              antialias: quality === 'high',
              alpha: false,
              powerPreference: 'high-performance',
              toneMapping: ACESFilmicToneMapping,
              outputColorSpace: SRGBColorSpace,
            }}
            onCreated={({ gl, invalidate: nextInvalidate }) => {
              gl.toneMappingExposure = 1.16;
              gl.setClearColor('#07090d', 1);
              invalidate.current = nextInvalidate;
            }}
            style={{ position: 'absolute', inset: 0, background: '#07090d' }}
          >
            <HelixScene state={state} tier={quality} />
            <FrameProbe />
          </Canvas>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </HelixDriverContext.Provider>
  );
}
