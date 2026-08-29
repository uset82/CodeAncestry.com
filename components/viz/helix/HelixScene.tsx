'use client';

import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
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
  type MeshStandardMaterial,
} from 'three';
import {
  LOCUS_LABELS,
  STRANDS,
  STRANDS_BY_ID,
  UPSTREAM_PATH,
  axisPointAtInto,
  backbonePointAtInto,
  GROWTH_JITTER,
  growthAlong,
  pathTaper,
  rungDirection,
  rungInset,
  startTaperWidth,
  sampleBackbone,
  strandBasis,
  strandEased,
} from './strands';
import { cameraProgress, climaxAmount, daylight, holdProgress, type BeatState } from './beats';
import {
  climaxEmissive,
  depthMaterialOf,
  patchGrowingMaterial,
  syncOrganic,
  tickClimax,
  tickOrganic,
} from './organic';
import {
  HELIX,
  StudioRig,
  backboneMaterial,
  createHelixMaterials,
  disposeHelixMaterials,
  type HelixMaterials,
} from './studio';

/* Scratch for the per-mesh axis sync below. Safe to share: onBeforeRender runs
   synchronously and the values are consumed before the next call. */
const AXIS_A = new Vector3();
const AXIS_B = new Vector3();

/* The extent of the whole lineage, measured from the strands rather than typed
   in, so moving a branch cannot silently crop the closing frame. */
const FAMILY_TOP = Math.max(...STRANDS.map((s) => Math.max(s.start.y, s.end.y)));
const FAMILY_BOTTOM = Math.min(...STRANDS.map((s) => Math.min(s.start.y, s.end.y)));
const FAMILY_Y = (FAMILY_TOP + FAMILY_BOTTOM) / 2;
/**
 * Half the height the reveal has to cover: the family plus a quarter of margin.
 *
 * A tenth was not enough. The sticky header sits over the top 8% of the frame,
 * so a crown placed 5% from the top edge lands underneath it, and the trunk —
 * the one strand the whole story starts from — was the part being clipped.
 */
const FAMILY_HALF_HEIGHT = ((FAMILY_TOP - FAMILY_BOTTOM) * 1.26) / 2;
/** Aim above centre so the extra margin lands at the top, under the header. */
const FAMILY_LOOK_LIFT = 0.8;

const RUNGS_PER_STRAND = 24;
const UPSTREAM_PULSES = 3;

type Quality = { tubular: number; radial: number; radius: number; sphere: number };

const QUALITY: Record<'low' | 'high', Quality> = {
  low: { tubular: 48, radial: 5, radius: 0.034, sphere: 10 },
  high: { tubular: 96, radial: 8, radius: 0.04, sphere: 12 },
};

type Props = {
  state: React.RefObject<BeatState>;
  tier: 'low' | 'high';
  materials: HelixMaterials;
  pointer: React.RefObject<{ x: number; y: number }>;
};

type StrandGeometry = {
  spec: (typeof STRANDS)[number];
  origin: boolean;
  geometries: [BufferGeometry, BufferGeometry];
  curve: CatmullRomCurve3;
  material: MeshStandardMaterial;
};

function OrganicTicker({
  materials,
  pointer,
  drift,
  state,
}: {
  materials: HelixMaterials;
  pointer: React.RefObject<{ x: number; y: number }>;
  drift: number;
  state: React.RefObject<BeatState>;
}) {
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const current = state.current;
    const climax = current ? climaxAmount(current) : 0;

    tickOrganic(materials.backboneOrigin, time, drift, pointer.current);
    tickOrganic(materials.backboneMutated, time, drift, pointer.current);
    tickOrganic(materials.backboneDescendant, time, drift, pointer.current);
    tickClimax(materials, climax, daylight(current?.progress ?? 0));
  });

  return null;
}

/* ------------------------------------------------------------- backbones */

