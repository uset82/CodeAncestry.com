'use client';

import { Canvas } from '@react-three/fiber';
import { HelixScene } from './HelixScene';
import type { BeatState } from './beats';

/**
 * The R3F canvas, isolated behind its own module.
 *
 * `HelixHero` loads this with `dynamic({ ssr: false })`, which keeps
 * `@react-three/fiber` — and transitively all of three.js — out of the
 * homepage bundle for every visitor who only ever sees the SVG fallback.
 * Previously `Canvas` was a static import and shipped to everyone.
 */
export function HelixCanvas({
  tier,
  state,
}: {
  tier: 'low' | 'high';
  state: React.RefObject<BeatState>;
}) {
  return (
    <Canvas
      dpr={tier === 'low' ? [1, 1.4] : [1, 1.9]}
      camera={{ position: [0, 2.2, 8.4], fov: 42, near: 0.1, far: 100 }}
      gl={{ antialias: tier === 'high', alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <HelixScene state={state} tier={tier} />
    </Canvas>
  );
}
