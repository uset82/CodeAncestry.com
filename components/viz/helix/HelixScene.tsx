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
  FAMILY_HALF_HEIGHT,
  FAMILY_Y,
  applyConvergeInto,
  axisPointAtInto,
  backbonePointAtInto,
  GROW_WIDTH,
  growthAlong,
  growthJitterAt,
  pathTaper,
  rungDirection,
  rungInset,
  startTaperWidth,
  sampleBackbone,
  strandBasis,
  strandEased,
} from './strands';
import { climaxAmount, daylight, holdProgress, type BeatSide, type BeatState } from './beats';
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

/** Aim above centre so the extra margin lands at the top, under the header. */
const FAMILY_LOOK_LIFT = 0.8;
/* FAMILY_LOOK_X is no longer a constant. CameraRig reads `state.lookX`,
   which lerps with data-beat-side: copy left → lineage right (negative). */

const TICK_UP = new Vector3(0, 1, 0);

/**
 * Flatten only mixes 42% toward the axis (growth shader, settled). Converge
 * has to finish that mix or the tubes stay a spindle while the loci walk.
 * Patched here so organic.ts stays untouched.
 */
function patchTrackConverge(material: MeshStandardMaterial) {
  const rewrite = (shader: { uniforms: Record<string, { value: number }>; vertexShader: string }) => {
    shader.uniforms.uConverge = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace('uniform float uFlatten;', 'uniform float uFlatten;\n       uniform float uConverge;')
      .replace(
        'transformed = mix(transformed, axisPoint, uFlatten * 0.42);',
        [
          'transformed = mix(transformed, axisPoint, clamp(uFlatten * 0.42 + uConverge, 0.0, 1.0));',
          'float trackAng = uv.y * 6.2831853;',
          'transformed.y += sin(trackAng) * 0.07 * uConverge;',
          'transformed.z += cos(trackAng) * 0.07 * uConverge;',
        ].join('\n       '),
      );
  };

  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    previous?.(shader, renderer);
    rewrite(shader);
  };
  material.customProgramCacheKey = () => 'helix-track-converge';

  const depth = material.userData.depthMaterial as MeshStandardMaterial | undefined;
  if (!depth) return;
  const previousDepth = depth.onBeforeCompile;
  depth.onBeforeCompile = (shader, renderer) => {
    previousDepth?.(shader, renderer);
    rewrite(shader);
  };
  depth.customProgramCacheKey = () => 'helix-track-converge-depth';
}

function writeConverge(material: MeshStandardMaterial, converge: number) {
  const color = material.userData.shader as { uniforms?: { uConverge?: { value: number } } } | undefined;
  if (color?.uniforms?.uConverge) color.uniforms.uConverge.value = converge;
  const depth = (material.userData.depthMaterial as { userData?: { shader?: { uniforms?: { uConverge?: { value: number } } } } } | undefined)
    ?.userData?.shader;
  if (depth?.uniforms?.uConverge) depth.uniforms.uConverge.value = converge;
}

/** Centre of the strands the current generation count has revealed. */
function liveFamilyY(generations: number): number {
  const live = STRANDS.filter((spec) => spec.generation < generations + 0.02);
  if (live.length === 0) return FAMILY_Y;
  const top = Math.max(...live.map((spec) => Math.max(spec.start.y, spec.end.y)));
  const bottom = Math.min(...live.map((spec) => Math.min(spec.start.y, spec.end.y)));
  return (top + bottom) / 2;
}

const RUNGS_PER_STRAND = 24;
const UPSTREAM_PULSES = 3;

type Quality = { tubular: number; radial: number; radius: number; sphere: number };

const QUALITY: Record<'low' | 'high', Quality> = {
  low: { tubular: 48, radial: 5, radius: 0.034, sphere: 10 },
  /* 120: the 0.035 end taper is ~4.2 segments. 96 was a cut with no frame-cost
     number behind it. `?tubular=` overrides for the capture measurement. */
  high: { tubular: 120, radial: 8, radius: 0.04, sphere: 16 },
};

