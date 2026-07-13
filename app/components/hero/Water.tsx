'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { Season } from './Season';

interface WaterProps {
  season: Season;
  lowPower?: boolean;
}

const seasonColor: Record<Season, string> = {
  spring: '#5CE1E6',
  summer: '#3b82f6',
  autumn: '#60a5fa',
  winter: '#93c5fd',
};

export default function Water({ season, lowPower = false }: WaterProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.005;
  });

  if (lowPower) {
    return (
      <mesh ref={ref} position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial color={seasonColor[season]} metalness={0.8} roughness={0.2} transparent opacity={0.8} />
      </mesh>
    );
  }

  return (
    <mesh ref={ref} position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[8, 64]} />
      <MeshReflectorMaterial
        color={seasonColor[season]}
        resolution={512}
        blur={[300, 100]}
        mixBlur={0.8}
        mirror={0.6}
        mixStrength={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}
