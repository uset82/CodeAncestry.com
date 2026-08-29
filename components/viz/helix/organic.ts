/**
 * Helix organic kit — vine craft, not a vine.
 *
 * Budget: 0 post passes, ≤1 shadow light, shared GLSL, unique cache keys.
 * Low tier sets uDrift to 0. Materials stay MeshStandard / MeshPhysical;
 * onBeforeCompile only injects growth, fbm and flatten.
 *
 * Each backbone clones its role material so uGrow is per-strand.
 */

import { GROWTH_SPREAD } from './strands';
import {
  MeshDepthMaterial,
  RGBADepthPacking,
  Vector2,
  Vector3,
  type Color,
  type IUniform,
  type Material,
  type MeshStandardMaterial,
} from 'three';

export type OrganicShader = {
  uniforms: Record<string, IUniform>;
  vertexShader: string;
  fragmentShader: string;
};

const FBM = /* glsl */ `
float helixHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float helixNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(helixHash(i), helixHash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(helixHash(i + vec3(0.0, 1.0, 0.0)), helixHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(helixHash(i + vec3(0.0, 0.0, 1.0)), helixHash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(helixHash(i + vec3(0.0, 1.0, 1.0)), helixHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
float helixFbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * helixNoise(p);
    p *= 2.17;
    a *= 0.5;
  }
  return v;
}
`;

/**
 * Vine coverage, on a helix.
 *
 * Vine Overgrowth does not cut a tube at `t`. It keeps a fragment when a
 * domain-warped fbm field is below a rising waterline. That is why their
 * frontier fingers and holes instead of travelling as a ring.
 *
 * We still have to grow *along* the strand (the scroll story is descent), so
 * `path` is the waterline axis. The field decides the living edge; `path`
 * decides how far down the lineage the water has risen. Evaluated per
 * fragment — a vertex-only sample interpolates into a ring again.
 *
 * `GROWTH_SPREAD` is imported from `strands.ts` so rungs trail the same
 * worst-case recede this field can produce.
 */
const GROWTH = /* glsl */ `
float helixCoverage(vec3 lp, float grow, float seed, float path) {
  vec3 q = lp * 1.15 + seed * 7.31;
  vec3 w = vec3(
    helixNoise(q * 1.7 + 3.1),
    helixNoise(q * 1.7 + 7.7),
    helixNoise(q * 1.7 + 13.2)) - 0.5;
  q += w * 0.62;
  float n = helixFbm(q);
  n += (helixNoise(q * 5.0) - 0.5) * 0.26;
  float local = grow - path;
  return local * (1.0 + ${GROWTH_SPREAD.toFixed(4)}) - (n - 0.5) * ${GROWTH_SPREAD.toFixed(4)};
}
`;

function injectGrowUniforms(shader: OrganicShader, tip: Color) {
  shader.uniforms.uGrow = { value: 1 };
  shader.uniforms.uTime = { value: 0 };
  shader.uniforms.uFlatten = { value: 0 };
  shader.uniforms.uDrift = { value: 1 };
  shader.uniforms.uTipColor = { value: tip };
  shader.uniforms.uPointer = { value: new Vector2() };
  shader.uniforms.uStart = { value: new Vector3() };
  shader.uniforms.uEnd = { value: new Vector3() };
  shader.uniforms.uStartTaper = { value: 0.035 };
  shader.uniforms.uSeed = { value: 0 };
  shader.uniforms.uShellOffset = { value: 0 };
  shader.uniforms.uShellBias = { value: 0 };
}

