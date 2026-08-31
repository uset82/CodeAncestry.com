'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';
import dynamic from 'next/dynamic';
import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { useWebGL } from '@/lib/hooks/useWebGL';
import {
  BEATS,
  beatStateAt,
  daylight,
  lookXExtent,
  lookXForSide,
  measureViewportBeat,
  widthFit,
  type BeatSide,
  type BeatState,
} from './beats';
import { FAMILY_HALF_HEIGHT, FAMILY_LOOK_LIFT, grownFamilyY } from './strands';

const HERO_FOV = 42;

function bootCamera() {
  const lookX = lookXForSide('left');
  const lookY = grownFamilyY(1) + FAMILY_LOOK_LIFT;
  const z =
    (FAMILY_HALF_HEIGHT / Math.tan((HERO_FOV * Math.PI) / 360)) *
    BEATS[0]!.cameraMultiple *
    widthFit();
  return { lookX, lookY, z };
}

function initialBeatState(): BeatState {
  const base = beatStateAt(0, 0);
  if (typeof window === 'undefined') return base;
  return { ...base, lookX: lookXForSide('left', base.cameraMultiple), side: 'left' };
}

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
    __HELIX_SIDE?: BeatSide;
    __HELIX_LOOK_X?: number;
    __HELIX_CAM_Z?: number;
    /** Camera snaps this frame — hash jumps must not lerp across eight poses. */
    __HELIX_SNAP?: boolean;
    /**
     * CPU sweep cost. EMA in ms; `P95` over the last 120 frames; `N` samples
     * since the sweep was created; `VERTS` vertices written per frame.
     *
     * Published unconditionally, matching `__HELIX_CAM_Z` — three float stores
     * per frame. Only the HUD that *reads* them is gated.
     *
     * These are **sweep maths only**. The `bufferSubData` upload happens later
     * inside `gl.render` and is not in this number.
     */
    __HELIX_SWEEP_MS?: number;
    __HELIX_SWEEP_P95?: number;
    __HELIX_SWEEP_N?: number;
    __HELIX_SWEEP_VERTS?: number;
  }
}

/**
 * Normalised against the *live* extent, not a constant. The old denominator
 * was a fixed world-unit number, so as soon as the aim became distance-aware
 * the division produced 0.3 and the scrim faded out — precisely when the
 * specimen moved close enough to the copy to need it most.
 */
function paintScrim(node: HTMLDivElement, lookX: number, extent: number) {
  const span = extent || 1;
  const left = Math.max(0, -lookX / span);
  const right = Math.max(0, lookX / span);
  if (left < 0.02 && right < 0.02) {
    node.style.background = 'transparent';
    node.style.opacity = '0';
    return;
  }
  const toward = left >= right ? '90deg' : '270deg';
  node.style.background = `linear-gradient(${toward}, #07090d 0%, color-mix(in oklab, #07090d 88%, transparent) 34%, transparent 62%)`;
  node.style.opacity = String(Math.min(1, Math.max(left, right)));
}

function FrameProbe() {
  useFrame(() => {
    window.__HELIX_FRAMES = (window.__HELIX_FRAMES ?? 0) + 1;
  });
  return null;
}

/** Dev-only debug HUD for the sweep meter. See `SweepStatsProbe`. */
const SWEEP_HUD_ID = 'helix-sweep-hud';

/**
 * Writes the sweep meter into a plain DOM node outside the canvas.
 *
 * Plain DOM on purpose: the HUD must not be a React state update, or measuring
 * the helix would cost more than running it. Throttled to every 15 frames,
 * matching the `dataset` cadence.
 *
 * The node is looked up by id rather than handed over as a ref — the React
 * Compiler's immutability rule treats a ref passed as a prop as read-only, and
 * the whole point here is to write to it.
 */
