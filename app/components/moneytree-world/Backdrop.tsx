'use client';

/**
 * Backdrop - a large painted magical-landscape plane far behind the garden
 * (generated art). With the fixed camera it reads as the whole sky + distant
 * hills, replacing the primitive gradient dome + sphere sun/clouds. It's
 * unlit and fog-exempt (meshBasicMaterial, fog=false, toneMapped=false) so the
 * painting shows at full richness, and sits far enough back that the 3D garden
 * (terrain, tree, characters, buckets) always renders in front of it.
 */

import { Suspense } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const BACKDROP_TEXTURE = '/env/backdrop.jpg';

// A painted sky wall behind the garden. The art is a low-horizon panorama
// (sun + mountains along the bottom, sky + clouds filling the rest), so it's
// hung high and large: its own horizon lands just above the finite
// GroundPlane's far edge / bush hedge, and its sky fills the whole upper frame.
// Sized wide enough (from the 16:9 image aspect) to cover the frame width even
// on the widened mobile FOV. Tunable.
const BACKDROP_POSITION: [number, number, number] = [0, 18, -42];
const BACKDROP_HEIGHT = 48;
// Explicit generous width (not aspect-locked) so the plane always covers the
// frame edges, including the widened/dollied-back mobile FOV. The extra width
// only stretches the sky+clouds slightly, which is imperceptible.
const BACKDROP_WIDTH = 118;

function BackdropPlane() {
  const texture = useTexture(BACKDROP_TEXTURE);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh position={BACKDROP_POSITION}>
      <planeGeometry args={[BACKDROP_WIDTH, BACKDROP_HEIGHT]} />
      <meshBasicMaterial map={texture} fog={false} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

export function Backdrop() {
  return (
    <Suspense fallback={null}>
      <BackdropPlane />
    </Suspense>
  );
}