function qualityFor(tier: 'low' | 'high'): Quality {
  const base = QUALITY[tier];
  if (tier !== 'high' || typeof window === 'undefined') return base;
  const tubular = Number(new URLSearchParams(window.location.search).get('tubular'));
  if (tubular === 96 || tubular === 120) return { ...base, tubular };
  return base;
}

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
  const quality = qualityFor(tier);

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
        patchTrackConverge(material);

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
        const mesh = group.current[i * 2 + side];
        if (!mesh) continue;
        mesh.visible = visible;
      }
    });
  });

  return (
    <>
      {strands.map((strand, i) =>
        strand.geometries.map((geometry, side) => (
          <mesh
            key={`${strand.spec.id}-${side}`}
            ref={(node) => {
              if (node) group.current[i * 2 + side] = node;
            }}
            geometry={geometry}
            material={strand.material}
            customDepthMaterial={depthMaterialOf(strand.material)}
            castShadow
            receiveShadow
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
              applyConvergeInto(strand.spec, current.converge, AXIS_A, 0);
              applyConvergeInto(strand.spec, current.converge, AXIS_B, 1);
              writeConverge(strand.material, current.converge);
              syncOrganic(strand.material, {
                grow: strandEased(current.generations, strand.spec.generation),
                flatten: current.flatten,
                start: AXIS_A,
                end: AXIS_B,
                startTaper: startTaperWidth(strand.spec.generation),
                seed: strand.spec.seed,
              });
            }}
          />
        )),
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
      /* Half the live jitter: sit on the frontier, not ahead of a receding
         noise field. The trail vanishes at grow = 1 so a finished tip rests
         on a real end, not a stub. */
      const grow = strandEased(current.generations, strand.spec.generation);
      const eased = grow - growthJitterAt(grow);
      const t = Math.min(0.999, Math.max(0, eased));
      strand.curve.getPoint(t, position);
      axisPointAtInto(strand.spec, t, current.flatten, axis);
      applyConvergeInto(strand.spec, current.converge, axis, t);
      /* Follow the tube as it tapers onto the axis, then as flatten collapses
         the whole strand. Otherwise the tip sits on the full-radius helix
         while the backbone has already closed to a point. */
      const taper = pathTaper(t, eased, startTaperWidth(strand.spec.generation));
      position.lerp(axis, 1 - taper * (1 - current.flatten));
      applyConvergeInto(strand.spec, current.converge, position, t);
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
      direction: new Vector3(),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const node = mesh.current;
    const current = state.current;
    if (!node || !current) return;

    const time = clock.elapsedTime;

    slots.forEach((slot, i) => {
      const grow = strandEased(current.generations, slot.spec.generation);
      const eased = grow - growthJitterAt(grow);
      const front = growthAlong(eased, slot.t);
      const { matrix, position, quaternion, scale, up, direction } = scratch;

      axisPointAtInto(slot.spec, slot.t, current.flatten, position);
      applyConvergeInto(slot.spec, current.converge, position, slot.t);
      direction.copy(slot.direction).lerp(TICK_UP, current.converge).normalize();
      quaternion.setFromUnitVectors(up, direction);

      const breathe = 1 + Math.sin(time * 1.1 + i * 0.7) * 0.06 * (1 - current.flatten);
      const span = slot.spec.radius * 2 * (1 - current.flatten * 0.4) * breathe;
      /* Same end / growth profile as the tube. A full-width rung on a
         needle-thin backbone is the floating dash at every terminus. */
      const taper = pathTaper(slot.t, eased, startTaperWidth(slot.spec.generation));
      scale.set(1, span * front * taper * (1 - current.converge * 0.82), 1);

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
      receiveShadow
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
      alarm: new Color(),
    }),
    [],
  );

  useFrame(({ clock }) => {
    const node = mesh.current;
    const current = state.current;
    if (!node || !current) return;

    const time = clock.elapsedTime;

    slots.forEach((slot, i) => {
      const grow = strandEased(current.generations, slot.spec.generation);
      const eased = grow - growthJitterAt(grow);
      const overshoot = slot.kind === 'junction' && slot.t === 1 && grow >= 1 ? GROW_WIDTH : 0;
      const front = growthAlong(eased, slot.t, overshoot);
      const { matrix, position, quaternion, scale, color, alarm } = scratch;

      axisPointAtInto(slot.spec, slot.t, current.flatten, position);
      applyConvergeInto(slot.spec, current.converge, position, slot.t);
      if (slot.kind === 'gene') {
        position.addScaledVector(slot.direction, slot.spec.radius * (1 - current.flatten));
      }

      const agentLocus =
        slot.kind === 'gene' &&
        slot.spec.generation > 0 &&
        Math.floor(slot.t * slot.spec.loci) % 2 === 0;
      if (agentLocus) {
        position.addScaledVector(slot.direction, slot.spec.radius * 0.45 * current.agents);
      }
      if (slot.mutated) {
        position.addScaledVector(slot.direction, 0.08 * current.mutate);
      }

      const pulse = 1 + Math.sin(time * 2 + slot.seed) * (slot.kind === 'junction' ? 0.06 : 0.16);
      const terminal = slot.kind === 'junction' && slot.t === 1;
      const emphasis = slot.mutated
        ? 1.7 + current.upstream * 0.6 + current.recovery * 0.4
        : terminal
          ? 1.2
          : slot.kind === 'junction'
            ? 1.45
            : 1;
      const focus = slot.kind === 'gene' ? 0.4 + current.geneFocus * 0.6 : 1;
      /* Loci grow as the helix flattens. The closing beat collapses the
         structure toward a line, which sheds visual mass exactly where the
         story peaks; the nodes carrying that mass have to compensate. */
      const bulk = 1 + current.flatten * 0.5;
      const size =
        (slot.kind === 'junction' ? 0.15 : 0.055) * pulse * emphasis * front * bulk * focus;

      const alarmed =
        slot.mutated ||
        (slot.spec.origin === true && slot.kind === 'gene') ||
        (slot.spec.id === 'tutor' && slot.kind === 'gene');
      if (alarmed && current.alarm > 0) {
        scale.set(
          size * (1 + current.alarm * 0.55),
          size * (1 - current.alarm * 0.5),
          size * (1 + current.alarm * 0.55),
        );
      } else {
        scale.setScalar(size);
      }

      matrix.compose(position, quaternion, scale);
      node.setMatrixAt(i, matrix);

      if (slot.spec.generation === 0) {
        color.copy(HELIX.acid).lerp(HELIX.cyan, slot.kind === 'junction' ? 0.08 : 0.22);
      } else {
        color.copy(HELIX.cyan).lerp(HELIX.dim, 0.42 - current.inheritance * 0.36);
      }
      if (terminal) color.lerp(HELIX.acid, 0.28);
      if (slot.mutated && current.mutate > 0) color.lerp(HELIX.violet, current.mutate);
      if (agentLocus && current.agents > 0) color.lerp(HELIX.violet, current.agents * 0.55);
      if (alarmed && current.alarm > 0) {
        alarm.copy(HELIX.amber).lerp(HELIX.rose, current.alarm);
        color.lerp(alarm, current.alarm);
      }
      if (
        (slot.mutated || (slot.spec.generation === 0 && slot.kind === 'junction' && slot.t === 0)) &&
        current.recovery > 0
      ) {
        color.lerp(HELIX.acid, current.recovery);
      }
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

/** True when a chip sits in the copy half. The specimen owns the other half. */
function labelHitsReadingField(node: HTMLElement, side: BeatSide): boolean {
  if (side === 'full') return false;
  const rect = node.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  const mid = window.innerWidth * 0.5;
  return side === 'left' ? rect.left < mid : rect.right > mid;
}

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
        applyConvergeInto(anchor.spec, current.converge, scratch, anchor.t);
        scratch.addScaledVector(anchor.direction, anchor.spec.radius * 1.9 * (1 - current.flatten));
        /* Keep the chip on the specimen side of the locus. */
        if (current.flatten < 0.95 && current.lookX !== 0) {
          scratch.x += Math.sign(-current.lookX) * anchor.spec.radius * 0.55;
        }
        frame.position.copy(scratch);
      }
      if (!node) return;

      const grow = strandEased(current.generations, anchor.spec.generation);
      const eased = grow - growthJitterAt(grow);
      const front = growthAlong(eased, anchor.t);
      /* geneFocus fades labels in. Converge and zoomOut fade them out — the
         machine ledger is eight tracks, not six chips on the origin strand. */
      const reveal =
        current.geneFocus * (1 - holdProgress(current) * 0.9) * (1 - current.converge);
      let opacity =
        front > 0.55 ? Math.round(Math.min(1, (front - 0.55) / 0.45) * reveal * 100) / 100 : 0;
      /* A chip in the reading field is a composition failure. Hide it. */
      if (opacity > 0.02 && labelHitsReadingField(node, current.side)) opacity = 0;
      const mark = node.querySelector('[data-locus-mark]');
      if (mark) {
        mark.textContent = current.recovery > 0.45 && anchor.label.mutated ? '✓' : '';
      }
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
                /* Opaque void plate. The scene stays dark; a translucent chip
                   disappeared into the tubes. */
                className={`hover:border-current focus-visible:border-current bg-void inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-[3px] font-mono text-[9px] tracking-[0.14em] uppercase ${
                  anchor.label.mutated
                    ? 'border-violet/50 text-violet'
                    : 'border-acid/30 text-acid'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                <span
                  aria-hidden="true"
                  data-locus-mark
                  className="size-[3px] rounded-full bg-current text-[8px] leading-none"
                />
                {anchor.label.short}
              </button>

              <div className="border-line bg-void pointer-events-none absolute top-full left-0 mt-1.5 hidden w-max max-w-[220px] rounded-xs border p-2 group-hover/locus:block group-focus-within/locus:block">
                <p className="text-text text-[12px] font-semibold">{anchor.label.gene}</p>
                <p className="text-muted mt-0.5 text-[11px]">{anchor.label.origin}</p>
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
        const raw = (time * 0.34 + i * 0.21) % 1;
        const t = raw + (1 - 2 * raw) * current.rewind;
        backbonePointAtInto(slot.spec, slot.basis, 0, t, current.flatten, position);
        applyConvergeInto(slot.spec, current.converge, position, t);
        const edge = Math.min(1, Math.min(t, 1 - t) * 7);
        const grow = strandEased(current.generations, slot.spec.generation);
        const grown = growthAlong(grow - growthJitterAt(grow), t);
        const feed = current.inheritance + current.sources * (1 - t) * 0.85;
        scale.setScalar(0.036 * edge * feed * grown);
        matrix.compose(position, quaternion, scale);
        downNode.setMatrixAt(i, matrix);
      });
      downNode.instanceMatrix.needsUpdate = true;
    }

    const upNode = up.current;
    if (upNode && upSlots.length > 0) {
      for (let i = 0; i < UPSTREAM_PULSES; i += 1) {
        const raw = (time * 0.2 + i / UPSTREAM_PULSES) % 1;
        const t = raw + (1 - 2 * raw) * current.rewind;
        const scaled = (1 - t) * upSlots.length;
        const index = Math.min(upSlots.length - 1, Math.floor(scaled));
        const local = scaled - index;
        const slot = upSlots[index];
        if (!slot) continue;
        axisPointAtInto(slot.spec, local, current.flatten, position);
        applyConvergeInto(slot.spec, current.converge, position, local);
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
    const orbit = 1 - current.flatten;
    /* Distance is a multiple of the fit already computed here. No 0.82 fudge.
       lookX follows the reading side so the lineage never sits on the copy. */
    const fov = 'fov' in camera ? (camera.fov as number) : 42;
    const fit = FAMILY_HALF_HEIGHT / Math.tan((fov * Math.PI) / 360);
    const z = fit * current.cameraMultiple;
    const lookY = liveFamilyY(current.generations) + FAMILY_LOOK_LIFT;
    const lookX = current.lookX;

    /* Pointer may orbit toward the specimen, never toward the copy. */
    let orbitX = pointer.current.x * 0.48 * orbit;
    if (lookX < -0.2) orbitX = Math.max(0, orbitX);
    if (lookX > 0.2) orbitX = Math.min(0, orbitX);

    desired.set(lookX + orbitX, lookY + pointer.current.y * 0.24 * orbit, z);
    lookAt.set(lookX, lookY, 0);

    const snap = window.__HELIX_SNAP === true;
    if (snap) window.__HELIX_SNAP = false;
    const lerp = snap ? 1 : Math.min(1, delta * 3.2);
    camera.position.lerp(desired, lerp);
    target.lerp(lookAt, lerp);
    camera.lookAt(target);
    window.__HELIX_CAM_Z = camera.position.z;
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