function patchColorShaders(shader: OrganicShader) {
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `#include <common>
       uniform float uTime;
       uniform float uFlatten;
       uniform float uDrift;
       uniform float uGrow;
       uniform vec2 uPointer;
       uniform vec3 uStart;
       uniform vec3 uEnd;
       uniform float uStartTaper;
       uniform float uSeed;
       uniform float uShellOffset;
       varying float vPath;
       varying vec3 vLocal;
       ${FBM}
       ${GROWTH}`,
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vPath = uv.x;
       vLocal = position;
       float live = (1.0 - uFlatten) * uDrift;
       float n = helixFbm(transformed * 1.85 + vec3(0.0, uTime * 0.11, uTime * 0.07));
       float m = helixFbm(transformed.zyx * 1.6 + vec3(uTime * 0.08));
       transformed.x += (n - 0.5) * 0.030 * live;
       transformed.z += (m - 0.5) * 0.026 * live;
       transformed.x += sin(uTime * 0.75 + vPath * 14.0) * 0.010 * live;
       transformed.z += cos(uTime * 0.68 + vPath * 14.0) * 0.010 * live;
       transformed.x += uPointer.x * vPath * 0.16 * live;
       transformed.y += uPointer.y * vPath * 0.07 * live;
       vec3 axisPoint = mix(uStart, uEnd, vPath);

       /* Termini only. The living edge is a coverage isosurface in the
          fragment shader — pinching the growth front to a point here is what
          turned that field back into a travelling ring. */
       float endTaper = smoothstep(0.0, uStartTaper, vPath) * (1.0 - smoothstep(0.965, 1.0, vPath));
       float cover = helixCoverage(position, uGrow, uSeed, vPath);
       float growTaper = mix(0.55, 1.0, smoothstep(0.0, 0.10, cover));
       transformed = axisPoint + (transformed - axisPoint) * min(endTaper, growTaper);
       vec3 radial = transformed - axisPoint;
       float radialLen = length(radial);
       if (radialLen > 1e-4) transformed += radial / radialLen * uShellOffset;

       transformed = mix(transformed, axisPoint, uFlatten * 0.42);`
    );

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
       uniform vec3 uTipColor;
       uniform float uGrow;
       uniform float uSeed;
       uniform float uShellBias;
       varying float vPath;
       varying vec3 vLocal;
       float vCover;
       ${FBM}
       ${GROWTH}`,
    )
    .replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
       vCover = helixCoverage(vLocal, uGrow, uSeed, vPath) - uShellBias;
       if (vCover < 0.0) discard;`,
    )
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       float tip = 1.0 - smoothstep(0.0, 0.07, vCover);
       float grain = helixFbm(vViewPosition * 0.35);
       totalEmissiveRadiance += uTipColor * tip * 1.85;
       totalEmissiveRadiance *= 0.88 + grain * 0.22;`,
    );
}