function Backbones({ state, tier, materials, pointer }: Props) {
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
          return new TubeGeometry(curve, quality.tubular, quality.radius, quality.radial, false);
        };

        const role = backboneMaterial(materials, spec.generation, spec.origin ?? false);
        const material = role.clone();
        patchGrowingMaterial(
          material,
          spec.id,
          spec.generation === 0 ? HELIX.acid : spec.origin ? HELIX.violet : HELIX.cyan,
        );

        return {
          spec,
          origin: spec.origin ?? false,
          geometries: [build(0), build(Math.PI)] as [BufferGeometry, BufferGeometry],
          curve: new CatmullRomCurve3(
            sampleBackbone(spec, 0, Math.min(24, quality.tubular), 0),
            false,
          ),
          material,
        };
      }),
    [quality, materials],
  );

  useEffect(() => {
    return () => {
      strands.forEach((strand) => {
        strand.geometries[0].dispose();
        strand.geometries[1].dispose();
        strand.material.userData.depthMaterial?.dispose?.();
        strand.material.dispose();
      });
    };
  }, [strands]);

  const group = useRef<Mesh[]>([]);
  const shells = tier === 'high' ? [0, 1, 2] : [0];
  const shellCount = shells.length;

  useFrame(({ clock }) => {
    const current = state.current;
    if (!current) return;
    const time = clock.elapsedTime;

    const climax = climaxAmount(current);

    strands.forEach((strand, i) => {
      const eased = strandEased(current.generations, strand.spec.generation);
      tickOrganic(strand.material, time, tier === 'high' ? 1 : 0, pointer.current);
      strand.material.emissiveIntensity = climaxEmissive(
        strand.spec.generation,
        strand.origin,
        climax,
        daylight(current.progress),
      );
      const visible = eased > 0.012;
      for (let side = 0; side < 2; side += 1) {
        for (let shell = 0; shell < shellCount; shell += 1) {
          const mesh = group.current[i * 2 * shellCount + side * shellCount + shell];
          if (!mesh) continue;
          mesh.visible = visible;
        }
      }
    });
  });

  return (
    <>
      {strands.map((strand, i) =>
        strand.geometries.map((geometry, side) =>
          shells.map((shell) => (
            <mesh
              key={`${strand.spec.id}-${side}-${shell}`}
              ref={(node) => {
                if (node) group.current[i * 2 * shellCount + side * shellCount + shell] = node;
              }}
              geometry={geometry}
              material={strand.material}
              customDepthMaterial={depthMaterialOf(strand.material)}
              castShadow={shell === 0}
              onBeforeRender={() => {
                const current = state.current;
                if (!current) return;
                /* The axis handed to the shader has to be the SAME axis every
                   other element collapses onto. `axisPointAtInto` additionally
                   squashes depth by `1 - flatten * 0.85`; passing the raw
                   start/end here meant the tubes collapsed toward a line at full
                   Z while the rungs, loci and labels collapsed toward a line at
                   z * 0.388 — so the dots visibly came off their strands on the
                   closing beat. */
                axisPointAtInto(strand.spec, 0, current.flatten, AXIS_A);
                axisPointAtInto(strand.spec, 1, current.flatten, AXIS_B);
                syncOrganic(strand.material, {
                  grow: strandEased(current.generations, strand.spec.generation),
                  flatten: current.flatten,
                  start: AXIS_A,
                  end: AXIS_B,
                  startTaper: startTaperWidth(strand.spec.generation),
                  seed: strand.spec.seed,
                  shell,
                });
              }}
            />
          )),
        ),
      )}
      <GrowingTips strands={strands} state={state} materials={materials} />
    </>
  );
}

function GrowingTips({
  strands,
  state,
  materials,
}: {
  strands: StrandGeometry[];
  state: React.RefObject<BeatState>;
  materials: HelixMaterials;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const scratch = useMemo(
    () => ({
      matrix: new Matrix4(),
      position: new Vector3(),
      axis: new Vector3(),
      quaternion: new Quaternion(),
      scale: new Vector3(),
    }),
    [],
  );

  useFrame(() => {
    const node = mesh.current;
    const current = state.current;
    if (!node || !current) return;
    const { matrix, position, axis, quaternion, scale } = scratch;

    strands.forEach((strand, i) => {
      /* Half the jitter, not the full width: the tip marker belongs at the
         frontier, but the frontier is a noise field, so sitting exactly on its
         mean leaves it floating wherever the noise has pulled the tube back. */
      const eased =
        strandEased(current.generations, strand.spec.generation) - GROWTH_JITTER * 0.5;
      const t = Math.min(0.999, Math.max(0, eased));
      strand.curve.getPoint(t, position);
      axisPointAtInto(strand.spec, t, current.flatten, axis);
      /* Follow the tube as it tapers onto the axis, then as flatten collapses
         the whole strand. Otherwise the tip sits on the full-radius helix
         while the backbone has already closed to a point. */
      const taper = pathTaper(t, eased, startTaperWidth(strand.spec.generation));
      position.lerp(axis, 1 - taper * (1 - current.flatten));
      const growing = eased > 0.03 && eased < 0.985;
      const settled = eased >= 0.985 ? 0.046 : 0;
      scale.setScalar(growing ? 0.068 : settled);
      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(i, matrix);
    });

    node.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, strands.length]}
      frustumCulled={false}
      material={materials.locus}
    >
      <sphereGeometry args={[1, 12, 12]} />
    </instancedMesh>
  );
}

