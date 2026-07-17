'use client';

/**
 * Terrain - Phase 0 stub: a flat green ground plane with a fixed Rapier
 * collider so Player has something to stand on.
 *
 * Phase 1 replaces this with a gently displaced (sine noise, not a heightmap
 * texture) island terrain, toon-shaded in two greens with a dirt path, and a
 * proper trimesh/heightfield collider.
 */

import { RigidBody } from '@react-three/rapier';

const GROUND_SIZE = 60;
const GROUND_THICKNESS = 0.2;

export function Terrain() {
  return (
    <RigidBody type="fixed" colliders="cuboid" friction={1}>
      <mesh receiveShadow position={[0, -GROUND_THICKNESS / 2, 0]}>
        <boxGeometry args={[GROUND_SIZE, GROUND_THICKNESS, GROUND_SIZE]} />
        <meshStandardMaterial color="#5FD38D" />
      </mesh>
    </RigidBody>
  );
}