function patchDepthShaders(shader: OrganicShader) {
  /* Depth must match colour coverage and end taper, or the shadow is an
     untapered ring the camera cannot see. Drift is skipped — too small. */
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `#include <common>
       uniform float uFlatten;
       uniform float uGrow;
       uniform vec3 uStart;
       uniform vec3 uEnd;
       uniform float uStartTaper;
       uniform float uSeed;
       uniform float uShellOffset;
       varying float vPath;
       varying vec3 vLocal;
       ${FBM}
       ${GROWTH}`,
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vPath = uv.x;
       vLocal = position;
       vec3 axisPoint = mix(uStart, uEnd, vPath);
       float endTaper = smoothstep(0.0, uStartTaper, vPath) * (1.0 - smoothstep(0.965, 1.0, vPath));
       float cover = helixCoverage(position, uGrow, uSeed, vPath);
       float growTaper = mix(0.55, 1.0, smoothstep(0.0, 0.10, cover));
       transformed = axisPoint + (transformed - axisPoint) * min(endTaper, growTaper);
       vec3 radial = transformed - axisPoint;
       float radialLen = length(radial);
       if (radialLen > 1e-4) transformed += radial / radialLen * uShellOffset;
       transformed = mix(transformed, axisPoint, uFlatten * 0.42);`,
    );

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
       uniform float uGrow;
       uniform float uSeed;
       uniform float uShellBias;
       varying float vPath;
       varying vec3 vLocal;
       ${FBM}
       ${GROWTH}`,
    )
    .replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
       if (helixCoverage(vLocal, uGrow, uSeed, vPath) - uShellBias < 0.0) discard;`,
    );
}

export function patchGrowingMaterial(material: MeshStandardMaterial, role: string, tip: Color) {
  material.defines = { ...material.defines, USE_UV: '' };
  material.onBeforeCompile = (shader) => {
    const next = shader as unknown as OrganicShader;
    injectGrowUniforms(next, tip);
    patchColorShaders(next);
    material.userData.shader = next;
  };
  material.customProgramCacheKey = () => `helix-cover-${role}`;

  const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
  depth.defines = { USE_UV: '' };
  depth.onBeforeCompile = (shader) => {
    const next = shader as unknown as OrganicShader;
    next.uniforms.uGrow = { value: 1 };
    next.uniforms.uFlatten = { value: 0 };
    next.uniforms.uStart = { value: new Vector3() };
    next.uniforms.uEnd = { value: new Vector3() };
    next.uniforms.uStartTaper = { value: 0.035 };
    next.uniforms.uSeed = { value: 0 };
    next.uniforms.uShellOffset = { value: 0 };
    next.uniforms.uShellBias = { value: 0 };
    patchDepthShaders(next);
    depth.userData.shader = next;
  };
  depth.customProgramCacheKey = () => `helix-cover-depth-${role}`;
  material.userData.depthMaterial = depth;
}

export function depthMaterialOf(material: Material): MeshDepthMaterial | undefined {
  return material.userData.depthMaterial as MeshDepthMaterial | undefined;
}

function writeUniform(shader: OrganicShader, key: string, value: unknown) {
  const uniform = shader.uniforms[key];
  if (uniform) uniform.value = value;
}

export function syncOrganic(
  material: Material,
  values: {
    grow: number;
    flatten: number;
    start: Vector3;
    end: Vector3;
    startTaper: number;
    seed: number;
    shell?: number;
  },
) {
  const shell = values.shell ?? 0;
  const offset = shell * 0.012;
  const bias = shell * 0.05;
  const shader = material.userData.shader as OrganicShader | undefined;
  if (shader) {
    writeUniform(shader, 'uGrow', values.grow);
    writeUniform(shader, 'uFlatten', values.flatten);
    writeUniform(shader, 'uStartTaper', values.startTaper);
    writeUniform(shader, 'uSeed', values.seed);
    writeUniform(shader, 'uShellOffset', offset);
    writeUniform(shader, 'uShellBias', bias);
    (shader.uniforms.uStart?.value as Vector3 | undefined)?.copy(values.start);
    (shader.uniforms.uEnd?.value as Vector3 | undefined)?.copy(values.end);
  }
  const depth = depthMaterialOf(material)?.userData.shader as OrganicShader | undefined;
  if (depth) {
    writeUniform(depth, 'uGrow', values.grow);
    writeUniform(depth, 'uFlatten', values.flatten);
    writeUniform(depth, 'uStartTaper', values.startTaper);
    writeUniform(depth, 'uSeed', values.seed);
    writeUniform(depth, 'uShellOffset', offset);
    writeUniform(depth, 'uShellBias', bias);
    (depth.uniforms.uStart?.value as Vector3 | undefined)?.copy(values.start);
    (depth.uniforms.uEnd?.value as Vector3 | undefined)?.copy(values.end);
  }
}

/**
 * Emissive has to fall away as the world lights up.
 *
 * Self-illumination is how a specimen reads in the dark. In daylight it is how
 * a specimen stops reading at all: an emissive pale tube on a bone ground has
 * nowhere brighter to go, so it flattens into the background — the original
 * complaint with the values inverted. A lit object is lit by its environment.
 */
export function climaxEmissive(
  generation: number,
  origin: boolean,
  climax: number,
  day = 0,
): number {
  const base =
    generation === 0 ? 0.55 + climax * 1.35 : origin ? 0.62 + climax * 1.45 : 0.42 + climax * 1.05;
  return base * (1 - day * 0.86);
}

export function tickClimax(
  materials: {
    backboneOrigin: MeshStandardMaterial;
    backboneMutated: MeshStandardMaterial;
    backboneDescendant: MeshStandardMaterial;
    rung: MeshStandardMaterial;
  },
  climax: number,
  day = 0,
) {
  materials.backboneOrigin.emissiveIntensity = climaxEmissive(0, false, climax, day);
  materials.backboneMutated.emissiveIntensity = climaxEmissive(1, true, climax, day);
  materials.backboneDescendant.emissiveIntensity = climaxEmissive(1, false, climax, day);
  materials.rung.emissiveIntensity = (0.5 + climax * 0.95) * (1 - day * 0.86);
}

export function tickOrganic(
  material: Material,
  time: number,
  drift: number,
  pointer: { x: number; y: number },
) {
  const shader = material.userData.shader as OrganicShader | undefined;
  if (!shader) return;
  writeUniform(shader, 'uTime', time);
  writeUniform(shader, 'uDrift', drift);
  (shader.uniforms.uPointer?.value as Vector2 | undefined)?.set(pointer.x, pointer.y);
}