/* ----------------------------------------------------------------- rungs */

function Rungs({ state, materials }: Pick<Props, 'state' | 'materials'>) {
  const mesh = useRef<InstancedMesh>(null);
  const total = STRANDS.length * RUNGS_PER_STRAND;

  const slots = useMemo(
    () =>
      STRANDS.flatMap((spec) => {
        const basis = strandBasis(spec);
        return Array.from({ length: RUNGS_PER_STRAND }, (_, i) => {
          const inset = rungInset(spec.generation);
          const t =
            inset.start + ((i + 0.5) / RUNGS_PER_STRAND) * (1 - inset.start - inset.end);
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
      /* Trail the frontier by its full jitter. The tube's growth front is a
         noise field now, so on any given rung the backbone may have pulled back
         by up to half of GROWTH_JITTER; a rung using the mean would sit on a
         stretch of strand that is not there yet. That is the floating dash,
         reintroduced by the back door. */
      const eased = strandEased(current.generations, slot.spec.generation) - GROWTH_JITTER;
      const front = growthAlong(eased, slot.t);
      const { matrix, position, quaternion, scale, up } = scratch;

      axisPointAtInto(slot.spec, slot.t, current.flatten, position);
      quaternion.setFromUnitVectors(up, slot.direction);

      const breathe = 1 + Math.sin(time * 1.1 + i * 0.7) * 0.06 * (1 - current.flatten);
      const span = slot.spec.radius * 2 * (1 - current.flatten * 0.4) * breathe;
      /* Same end / growth profile as the tube. A full-width rung on a
         needle-thin backbone is the floating dash at every terminus. */
      const taper = pathTaper(slot.t, eased, startTaperWidth(slot.spec.generation));
      scale.set(1, span * front * taper, 1);

      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(i, matrix);
    });

    node.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, total]}
      frustumCulled={false}
      material={materials.rung}
      castShadow
    >
      <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ loci */

function Loci({ state, tier, materials }: Props) {
  const mesh = useRef<InstancedMesh>(null);
  const quality = QUALITY[tier];

  const slots = useMemo(
    () =>
      STRANDS.flatMap((spec) => {
        const basis = strandBasis(spec);
        const genes = Array.from({ length: spec.loci }, (_, i) => {
          const t = (i + 0.5) / spec.loci;
          return {
            spec,
            t,
            direction: rungDirection(spec, basis, t),
            mutated: (spec.origin ?? false) && i === spec.loci - 2,
            seed: (i * 2.399963 + spec.generation * 0.7) % (Math.PI * 2),
            kind: 'gene' as const,
          };
        });
        const junctions = ([0, 1] as const).map((t) => ({
          spec,
          t,
          direction: rungDirection(spec, basis, t),
          mutated: false,
          seed: t * 4.1 + spec.generation,
          kind: 'junction' as const,
        }));
        return [...junctions, ...genes];
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
      const eased = strandEased(current.generations, slot.spec.generation);
      const front = growthAlong(eased, slot.t);
      const { matrix, position, quaternion, scale, color } = scratch;

      axisPointAtInto(slot.spec, slot.t, current.flatten, position);
      if (slot.kind === 'gene') {
        position.addScaledVector(slot.direction, slot.spec.radius * (1 - current.flatten));
      }

      const pulse = 1 + Math.sin(time * 2 + slot.seed) * (slot.kind === 'junction' ? 0.06 : 0.16);
      const terminal = slot.kind === 'junction' && slot.t === 1;
      const emphasis = slot.mutated
        ? 1.7 + current.upstream * 0.6
        : terminal
          ? 1.7
          : slot.kind === 'junction'
            ? 1.25
            : 1;
      /* Loci grow as the helix flattens. The closing beat collapses the
         structure toward a line, which sheds visual mass exactly where the
         story peaks; the nodes carrying that mass have to compensate. */
      const bulk = 1 + current.flatten * 0.5;
      const size =
        (slot.kind === 'junction' ? 0.072 : 0.055) * pulse * emphasis * front * bulk;
      scale.setScalar(size);

      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(i, matrix);

      if (slot.mutated) {
        color.copy(HELIX.violet);
      } else if (slot.spec.generation === 0) {
        color.copy(HELIX.acid).lerp(HELIX.cyan, slot.kind === 'junction' ? 0.08 : 0.22);
      } else {
        color.copy(HELIX.cyan).lerp(HELIX.dim, 0.42 - current.inheritance * 0.36);
      }
      if (terminal) color.lerp(HELIX.acid, 0.28);
      node.setColorAt(i, color);
    });

    node.instanceMatrix.needsUpdate = true;
    if (node.instanceColor) node.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, slots.length]}
      frustumCulled={false}
      material={materials.locus}
    >
      <sphereGeometry args={[1, quality.sphere, quality.sphere]} />
    </instancedMesh>
  );
}

