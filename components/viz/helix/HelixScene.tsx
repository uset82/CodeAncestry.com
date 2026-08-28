'use client';

import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  CatmullRomCurve3,
  Color,
  Matrix4,
  Quaternion,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type InstancedMesh,
  type Mesh,
} from 'three';
import {
  LOCUS_LABELS,
  STRANDS,
  STRANDS_BY_ID,
  UPSTREAM_PATH,
  axisPointAt,
  rungDirection,
  sampleBackbone,
  strandBasis,
} from './strands';
import type { BeatState } from './beats';

/* --------------------------------------------------------------- constants */

const ACID = new Color('#b7ff39');
const CYAN = new Color('#63e7ff');
const VIOLET = new Color('#a985ff');
const DIM = new Color('#1d2735');

const RUNGS_PER_STRAND = 9;
const UPSTREAM_PULSES = 3;

type Quality = { tubular: number; radial: number; sphere: number };

const QUALITY: Record<'low' | 'high', Quality> = {
  low: { tubular: 40, radial: 3, sphere: 8 },
  high: { tubular: 96, radial: 6, sphere: 14 },
};

type Props = {
  state: React.RefObject<BeatState>;
  tier: 'low' | 'high';
};

/* ------------------------------------------------------------- backbones */

type StrandGeometry = {
  id: string;
  generation: number;
  origin: boolean;
  geometries: [BufferGeometry, BufferGeometry];
  /** Full index count, for the drawRange growth reveal. */
  indexCount: number;
  curve: CatmullRomCurve3;
};

function Backbones({ state, tier }: Props) {
  const quality = QUALITY[tier];

  const strands = useMemo<StrandGeometry[]>(
    () =>
      STRANDS.map((spec) => {
        const build = (phase: number) => {
          const curve = new CatmullRomCurve3(
            sampleBackbone(spec, phase, quality.tubular, 0),
            false,
            'catmullrom',
            0.5,
          );
          return new TubeGeometry(curve, quality.tubular, 0.028, quality.radial, false);
        };

        const a = build(0);
        const b = build(Math.PI);

        return {
          id: spec.id,
          generation: spec.generation,
          origin: spec.origin ?? false,
          geometries: [a, b] as [BufferGeometry, BufferGeometry],
          indexCount: a.index?.count ?? 0,
          curve: new CatmullRomCurve3(
            sampleBackbone(spec, 0, Math.min(24, quality.tubular), 0),
            false,
          ),
        };
      }),
    [quality],
  );

  const group = useRef<Mesh[]>([]);

  useFrame(() => {
    const current = state.current;
    if (!current) return;

    strands.forEach((strand, i) => {
      // Each generation reveals as the beat counter passes it.
      const reveal = Math.min(1, Math.max(0, current.generations - strand.generation));
      const eased = reveal * reveal * (3 - 2 * reveal);

      for (let side = 0; side < 2; side += 1) {
        const mesh = group.current[i * 2 + side];
        if (!mesh) continue;
        mesh.visible = eased > 0.01;
        mesh.geometry.setDrawRange(0, Math.ceil(strand.indexCount * eased));
      }
    });
  });

  return (
    <>
      {strands.map((strand, i) =>
        strand.geometries.map((geometry, side) => (
          <mesh
            key={`${strand.id}-${side}`}
            ref={(node) => {
              if (node) group.current[i * 2 + side] = node;
            }}
            geometry={geometry}
          >
            <meshBasicMaterial
              color={strand.generation === 0 ? ACID : strand.origin ? VIOLET : CYAN}
              transparent
              opacity={side === 0 ? 0.62 : 0.26}
              toneMapped={false}
            />
          </mesh>
        )),
      )}
    </>
  );
}

/* ----------------------------------------------------------------- rungs */

/** Base pairs: short bars spanning the helix diameter, one per turn segment. */
function Rungs({ state }: Pick<Props, 'state'>) {
  const mesh = useRef<InstancedMesh>(null);
  const total = STRANDS.length * RUNGS_PER_STRAND;

  const slots = useMemo(
    () =>
      STRANDS.flatMap((spec) => {
        const basis = strandBasis(spec);
        return Array.from({ length: RUNGS_PER_STRAND }, (_, i) => {
          const t = (i + 0.5) / RUNGS_PER_STRAND;
          return { spec, t, direction: rungDirection(spec, basis, t) };
        });
      }),
    [],
  );

  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      quaternion: new Quaternion(),
      scale: new Vector3(),
      up: new Vector3(0, 1, 0),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const node = mesh.current;
    const current = state.current;
    if (!node || !current) return;

    const time = clock.elapsedTime;

    slots.forEach((slot, i) => {
      const reveal = Math.min(1, Math.max(0, current.generations - slot.spec.generation));
      const { matrix, position, quaternion, scale, up } = scratch;

      position.copy(axisPointAt(slot.spec, slot.t, current.flatten));
      // The bar's own Y axis becomes the radial direction of the helix.
      quaternion.setFromUnitVectors(up, slot.direction);

      // Rungs breathe gently while idle, then hold still once flattened.
      const breathe = 1 + Math.sin(time * 1.1 + i * 0.7) * 0.06 * (1 - current.flatten);
      const span = slot.spec.radius * 2 * (1 - current.flatten) * breathe;
      scale.set(1, span, 1).multiplyScalar(reveal);

      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(i, matrix);
    });

    node.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, total]} frustumCulled={false}>
      <cylinderGeometry args={[0.009, 0.009, 1, 4]} />
      <meshBasicMaterial color={DIM} transparent opacity={0.95} toneMapped={false} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ loci */