function SweepStatsProbe() {
  const tick = useRef(0);
  useFrame(() => {
    tick.current += 1;
    if (tick.current % 15 !== 0) return;
    const el = document.getElementById(SWEEP_HUD_ID);
    if (!el) return;
    el.textContent =
      `sweep ${(window.__HELIX_SWEEP_MS ?? 0).toFixed(2)} ms` +
      ` · p95 ${(window.__HELIX_SWEEP_P95 ?? 0).toFixed(2)}` +
      ` · ${window.__HELIX_SWEEP_VERTS ?? 0} verts` +
      ` · n=${window.__HELIX_SWEEP_N ?? 0}`;
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

  const state = useRef<BeatState>(initialBeatState());
  const invalidate = useRef<(() => void) | null>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loop, setLoop] = useState<'always' | 'demand'>('always');
  const lastBeat = useRef(0);

  /* Dev-only, opt-in. Production never renders the node, so the probe is a
     null check per frame and nothing more. Lazily initialised: the query
     string is read once, and it is read during render because the alternative
     is a setState in an effect, which costs a second pass for a debug flag. */
  const [showSweepStats] = useState(
    () =>
      process.env.NODE_ENV !== 'production' &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('sweepStats') === '1',
  );

  useLayoutEffect(() => {
    if (!animated) return;

    const measure = () => {
      const next = measureViewportBeat();
      const forced = Number(new URLSearchParams(window.location.search).get('converge'));
      const nextState =
        Number.isFinite(forced) && window.location.search.includes('converge=')
          ? { ...next.state, converge: Math.min(1, Math.max(0, forced)) }
          : next.state;
      /* Instant hash scroll updates the pose in one measure. The camera must
         snap or the specimen tells the previous beat for half a second. */
      if (Math.abs(nextState.activeIndex - lastBeat.current) > 1) {
        window.__HELIX_SNAP = true;
      }
      lastBeat.current = nextState.activeIndex;
      state.current = nextState;
      const nextLoop = next.owns3d ? 'always' : 'demand';
      window.__HELIX_BEAT = nextState.activeIndex;
      window.__HELIX_SIDE = nextState.side;
      window.__HELIX_LOOK_X = nextState.lookX;
      window.__HELIX_LOOP = nextLoop;
      document.documentElement.dataset.helixLoop = nextLoop;
      document.documentElement.dataset.helixSide = nextState.side;
      document.documentElement.style.setProperty(
        '--daylight',
        daylight(nextState.progress).toFixed(4),
      );
      if (scrim.current) {
        paintScrim(scrim.current, nextState.lookX, lookXExtent(nextState.cameraMultiple));
      }
      setLoop((prev) => (prev === nextLoop ? prev : nextLoop));
      setActiveIndex((prev) => (prev === nextState.activeIndex ? prev : nextState.activeIndex));
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

  const boot = bootCamera();

  return (
    <HelixDriverContext.Provider value={{ activeIndex, animated }}>
      {animated && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <Canvas
            frameloop={loop}
            shadows={quality === 'high' ? { type: PCFSoftShadowMap, enabled: true } : false}
            dpr={quality === 'low' ? [1, 1.4] : [1, 1.9]}
            camera={{
              position: [boot.lookX, boot.lookY, boot.z],
              fov: HERO_FOV,
              near: 0.1,
              far: 120,
            }}
            gl={{
              antialias: quality === 'high',
              alpha: false,
              powerPreference: 'high-performance',
              toneMapping: ACESFilmicToneMapping,
              outputColorSpace: SRGBColorSpace,
            }}
            onCreated={({ gl, camera, invalidate: nextInvalidate }) => {
              const boot = bootCamera();
              camera.position.set(boot.lookX, boot.lookY, boot.z);
              camera.lookAt(boot.lookX, boot.lookY, 0);
              gl.toneMappingExposure = 1.16;
              gl.setClearColor('#07090d', 1);
              invalidate.current = nextInvalidate;
            }}
            style={{ position: 'absolute', inset: 0, background: '#07090d' }}
          >
            <HelixScene state={state} tier={quality} />
            <FrameProbe />
            <SweepStatsProbe />
          </Canvas>
        </div>
      )}
      {animated && (
        <div
          ref={scrim}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[1]"
        />
      )}
      {animated && showSweepStats && (
        <div
          id={SWEEP_HUD_ID}
          aria-hidden="true"
          className="text-faint pointer-events-none fixed bottom-3 left-3 z-50 font-mono text-[11px] leading-tight"
        />
      )}
      <div className="relative z-10">{children}</div>
    </HelixDriverContext.Provider>
  );
}