/* --------------------------------------------------------- locus labels */

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
  const frames = useRef<(Group | null)[]>([]);
  const lastOpacity = useRef<number[]>([]);
  const scratch = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const current = state.current;
    if (!current) return;

    anchors.forEach((anchor, i) => {
      const node = groups.current[i];
      const frame = frames.current[i];
      if (frame) {
        axisPointAtInto(anchor.spec, anchor.t, current.flatten, scratch);
        scratch.addScaledVector(anchor.direction, anchor.spec.radius * 1.9 * (1 - current.flatten));
        frame.position.copy(scratch);
      }
      if (!node) return;

      const eased = strandEased(current.generations, anchor.spec.generation);
      const front = growthAlong(eased, anchor.t);
      /* Fade out through the pull-back. At the reveal distance a label is
         wider than the strand it names, and all eight collapse into an
         overlapping stack across the top of the frame. */
      const reveal = 1 - holdProgress(current.progress);
      const opacity =
        front > 0.55 ? Math.round(Math.min(1, (front - 0.55) / 0.45) * reveal * 100) / 100 : 0;
      if (lastOpacity.current[i] === opacity) return;
      lastOpacity.current[i] = opacity;
      node.style.opacity = String(opacity);
      node.style.visibility = opacity < 0.02 ? 'hidden' : 'visible';
    });
  });

  return (
    <>
      {anchors.map((anchor, i) => (
        <group
          key={`${anchor.label.strand}-${anchor.label.index}`}
          ref={(node) => {
            frames.current[i] = node;
          }}
        >
          <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <div
              ref={(node) => {
                groups.current[i] = node;
              }}
              className="group/locus relative w-max -translate-y-1/2 opacity-0"
            >
              <button
                type="button"
                /* Opaque, not a translucent blurred chip. These labels sit on
                   top of a scene whose ground now travels from near-black to
                   bone, and a 70%-void plate reading against both is not a
                   contrast anyone can guarantee. A solid plate is legible over
                   whatever is behind it. */
                className={`hover:border-current focus-visible:border-current bg-void inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-[3px] font-mono text-[9px] tracking-[0.14em] uppercase ${
                  anchor.label.mutated
                    ? 'border-violet/50 text-violet'
                    : 'border-acid/30 text-acid'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <span aria-hidden="true" className="size-[3px] rounded-full bg-current" />
                {anchor.label.short}
              </button>

              <div className="border-line bg-void pointer-events-none absolute top-full left-0 mt-1.5 hidden w-max max-w-[220px] rounded-xs border p-2 group-hover/locus:block group-focus-within/locus:block">
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

function Pulses({ state, tier, materials }: Props) {
  const down = useRef<InstancedMesh>(null);
  const up = useRef<InstancedMesh>(null);
  const quality = QUALITY[tier];

  const downSlots = useMemo(
    () =>
      STRANDS.filter((spec) => spec.generation > 0).map((spec) => ({
        spec,
        basis: strandBasis(spec),
      })),
    [],
  );

  const upSlots = useMemo(
    () =>
      UPSTREAM_PATH.map((id) => {
        const spec = STRANDS.find((entry) => entry.id === id);
        if (!spec) return null;
        return { spec, basis: strandBasis(spec) };
      }).filter((entry): entry is { spec: (typeof STRANDS)[number]; basis: ReturnType<typeof strandBasis> } =>
        Boolean(entry),
      ),
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
    const current = state.current;
    if (!current) return;
    const time = clock.elapsedTime;
    const { matrix, position, quaternion, scale } = scratch;

    const downNode = down.current;
    if (downNode) {
      downSlots.forEach((slot, i) => {
        const t = (time * 0.34 + i * 0.21) % 1;
        backbonePointAtInto(slot.spec, slot.basis, 0, t, current.flatten, position);
        const edge = Math.min(1, Math.min(t, 1 - t) * 7);
        const grown = growthAlong(strandEased(current.generations, slot.spec.generation), t);
        scale.setScalar(0.036 * edge * current.inheritance * grown);
        matrix.compose(position, quaternion, scale);
        downNode.setMatrixAt(i, matrix);
      });
      downNode.instanceMatrix.needsUpdate = true;
    }

    const upNode = up.current;
    if (upNode && upSlots.length > 0) {
      for (let i = 0; i < UPSTREAM_PULSES; i += 1) {
        const t = (time * 0.2 + i / UPSTREAM_PULSES) % 1;
        const scaled = (1 - t) * upSlots.length;
        const index = Math.min(upSlots.length - 1, Math.floor(scaled));
        const local = scaled - index;
        const slot = upSlots[index];
        if (!slot) continue;
        axisPointAtInto(slot.spec, local, current.flatten, position);
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
        args={[undefined, undefined, Math.max(1, downSlots.length)]}
        frustumCulled={false}
        material={materials.pulseDown}
      >
        <sphereGeometry args={[1, quality.sphere, quality.sphere]} />
      </instancedMesh>

      <instancedMesh
        ref={up}
        args={[undefined, undefined, UPSTREAM_PULSES]}
        frustumCulled={false}
        material={materials.pulseUp}
      >
        <sphereGeometry args={[1, quality.sphere, quality.sphere]} />
      </instancedMesh>
    </>
  );
}

/* --------------------------------------------------------------- camera */

function CameraRig({
  state,
  pointer,
}: {
  state: React.RefObject<BeatState>;
  pointer: React.RefObject<{ x: number; y: number }>;
}) {
  const { camera } = useThree();
  const target = useMemo(() => new Vector3(0, 1.4, 0), []);
  const desired = useMemo(() => new Vector3(), []);
  const lookAt = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [pointer]);

  useFrame((_, delta) => {
    const current = state.current;
    if (!current) return;
    const story = cameraProgress(current.progress);
    const hold = holdProgress(current.progress);
    const orbit = 1 - current.flatten;

    /* The descent, and then the reveal.
       Following the beats alone left the camera at y -3.30, z 6.72 looking at
       y -3.51, which at fov 42 frames 5.16 of the 13.5 units the family spans —
       38 % of it. The closing frame showed two tubes in close-up, not a family.
       The hold now pulls back to FAMILY_Z so the whole lineage is in shot; the
       copy at that beat is about four ancestors being offered a change, so all
       four had better be visible. */
    const storyY = 2.2 - story * 6.4;
    const storyZ = 8.4 - current.flatten * 1.15;
    const storyLookY = 1.6 - story * 6.2;

    /* Read the fov off the camera instead of repeating the 42 set in
       `HelixHero`, so the reveal still frames the family if that value or the
       viewport changes. */
    const fov = 'fov' in camera ? (camera.fov as number) : 42;
    const FAMILY_Z = FAMILY_HALF_HEIGHT / Math.tan((fov * Math.PI) / 360);

    desired.set(
      Math.sin(story * Math.PI * 0.6) * 1.2 * (1 - hold) + pointer.current.x * 0.48 * orbit,
      storyY + (FAMILY_Y + FAMILY_LOOK_LIFT - storyY) * hold + pointer.current.y * 0.24 * orbit,
      storyZ + (FAMILY_Z - storyZ) * hold,
    );
    lookAt.set(
      -story * 0.9 * (1 - hold),
      storyLookY + (FAMILY_Y + FAMILY_LOOK_LIFT - storyLookY) * hold,
      0,
    );

    const lerp = Math.min(1, delta * 3.2);
    camera.position.lerp(desired, lerp);
    target.lerp(lookAt, lerp);
    camera.lookAt(target);
  });

  return null;
}

/* --------------------------------------------------------------- export */

export function HelixScene({ state, tier }: Omit<Props, 'materials' | 'pointer'>) {
  const materials = useMemo(() => createHelixMaterials(), []);
  const pointer = useRef({ x: 0, y: 0 });
  const shadows = tier === 'high';

  useEffect(() => () => disposeHelixMaterials(materials), [materials]);

  return (
    <>
      <StudioRig state={state} shadows={shadows} />
      <OrganicTicker
        materials={materials}
        pointer={pointer}
        drift={tier === 'high' ? 1 : 0}
        state={state}
      />
      <CameraRig state={state} pointer={pointer} />
      <Backbones state={state} tier={tier} materials={materials} pointer={pointer} />
      <Rungs state={state} materials={materials} />
      <Loci state={state} tier={tier} materials={materials} pointer={pointer} />
      <Pulses state={state} tier={tier} materials={materials} pointer={pointer} />
      {tier === 'high' && <LocusLabels state={state} />}
    </>
  );
}
