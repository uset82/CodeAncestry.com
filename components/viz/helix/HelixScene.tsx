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
  type Group,
  type InstancedMesh,
  type Mesh,
  type Points,
  type ShaderMaterial,
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
import { BASE_PAIR_TOKENS, TRACK_SEGMENTS, type BeatState } from './beats';
import { createStrandMaterial } from './StrandMaterial';

/* --------------------------------------------------------------- constants */

const ACID = new Color('#7ee7d7');
const CYAN = new Color('#70a5ff');
const VIOLET = new Color('#a99cf0');
const DIM = new Color('#20252d');
const AMBER = new Color('#f4c76b');

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
        /* Built twice: fully helical and fully flattened. Identical segment
           counts mean identical topology, so the flat form can ride along as a
           morph target and the unfolding happens on the GPU.

           This is the fix for the scene's central bug: `flatten` was hardcoded
           to 0 here and the geometry memoised on [quality], so the backbones
           never unfolded. The rungs and loci did, which left the loci drifting
           off the strands they are supposed to sit on at the final beat. */
        const build = (phase: number, flatten: number) => {
          const curve = new CatmullRomCurve3(
            sampleBackbone(spec, phase, quality.tubular, flatten),
            false,
            'catmullrom',
            0.5,
          );
          return new TubeGeometry(curve, quality.tubular, 0.028, quality.radial, false);
        };

        const withMorph = (phase: number) => {
          const helical = build(phase, 0);
          const flat = build(phase, 1);
          const flatPositions = flat.getAttribute('position');
          if (flatPositions) helical.morphAttributes.position = [flatPositions];
          return helical;
        };

        const a = withMorph(0);
        const b = withMorph(Math.PI);

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

  /* One rim-lit material per strand per side. Built here rather than inline so
     each mesh keeps a stable material instance whose uniforms can be advanced
     every frame. */
  const materials = useMemo(
    () =>
      strands.flatMap((strand) =>
        [0.62, 0.26].map((opacity) =>
          createStrandMaterial(
            strand.generation === 0 ? ACID : strand.origin ? VIOLET : CYAN,
            opacity,
          ),
        ),
      ),
    [strands],
  );

  useFrame(({ clock }) => {
    const current = state.current;
    if (!current) return;

    const time = clock.elapsedTime;

    strands.forEach((strand, i) => {
      // Each generation reveals as the beat counter passes it.
      const reveal = Math.min(1, Math.max(0, current.generations - strand.generation));
      const eased = reveal * reveal * (3 - 2 * reveal);

      for (let side = 0; side < 2; side += 1) {
        const mesh = group.current[i * 2 + side];
        if (!mesh) continue;
        mesh.visible = eased > 0.01;
        mesh.geometry.setDrawRange(0, Math.ceil(strand.indexCount * eased));
        // The unfold. Same value the rungs and loci read, so the three stay
        // locked together through the transformation.
        if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[0] = current.flatten;

        // Advance the rim shader through the mesh rather than the memoised
        // array, so nothing outside this frame's own scene graph is touched.
        const uniforms = (mesh.material as ShaderMaterial).uniforms;
        if (uniforms?.uTime) uniforms.uTime.value = time;
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
            material={materials[i * 2 + side]}
            /* Draw far strands first so the additive accumulation layers
               back-to-front and the near ones stay legible on top. */
            renderOrder={-strand.generation}
          />
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
      <cylinderGeometry args={[0.01, 0.01, 1, 6]} />
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
                className={`hover:border-current focus-visible:border-current inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-[3px] font-mono text-[9px] tracking-[0.14em] uppercase ${
                  anchor.label.mutated
                    ? 'border-violet/50 bg-violet/15 text-violet'
                    : 'border-acid/30 bg-void text-acid/90'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <span aria-hidden="true" className="size-[3px] rounded-full bg-current" />
                {anchor.label.short}
              </button>

              <div className="border-line bg-void pointer-events-none absolute top-full left-0 mt-1.5 hidden w-max max-w-[220px] rounded-sm border p-2 group-hover/locus:block group-focus-within/locus:block">
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

/* ------------------------------------------------------- base-pair tokens

   Beat 01. The camera moves in and the base pairs "reveal themselves as code
   abstractions" — the tokens listed in the report. They exist only while the
   camera is close, because at any other distance they are noise.
   ------------------------------------------------------------------------ */

function BasePairTokens({ state }: Pick<Props, 'state'>) {
  const origin = STRANDS[0] as (typeof STRANDS)[number];

  const anchors = useMemo(() => {
    const basis = strandBasis(origin);
    return BASE_PAIR_TOKENS.slice(0, 6).map((token, i) => {
      const t = (i + 0.5) / 6;
      return { token, t, direction: rungDirection(origin, basis, t) };
    });
  }, [origin]);

  const nodes = useRef<(HTMLDivElement | null)[]>([]);

  useFrame(() => {
    const current = state.current;
    if (!current) return;
    // Ramp in with focus, then out again as the track takes over.
    const shown = current.focus * (1 - current.stretch);
    anchors.forEach((_, i) => {
      const node = nodes.current[i];
      if (!node) return;
      node.style.opacity = String(Math.max(0, shown * 1.2 - 0.15));
      node.style.visibility = shown < 0.04 ? 'hidden' : 'visible';
    });
  });

  return (
    <>
      {anchors.map((anchor, i) => (
        <group
          key={anchor.token}
          position={axisPointAt(origin, anchor.t, 0).addScaledVector(
            anchor.direction,
            origin.radius * 1.5,
          )}
        >
          <Html center zIndexRange={[18, 0]} style={{ pointerEvents: 'none' }}>
            <div
              ref={(node) => {
                nodes.current[i] = node;
              }}
              className="text-acid/80 border-acid/25 bg-void/70 rounded-sm border px-1.5 py-[2px] font-mono text-[10px] opacity-0"
            >
              {anchor.token}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------- capability track

   Beat 02. The report asks the helix to "stretch into a horizontal genomic
   track". Rather than contorting the tube geometry, the strand recedes and a
   real track takes its place — the same construction the registry's genome
   browser draws, which is the point the beat is making.
   ------------------------------------------------------------------------ */

const TRACK_WIDTH = 6.4;

function CapabilityTrack({ state }: Pick<Props, 'state'>) {
  const group = useRef<Group>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const bars = useRef<InstancedMesh>(null);

  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      quaternion: new Quaternion(),
      scale: new Vector3(),
    }),
    [],
  );

  const segments = useMemo(
    () =>
      TRACK_SEGMENTS.map((segment, i) => {
        const width = TRACK_WIDTH / TRACK_SEGMENTS.length;
        const x = -TRACK_WIDTH / 2 + width * (i + 0.5);
        return { ...segment, x, width: width * 0.86 };
      }),
    [],
  );

  useFrame(() => {
    const current = state.current;
    if (!current) return;
    const shown = current.stretch;

    if (group.current) {
      group.current.visible = shown > 0.02;
      group.current.position.set(0, 1.5, 0);
    }

    const node = bars.current;
    if (node) {
      const { matrix, position, quaternion, scale } = scratch;
      segments.forEach((segment, i) => {
        // Segments arrive left to right as the track assembles.
        const stagger = Math.min(1, Math.max(0, shown * segments.length - i));
        position.set(segment.x, 1.5, 0);
        scale.set(segment.width * stagger, 0.11, 0.11);
        matrix.compose(position, quaternion, scale);
        node.setMatrixAt(i, matrix);
      });
      node.instanceMatrix.needsUpdate = true;
    }

    segments.forEach((_, i) => {
      const label = nodes.current[i];
      if (!label) return;
      const stagger = Math.min(1, Math.max(0, shown * segments.length - i));
      label.style.opacity = String(Math.max(0, stagger * 1.4 - 0.4));
      label.style.visibility = stagger < 0.05 ? 'hidden' : 'visible';
    });
  });

  return (
    <group ref={group}>
      <instancedMesh ref={bars} args={[undefined, undefined, segments.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={ACID} transparent opacity={0.75} toneMapped={false} />
      </instancedMesh>

      {segments.map((segment, i) => (
        <group key={segment.id} position={[segment.x, 1.24, 0]}>
          <Html center zIndexRange={[18, 0]} style={{ pointerEvents: 'none' }}>
            <div
              ref={(node) => {
                nodes.current[i] = node;
              }}
              className="text-acid/85 font-mono text-[9px] tracking-[0.14em] opacity-0"
            >
              {segment.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------ mutation markers

   Beat 04. The children change: a marker appears against the capability each
   descendant altered. Triangular, matching the mutation glyph used across the
   registry, so the same shape means the same thing everywhere.
   ------------------------------------------------------------------------ */

function MutationMarkers({ state }: Pick<Props, 'state'>) {
  const mesh = useRef<InstancedMesh>(null);

  const slots = useMemo(
    () =>
      STRANDS.filter((spec) => spec.generation > 0).map((spec, i) => {
        const basis = strandBasis(spec);
        const t = 0.34 + ((i * 0.17) % 0.4);
        return { spec, t, direction: rungDirection(spec, basis, t) };
      }),
    [],
  );

  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      quaternion: new Quaternion(),
      scale: new Vector3(),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const node = mesh.current;
    const current = state.current;
    if (!node || !current) return;

    const time = clock.elapsedTime;
    const { matrix, position, quaternion, scale } = scratch;

    slots.forEach((slot, i) => {
      const reveal = Math.min(1, Math.max(0, current.generations - slot.spec.generation));
      const stagger = Math.min(1, Math.max(0, current.mutate * slots.length - i * 0.6));
      position
        .copy(axisPointAt(slot.spec, slot.t, current.flatten))
        .addScaledVector(slot.direction, slot.spec.radius * 2.1 * (1 - current.flatten) + 0.12);

      const pulse = 1 + Math.sin(time * 2.6 + i) * 0.14;
      scale.setScalar(0.075 * stagger * reveal * pulse);
      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(i, matrix);
    });

    node.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, slots.length]} frustumCulled={false}>
      {/* A four-sided cone reads as a triangular marker from any angle. */}
      <coneGeometry args={[1, 1.6, 4]} />
      <meshBasicMaterial color={AMBER} toneMapped={false} />
    </instancedMesh>
  );
}

/* ----------------------------------------------------------- family field

   Beat 06. Pull back far enough that KEYLIT is one family among millions. A
   deterministic scatter of dim points — no randomness at runtime, so the field
   is identical on every load and never shimmers.
   ------------------------------------------------------------------------ */

const FIELD_COUNT = 220;

function FamilyField({ state, tier }: Props) {
  const mesh = useRef<InstancedMesh>(null);
  const quality = QUALITY[tier];
  const count = tier === 'low' ? 90 : FIELD_COUNT;

  const slots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // Golden-angle spiral: even coverage without clumping.
        const angle = i * 2.399963;
        const radius = 6 + Math.sqrt(i / count) * 26;
        return {
          position: new Vector3(
            Math.cos(angle) * radius,
            -6 + ((i * 7.13) % 19) - 6,
            Math.sin(angle) * radius - 6,
          ),
          seed: (i * 1.7) % (Math.PI * 2),
        };
      }),
    [count],
  );

  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      quaternion: new Quaternion(),
      scale: new Vector3(),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const node = mesh.current;
    const current = state.current;
    if (!node || !current) return;

    node.visible = current.zoomOut > 0.02;
    if (!node.visible) return;

    const time = clock.elapsedTime;
    const { matrix, quaternion, scale } = scratch;

    slots.forEach((slot, i) => {
      const twinkle = 0.75 + Math.sin(time * 0.6 + slot.seed) * 0.25;
      scale.setScalar(0.05 * current.zoomOut * twinkle);
      matrix.compose(slot.position, quaternion, scale);
      node.setMatrixAt(i, matrix);
    });

    node.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, Math.max(5, quality.sphere - 6), Math.max(5, quality.sphere - 6)]} />
      <meshBasicMaterial color={CYAN} transparent opacity={0.5} toneMapped={false} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------ atmosphere

   Report 11 asks for "subtle depth / particle movement". Without something
   suspended between the strands the scene has no sense of volume — the helix
   floats in a vacuum and every strand reads at the same distance.

   Deterministic positions, so the field is identical on every load and never
   shimmers between renders.
   ------------------------------------------------------------------------ */

function Atmosphere({ tier }: Pick<Props, 'tier'>) {
  const points = useRef<Points>(null);
  const count = tier === 'low' ? 120 : 320;

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      // Golden-angle spiral through a tall cylinder around the family.
      const angle = i * 2.399963;
      const radius = 1.5 + Math.sqrt((i % 97) / 97) * 11;
      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = 5 - ((i * 3.77) % 17);
      array[i * 3 + 2] = Math.sin(angle) * radius - 2;
    }
    return array;
  }, [count]);

  useFrame(({ clock }) => {
    const node = points.current;
    if (!node) return;
    // A slow drift, well under the threshold where it reads as "particles".
    node.rotation.y = clock.elapsedTime * 0.012;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={CYAN}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.32}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

/* --------------------------------------------------------------- camera */

/**
 * One rig, three superimposed movements.
 *
 * A base descent through the generations, blended toward a close dolly on a
 * single base pair while `focus` is up, then blended out to a wide field as
 * `zoomOut` takes over. Blending rather than switching means no cut.
 */
function CameraRig({ state }: { state: React.RefObject<BeatState> }) {
  const { camera } = useThree();
  const target = useMemo(() => new Vector3(0, 1.4, 0), []);
  const desired = useMemo(() => new Vector3(), []);
  const lookAt = useMemo(() => new Vector3(), []);
  const scratch = useMemo(() => ({ near: new Vector3(), far: new Vector3() }), []);

  useFrame((_, delta) => {
    const current = state.current;
    if (!current) return;
    const p = current.progress;

    /* 1 — the base descent */
    desired.set(
      Math.sin(p * Math.PI * 0.6) * 1.2,
      2.2 - p * 6.4,
      8.4 + p * 5.6 + current.flatten * 2.2,
    );
    lookAt.set(-p * 0.9, 1.6 - p * 6.2, 0);

    /* 2 — dolly in on one base pair */
    if (current.focus > 0.001) {
      scratch.near.set(1.5, 2.0, 2.5);
      desired.lerp(scratch.near, current.focus);
      lookAt.lerp(scratch.near.set(0, 2.0, 0), current.focus);
    }

    /* 3 — and pull all the way back out */
    if (current.zoomOut > 0.001) {
      scratch.far.set(0, -4, 30);
      desired.lerp(scratch.far, current.zoomOut);
      lookAt.lerp(scratch.far.set(0, -6, -4), current.zoomOut);
    }

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
      <Atmosphere tier={tier} />
      <Backbones state={state} tier={tier} />
      <Rungs state={state} />
      <Loci state={state} tier={tier} />
      <Pulses state={state} tier={tier} />
      <MutationMarkers state={state} />
      <FamilyField state={state} tier={tier} />
      {/* DOM overlays; skipped on low tier to keep small devices cheap. */}
      {tier === 'high' && (
        <>
          <LocusLabels state={state} />
          <BasePairTokens state={state} />
          <CapabilityTrack state={state} />
        </>
      )}
    </>
  );
}
