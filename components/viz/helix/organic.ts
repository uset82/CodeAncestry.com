/**
 * Helix organic kit — vine craft, not a vine.
 *
 * Budget: 0 post passes, ≤1 shadow light, shared GLSL, unique cache keys.
 * Low tier sets uDrift to 0. Materials stay MeshStandard / MeshPhysical;
 * onBeforeCompile only injects growth, fbm and flatten.
 *
 * Each backbone clones its role material so uGrow is per-strand.
 */

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
  for (int i = 0; i < 4; i++) {
    v += a * helixNoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
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
       varying float vPath;
       ${FBM}`,
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vPath = uv.x;
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

       /* Close the tube by pulling its offset from the axis to zero at both
          ends and at the growth front.

          TubeGeometry never emits end caps, so every terminus was an open ring
          with the unlit interior showing through — the "cut chain". A point has
          no hole, so tapering the offset caps it with no extra geometry, and a
          child now converges exactly onto its parent's end point instead of
          crossing it on a circle of radius 0.38. Children use a longer
          start window so they travel along their own axis before blooming.

          The growth taper matters just as much: the fragment discard below cuts
          a flat cross-section, so without this the advancing tip was itself a
          sliced ring. Collapsing the geometry as it approaches uGrow means the
          tip arrives as a point and the discard only removes what is already
          degenerate. */
       float endTaper = smoothstep(0.0, uStartTaper, vPath) * (1.0 - smoothstep(0.965, 1.0, vPath));
       float growTaper = 1.0 - smoothstep(uGrow - 0.045, uGrow, vPath);
       transformed = axisPoint + (transformed - axisPoint) * min(endTaper, growTaper);

       transformed = mix(transformed, axisPoint, uFlatten * 0.42);`
    );

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
       uniform float uGrow;
       uniform vec3 uTipColor;
       varying float vPath;
       ${FBM}`,
    )
    .replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
       if (vPath > uGrow + 0.0015) discard;`,
    )
    .replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       float tip = smoothstep(uGrow - 0.055, uGrow, vPath);
       float grain = helixFbm(vViewPosition * 0.35);
       totalEmissiveRadiance += uTipColor * tip * 1.85;
       totalEmissiveRadiance *= 0.88 + grain * 0.22;`,
    );
}

function patchDepthShaders(shader: OrganicShader) {
  /* The depth pass has to deform exactly like the colour pass, or the shadow is
     cast by a shape that is not on screen — an untapered tube with a full-radius
     ring at each end. Flatten and taper are reproduced here; the noise drift is
     deliberately not, since it is sub-millimetre and shadows do not resolve it. */
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      `#include <common>
       uniform float uFlatten;
       uniform float uGrow;
       uniform vec3 uStart;
       uniform vec3 uEnd;
       uniform float uStartTaper;
       varying float vPath;`,
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vPath = uv.x;
       vec3 axisPoint = mix(uStart, uEnd, vPath);
       float endTaper = smoothstep(0.0, uStartTaper, vPath) * (1.0 - smoothstep(0.965, 1.0, vPath));
       float growTaper = 1.0 - smoothstep(uGrow - 0.045, uGrow, vPath);
       transformed = axisPoint + (transformed - axisPoint) * min(endTaper, growTaper);
       transformed = mix(transformed, axisPoint, uFlatten * 0.42);`,
    );

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
       uniform float uGrow;
       varying float vPath;`,
    )
    .replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
       if (vPath > uGrow + 0.0015) discard;`,
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
  material.customProgramCacheKey = () => `helix-grow-${role}`;

  const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
  depth.defines = { USE_UV: '' };
  depth.onBeforeCompile = (shader) => {
    const next = shader as unknown as OrganicShader;
    next.uniforms.uGrow = { value: 1 };
    next.uniforms.uFlatten = { value: 0 };
    next.uniforms.uStart = { value: new Vector3() };
    next.uniforms.uEnd = { value: new Vector3() };
    next.uniforms.uStartTaper = { value: 0.035 };
    patchDepthShaders(next);
    depth.userData.shader = next;
  };
  depth.customProgramCacheKey = () => `helix-grow-depth-${role}`;
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
  },
) {
  const shader = material.userData.shader as OrganicShader | undefined;
  if (shader) {
    writeUniform(shader, 'uGrow', values.grow);
    writeUniform(shader, 'uFlatten', values.flatten);
    writeUniform(shader, 'uStartTaper', values.startTaper);
    (shader.uniforms.uStart?.value as Vector3 | undefined)?.copy(values.start);
    (shader.uniforms.uEnd?.value as Vector3 | undefined)?.copy(values.end);
  }
  const depth = depthMaterialOf(material)?.userData.shader as OrganicShader | undefined;
  if (depth) {
    writeUniform(depth, 'uGrow', values.grow);
    writeUniform(depth, 'uFlatten', values.flatten);
    writeUniform(depth, 'uStartTaper', values.startTaper);
    (depth.uniforms.uStart?.value as Vector3 | undefined)?.copy(values.start);
    (depth.uniforms.uEnd?.value as Vector3 | undefined)?.copy(values.end);
  }
}

export function climaxEmissive(generation: number, origin: boolean, climax: number): number {
  if (generation === 0) return 0.55 + climax * 1.35;
  if (origin) return 0.62 + climax * 1.45;
  return 0.42 + climax * 1.05;
}

export function tickClimax(
  materials: {
    backboneOrigin: MeshStandardMaterial;
    backboneMutated: MeshStandardMaterial;
    backboneDescendant: MeshStandardMaterial;
    rung: MeshStandardMaterial;
  },
  climax: number,
) {
  materials.backboneOrigin.emissiveIntensity = climaxEmissive(0, false, climax);
  materials.backboneMutated.emissiveIntensity = climaxEmissive(1, true, climax);
  materials.backboneDescendant.emissiveIntensity = climaxEmissive(1, false, climax);
  materials.rung.emissiveIntensity = 0.5 + climax * 0.95;
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
