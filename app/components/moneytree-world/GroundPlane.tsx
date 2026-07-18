'use client';

/**
 * GroundPlane - the painted grass the whole 2.5D scene stands on. A flat
 * horizontal plane at y=0 textured with the generated painterly grass (tiled),
 * unlit (meshBasicMaterial) so it reads exactly as the painting with no
 * lighting mismatch.
 *
 * It is deliberately FINITE and pulled forward: its far edge sits at about
 * z=-16 so the horizon line lands roughly a quarter of the way down the frame,
 * leaving the upper part of the view for the painted sky Backdrop (sun, clouds,
 * mountains). An infinite/huge ground plane instead filled almost the whole
 * frame with grass and hid the sky. The straight far edge is masked by the
 * midground Scenery (a hedge of bushes) and the backdrop's own hills.
 */

import { Suspense } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const GROUND_TEXTURE = '/env/ground.jpg';
const GROUND_WIDTH = 150;
const GROUND_DEPTH = 44;
// Centered forward of the origin so the plane runs from ~z=-16 (horizon) to
// ~z=+28 (under and behind the camera).
const GROUND_CENTER_Z = 6;

function GroundMesh() {
  const texture = useTexture(GROUND_TEXTURE);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(GROUND_WIDTH / 8.5, GROUND_DEPTH / 8.5);
  texture.anisotropy = 8;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, GROUND_CENTER_Z]}>
      <planeGeometry args={[GROUND_WIDTH, GROUND_DEPTH]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

export function GroundPlane() {
  return (
    <Suspense fallback={null}>
      <GroundMesh />
    </Suspense>
  );
}
