'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import LoDMesh from './LoDMesh';
import type { Season } from './Season';

interface MoneyTreeProps {
  position: [number, number, number];
  scrollProgressRef: React.MutableRefObject<number>;
  nightFactorRef?: React.MutableRefObject<number>;
  season?: Season;
}

const seasonLeafColor: Record<Season, string> = {
  spring: '#86efac',
  summer: '#22c55e',
  autumn: '#f59e0b',
  winter: '#cbd5e1',
};

const seasonTrunkColor: Record<Season, string> = {
  spring: '#78350f',
  summer: '#5D4037',
  autumn: '#5D4037',
  winter: '#8D6E63',
};

const leaves: { pos: [number, number, number]; scale: number }[] = [
  { pos: [0, 0, 0], scale: 0.35 },
  { pos: [0.2, 0.1, 0.1], scale: 0.25 },
  { pos: [-0.15, 0.15, -0.1], scale: 0.22 },
  { pos: [0, 0.25, -0.2], scale: 0.2 },
  { pos: [-0.2, 0.05, 0.2], scale: 0.18 },
];

const coins: { pos: [number, number, number] }[] = [
  { pos: [0.25, 0.2, 0.2] },
  { pos: [-0.2, 0.3, -0.1] },
  { pos: [0.05, 0.35, 0.25] },
];

export function MoneyTree({ position, scrollProgressRef, nightFactorRef, season = 'summer' }: MoneyTreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const foliageInstancesRef = useRef<THREE.InstancedMesh>(null);
  const coinInstancesRef = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState(false);

  const leafColor = seasonLeafColor[season];
  const trunkColor = seasonTrunkColor[season];

  const trunkMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: trunkColor }), [trunkColor]);
  const leafMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: leafColor, emissive: leafColor, emissiveIntensity: 0.2 }),
    [leafColor]
  );
  const coinMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#FFD84D', emissive: '#FFD84D', emissiveIntensity: 0.6 }),
    []
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const progress = scrollProgressRef.current;
    const time = state.clock.getElapsedTime();
    const night = nightFactorRef?.current ?? 0;

    // Grow from seed to forest
    const targetScale = 0.4 + progress * 1.2;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);

    // Gentle sway
    groupRef.current.rotation.z = Math.sin(time * 0.5) * 0.02;

    // Glow pulses
    leafMaterial.emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.1 + progress * 0.2 + night * 0.3;
    coinMaterial.emissiveIntensity = 0.6 + Math.sin(time * 2 + 1) * 0.1 + progress * 0.2 + night * 0.3;

    if (hovered) {
      leafMaterial.emissiveIntensity += 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Trunk */}
      <LoDMesh
        shape="cylinder"
        args={[0.06, 0.08, 1]}
        material={trunkMaterial}
        position={[0, 0.5, 0]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={() => setHovered((h) => !h)}
        castShadow
        receiveShadow
      />

      {/* Branches */}
      <LoDMesh shape="cylinder" args={[0.02, 0.03, 0.4]} material={trunkMaterial} position={[0.25, 0.8, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow />
      <LoDMesh shape="cylinder" args={[0.02, 0.03, 0.4]} material={trunkMaterial} position={[-0.25, 0.9, 0]} rotation={[0, 0, Math.PI / 4]} castShadow />
      <LoDMesh shape="cylinder" args={[0.02, 0.03, 0.35]} material={trunkMaterial} position={[0, 1, 0.25]} rotation={[Math.PI / 4, 0, 0]} castShadow />

      {/* Foliage instanced mesh */}
      <Instances ref={foliageInstancesRef} limit={leaves.length} range={leaves.length} geometry={new THREE.SphereGeometry(1, 16, 16)} material={leafMaterial} position={[0, 1.1, 0]}>
        {leaves.map((leaf, i) => (
          <Instance key={i} position={leaf.pos} scale={leaf.scale} />
        ))}
      </Instances>

      {/* Coin instanced mesh */}
      <Instances ref={coinInstancesRef} limit={coins.length} range={coins.length} geometry={new THREE.SphereGeometry(1, 16, 16)} material={coinMaterial} position={[0, 1.1, 0]}>
        {coins.map((coin, i) => (
          <Instance key={i} position={coin.pos} scale={0.08} />
        ))}
      </Instances>

      <pointLight position={[0, 1.2, 0]} color="#FFD84D" intensity={0.6} distance={3} />

      <Html position={[0, 1.8, 0]} center distanceFactor={10}>
        <div
          className="pointer-events-none select-none rounded-xl bg-white/90 backdrop-blur-md border border-white/40 px-3 py-2 text-mv-dark shadow-lg transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0, width: 'max-content', maxWidth: '220px' }}
          role="tooltip"
        >
          <strong className="block text-sm font-semibold text-mv-primary mb-1">Money Tree</strong>
          <span className="block text-xs leading-tight">Small savings can grow over time when you stay consistent.</span>
        </div>
      </Html>
    </group>
  );
}
