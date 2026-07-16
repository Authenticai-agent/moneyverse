/**
 * A shared 4-step gradient map for three.js MeshToonMaterial - built once and
 * reused across every toon-shaded surface in the grove (tree, pines, bush,
 * rocks, fence, lanterns), so the whole scene reads as flat, cel-shaded, and
 * "cozy village" instead of realistic PBR shading. Lazily created so it's
 * only ever built in the browser (never during SSR).
 */

import * as THREE from 'three';

let gradientMap: THREE.DataTexture | null = null;

export function getToonGradientMap(): THREE.DataTexture {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([90, 160, 210, 255]);
  const texture = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  texture.needsUpdate = true;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  gradientMap = texture;
  return texture;
}