function Loci({ state, tier }: Props) {
  const mesh = useRef<InstancedMesh>(null);
  const quality = QUALITY[tier];

  const slots = useMemo(
    () =>
      STRANDS.flatMap((spec) => {
        const basis = strandBasis(spec);
        return Array.from({ length: spec.loci }, (_, i) => {
          const t = (i + 0.5) / spec.loci;
          return {
            spec,
            t,
            direction: rungDirection(spec, basis, t),
            /** The locus that carries the discovered mutation. */
            mutated: (spec.origin ?? false) && i === spec.loci - 2,
            // Deterministic phase offset so the pulse is not synchronised.
            seed: (i * 2.399963 + spec.generation * 0.7) % (Math.PI * 2),
          };
        });
      }),
    [],
  );

  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      quaternion: new Quaternion(),
      scale: new Vector3(),
      color: new Color(),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const node = mesh.current;
    const current = state.current;
    if (!node || !current) return;

    const time = clock.elapsedTime;

    slots.forEach((slot, i) => {
      const reveal = Math.min(1, Math.max(0, current.generations - slot.spec.generation));
      const { matrix, position, quaternion, scale, color } = scratch;

      // Loci ride on the backbone itself, the way genes sit on a chromosome.
      position
        .copy(axisPointAt(slot.spec, slot.t, current.flatten))
        .addScaledVector(slot.direction, slot.spec.radius * (1 - current.flatten));

      const pulse = 1 + Math.sin(time * 2 + slot.seed) * 0.16;
      const emphasis = slot.mutated ? 1.7 + current.upstream * 0.6 : 1;
      const size = 0.055 * pulse * emphasis * reveal;
      scale.setScalar(size);

      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(i, matrix);

      if (slot.mutated) {
        color.copy(VIOLET);
      } else if (slot.spec.generation === 0) {
        color.copy(ACID).lerp(CYAN, 0.25);
      } else {
        color.copy(CYAN).lerp(DIM, 0.45 - current.inheritance * 0.4);
      }
      node.setColorAt(i, color);
    });

    node.instanceMatrix.needsUpdate = true;
    if (node.instanceColor) node.instanceColor.needsUpdate = true;
  });

  const total = slots.length;

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, total]} frustumCulled={false}>
      <sphereGeometry args={[1, quality.sphere, quality.sphere]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* --------------------------------------------------------- locus labels */

/**
 * Semantic labels anchored to the loci, rendered as real DOM so they stay crisp,
 * selectable and reachable by keyboard. Hovering or focusing one reveals the
 * capability name and where it originated.
 */
function LocusLabels({ state }: Pick<Props, 'state'>) {
  const anchors = useMemo(
    () =>
      LOCUS_LABELS.flatMap((label) => {
        const spec = STRANDS_BY_ID.get(label.strand);
        if (!spec) return [];
        const basis = strandBasis(spec);
        const t = (label.index + 0.5) / spec.loci;
        return [{ label, spec, t, direction: rungDirection(spec, basis, t) }];
      }),
    [],
  );

  const groups = useRef<(HTMLDivElement | null)[]>([]);

  useFrame(() => {
    const current = state.current;
    if (!current) return;

    anchors.forEach((anchor, i) => {
      const node = groups.current[i];
      if (!node) return;

      const reveal = Math.min(1, Math.max(0, current.generations - anchor.spec.generation));
      // Labels arrive after their strand has drawn itself in.
      const opacity = Math.max(0, reveal * 2 - 1);
      node.style.opacity = String(opacity);
      node.style.visibility = opacity < 0.02 ? 'hidden' : 'visible';
    });
  });

  return (
    <>
      {anchors.map((anchor, i) => (
        <group
          key={`${anchor.label.strand}-${anchor.label.index}`}
          position={axisPointAt(anchor.spec, anchor.t, 0).addScaledVector(
            anchor.direction,
            anchor.spec.radius * 1.9,
          )}
        >
          <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div
              ref={(node) => {
                groups.current[i] = node;
              }}
              className="group/locus relative w-max -translate-y-1/2 opacity-0 transition-opacity duration-300"
            >
              <button
                type="button"
                className={`hover:border-current focus-visible:border-current inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-[3px] font-mono text-[9px] tracking-[0.14em] uppercase backdrop-blur-sm ${
                  anchor.label.mutated
                    ? 'border-violet/50 bg-violet/15 text-violet'
                    : 'border-acid/30 bg-void/70 text-acid/90'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <span aria-hidden="true" className="size-[3px] rounded-full bg-current" />
                {anchor.label.short}
              </button>

              <div className="border-line bg-void/95 pointer-events-none absolute top-full left-0 mt-1.5 hidden w-max max-w-[220px] rounded-sm border p-2 group-hover/locus:block group-focus-within/locus:block">
                <p className="text-text text-[12px] font-semibold">{anchor.label.gene}</p>
                <p className="text-faint mt-0.5 text-[11px]">{anchor.label.origin}</p>
                <p className="text-muted mt-1 font-mono text-[10px]">{anchor.label.accession}</p>
              </div>
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}

/* --------------------------------------------------------------- pulses */

/**
 * Semantic motion: a travelling dot means information was transmitted. Cyan
 * moves down the tree (inheritance), violet moves up it (a descendant offering
 * something back to its ancestors).
 */
function Pulses({ state, tier }: Props) {
  const down = useRef<InstancedMesh>(null);
  const up = useRef<InstancedMesh>(null);
  const quality = QUALITY[tier];

  const downCurves = useMemo(
    () =>
      STRANDS.filter((spec) => spec.generation > 0).map(
        (spec) =>
          new CatmullRomCurve3(
            sampleBackbone(spec, 0, tier === 'low' ? 16 : 32, 0.35),
            false,
          ),
      ),
    [tier],
  );

  const upCurve = useMemo(() => {
    const points: Vector3[] = [];
    for (const id of UPSTREAM_PATH) {
      const spec = STRANDS.find((s) => s.id === id);
      if (!spec) continue;
      // Walk each strand from its end back toward its start.
      points.push(spec.end.clone(), spec.start.clone());
    }
    return new CatmullRomCurve3(points, false);
  }, []);

  const scratch = useMemo(
    () => ({ matrix: new Matrix4(), position: new Vector3(), quaternion: new Quaternion(), scale: new Vector3() }),
    [],
  );

  useFrame(({ clock }) => {
    const current = state.current;
    if (!current) return;
    const time = clock.elapsedTime;
    const { matrix, position, quaternion, scale } = scratch;

    const downNode = down.current;
    if (downNode) {
      downCurves.forEach((curve, i) => {
        const t = (time * 0.34 + i * 0.21) % 1;
        curve.getPointAt(t, position);
        // Fade in at both ends so pulses do not pop.
        const edge = Math.min(1, Math.min(t, 1 - t) * 7);
        scale.setScalar(0.036 * edge * current.inheritance);
        matrix.compose(position, quaternion, scale);
        downNode.setMatrixAt(i, matrix);
      });
      downNode.instanceMatrix.needsUpdate = true;
    }

    const upNode = up.current;
    if (upNode) {
      for (let i = 0; i < UPSTREAM_PULSES; i += 1) {
        const t = (time * 0.2 + i / UPSTREAM_PULSES) % 1;
        upCurve.getPointAt(t, position);
        const edge = Math.min(1, Math.min(t, 1 - t) * 5);
        scale.setScalar(0.062 * edge * current.upstream);
        matrix.compose(position, quaternion, scale);
        upNode.setMatrixAt(i, matrix);
      }
      upNode.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh
        ref={down}
        args={[undefined, undefined, Math.max(1, downCurves.length)]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, quality.sphere, quality.sphere]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </instancedMesh>

      <instancedMesh ref={up} args={[undefined, undefined, UPSTREAM_PULSES]} frustumCulled={false}>
        <sphereGeometry args={[1, quality.sphere, quality.sphere]} />
        <meshBasicMaterial color={VIOLET} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

/* --------------------------------------------------------------- camera */

/** Descends through the generations as the reader scrolls. */
function CameraRig({ state }: { state: React.RefObject<BeatState> }) {
  const { camera } = useThree();
  const target = useMemo(() => new Vector3(0, 1.4, 0), []);
  const desired = useMemo(() => new Vector3(), []);
  const lookAt = useMemo(() => new Vector3(), []);

  useFrame((_, delta) => {
    const current = state.current;
    if (!current) return;
    const p = current.progress;

    desired.set(
      Math.sin(p * Math.PI * 0.6) * 1.2,
      2.2 - p * 6.4,
      8.4 + p * 5.6 + current.flatten * 2.2,
    );
    lookAt.set(-p * 0.9, 1.6 - p * 6.2, 0);

    const lerp = Math.min(1, delta * 3.2);
    camera.position.lerp(desired, lerp);
    target.lerp(lookAt, lerp);
    camera.lookAt(target);
  });

  return null;
}

/* --------------------------------------------------------------- export */

export function HelixScene({ state, tier }: Props) {
  return (
    <>
      <CameraRig state={state} />
      <Backbones state={state} tier={tier} />
      <Rungs state={state} />
      <Loci state={state} tier={tier} />
      <Pulses state={state} tier={tier} />
      {/* Labels are DOM overlays; skipping them on low tier keeps mobile cheap. */}
      {tier === 'high' && <LocusLabels state={state} />}
    </>
  );
}
