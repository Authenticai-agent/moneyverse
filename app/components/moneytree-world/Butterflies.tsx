'use client';

/**
 * Butterflies - a dozen instanced sprite quads drifting on lazy sine paths,
 * per Phase 1 item 5. Cheap and purely decorative: no physics, no collision.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 12;

export function Butterflies() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        cx: (Math.random() - 0.5) * 40,
        cz: (Math.random() - 0.5) * 40,
        radius: 1.5 + Math.random() * 2.5,
        speed: 0.25 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        baseY: 1.2 + Math.random() * 1.8,
        bobSpeed: 1 + Math.random() * 1.5,
      })),
    []
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const angle = t * s.speed + s.phase;
      const x = s.cx + Math.cos(angle) * s.radius;
      const z = s.cz + Math.sin(angle * 1.3) * s.radius;
      const y = s.baseY + Math.sin(t * s.bobSpeed + s.phase) * 0.3;
      dummy.position.set(x, y, z);
      dummy.rotation.y = angle;
      dummy.rotation.z = Math.sin(t * s.bobSpeed * 2 + s.phase) * 0.5;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[0.18, 0.12]} />
      <meshBasicMaterial color="#FFD84D" side={THREE.DoubleSide} transparent opacity={0.9} />
    </instancedMesh>
  );
}
