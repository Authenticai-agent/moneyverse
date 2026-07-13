'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NPCsProps {
  count?: number;
  nightFactorRef?: React.MutableRefObject<number>;
  lowPower?: boolean;
}

interface NPC {
  start: THREE.Vector3;
  end: THREE.Vector3;
  phase: number;
  speed: number;
  color: string;
  scale: number;
}

const dummy = new THREE.Object3D();

export default function NPCs({ count = 8, nightFactorRef, lowPower = false }: NPCsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const npcs = useMemo<NPC[]>(() => {
    const npcList: NPC[] = [];
    const points = [
      [-2, 0.1, 1],
      [-1.5, 0.2, -1],
      [0, 0, 1.5],
      [1.5, 0.1, -1],
      [1.2, 0.3, 1.2],
      [-1.2, 0.3, 1.2],
      [0, 0.1, -1.5],
      [2.2, 0.3, 0.8],
    ] as const;

    for (let i = 0; i < count; i++) {
      const a = points[i % points.length];
      const b = points[(i + 2) % points.length];
      npcList.push({
        start: new THREE.Vector3(a[0], a[1], a[2]),
        end: new THREE.Vector3(b[0], b[1], b[2]),
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.2,
        color: ['#6B4EFF', '#FFD84D', '#5CE1E6', '#f59e0b', '#a78bfa'][i % 5],
        scale: 0.08 + Math.random() * 0.04,
      });
    }
    return npcList;
  }, [count]);

  const positionsRef = useRef<THREE.Vector3[]>(npcs.map((n) => n.start.clone()));

  useFrame((state) => {
    if (!meshRef.current || lowPower) return;
    const time = state.clock.getElapsedTime();
    const nightFactor = nightFactorRef?.current ?? 0;
    const activity = 1 - nightFactor * 0.7;

    // Compute base positions along looping paths
    const positions = positionsRef.current;
    npcs.forEach((npc, i) => {
      const t = ((time * npc.speed + npc.phase) % (Math.PI * 2)) / (Math.PI * 2);
      const pos = npc.start.clone().lerp(npc.end, (Math.sin(t * Math.PI * 2) + 1) / 2);
      pos.y += Math.abs(Math.sin(time * 4 + i)) * 0.02 * activity;
      positions[i].copy(pos);
    });

    // Simple collision avoidance: push NPCs apart if too close
    const minDistance = 0.25;
    for (let i = 0; i < npcs.length; i++) {
      for (let j = i + 1; j < npcs.length; j++) {
        const dist = positions[i].distanceTo(positions[j]);
        if (dist < minDistance && dist > 0.001) {
          const push = positions[i].clone().sub(positions[j]).normalize().multiplyScalar((minDistance - dist) * 0.5);
          positions[i].add(push);
          positions[j].sub(push);
        }
      }
    }

    // Update instance matrices and colors
    npcs.forEach((npc, i) => {
      dummy.position.copy(positions[i]);
      dummy.rotation.y = time * 0.5 + i;
      dummy.scale.setScalar(npc.scale * activity);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      meshRef.current!.setColorAt(i, new THREE.Color(npc.color));
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  if (lowPower) return null;

  return (
    <instancedMesh ref={meshRef} args={[new THREE.SphereGeometry(1, 8, 8), new THREE.MeshStandardMaterial(), count]}>
      {/* positions and colors set in useFrame */}
    </instancedMesh>
  );
}
