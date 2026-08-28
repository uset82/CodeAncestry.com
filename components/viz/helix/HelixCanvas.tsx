'use client';

import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import { HelixScene } from './HelixScene';
import type { BeatState } from './beats';

/**
 * The R3F canvas, isolated behind its own module.
 *
 * `HelixHero` loads this with `dynamic({ ssr: false })`, which keeps
 * `@react-three/fiber` — and transitively all of three.js — out of the
 * homepage bundle for every visitor who only ever sees the SVG fallback.
 *
 * Post-processing is deliberately restrained. The Nightglass audit flags
 * "neon glow balls", and report 11 asks for a scientific-futuristic system
 * rather than cyberpunk, so bloom runs at a high luminance threshold and low
 * intensity: it lifts the loci and the brightest strand edges, and leaves the
 * dim ones alone. It is depth and falloff doing the work, not a glow filter.
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

      {/* Skipped entirely on the low tier — an extra full-screen pass is the
          last thing a modest GPU needs. */}
      {tier === 'high' && (
        <EffectComposer enableNormalPass={false}>
          <Bloom
            intensity={0.62}
            luminanceThreshold={0.42}
            luminanceSmoothing={0.35}
            kernelSize={KernelSize.LARGE}
            mipmapBlur
          />
          {/* Darkens the corners just enough to seat the helix in space and
              stop the panel edge reading as a hard cut. */}
          <Vignette offset={0.32} darkness={0.55} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
