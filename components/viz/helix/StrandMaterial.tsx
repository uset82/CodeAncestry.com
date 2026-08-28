'use client';

import { AdditiveBlending, DoubleSide, ShaderMaterial, Uniform, type Color } from 'three';

/**
 * The strand material.
 *
 * The scene previously used `meshBasicMaterial` for everything — flat, unlit
 * colour with no volume, no falloff and no depth. On a near-black ground that
 * reads as coloured spaghetti no matter how good the palette is, which is
 * exactly the "cheap" complaint.
 *
 * Three things fix it, and none of them is a glow filter:
 *
 *   Fresnel rim   the tube is brighter where it turns away from the camera, so
 *                 it reads as a cylinder rather than a painted ribbon.
 *   Depth fade    strands further from the camera lose intensity, so the family
 *                 has actual spatial order instead of sitting on one plane.
 *   Core falloff  a hot centre easing into a dim edge, which is what a lit
 *                 filament looks like.
 *
 * Report 11 asks for exactly this — "soft rim/Fresnel effect, locus intensity,
 * subtle noise displacement" — and warns against neon. Everything here is
 * multiplicative on the strand's own colour, so it can brighten a strand but
 * never invent a colour the palette does not contain.
 */

const vertexShader = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vPositionView;
  varying float vAlong;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);

    vNormalView = normalize(normalMatrix * normal);
    vPositionView = viewPosition.xyz;
    // uv.x runs along the tube, so it doubles as "distance travelled".
    vAlong = uv.x;

    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uFadeNear;
  uniform float uFadeFar;

  varying vec3 vNormalView;
  varying vec3 vPositionView;
  varying float vAlong;

  void main() {
    vec3 viewDir = normalize(-vPositionView);
    vec3 normal = normalize(vNormalView);

    // Fresnel: bright at grazing angles, dim where the surface faces us.
    float facing = abs(dot(normal, viewDir));
    float rim = pow(1.0 - facing, 2.0);

    // A hot core that eases outward, rather than one flat fill.
    float core = mix(0.35, 1.0, facing);

    // Depth falloff. Distant strands recede instead of competing with near ones.
    float depth = smoothstep(uFadeFar, uFadeNear, -vPositionView.z);

    // A slow travelling brightness, so an idle strand still reads as alive.
    float travel = 0.06 * sin(vAlong * 12.0 - uTime * 0.6);

    float intensity = (core * 0.75 + rim * 0.9 + travel) * depth;

    gl_FragColor = vec4(uColor * intensity, uOpacity * depth * (0.55 + rim * 0.45));

    #include <colorspace_fragment>
  }
`;

/** Called per strand inside a memo, so this is a factory rather than a hook. */
export function createStrandMaterial(color: Color, opacity: number): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    // Additive so overlapping strands accumulate light the way filaments do,
    // instead of the nearest one flatly occluding the rest.
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: {
      uColor: new Uniform(color),
      uOpacity: new Uniform(opacity),
      uTime: new Uniform(0),
      uFadeNear: new Uniform(4),
      uFadeFar: new Uniform(34),
    },
  });
}
