'use client';

/**
 * Decor - the "good parts" of app/components/moneytree/Environment.tsx
 * (procedural pines, rocks, fence posts, flickering lanterns, the lily pond)
 * ported into the new 60x60 walkable field. These were built for a ~6-unit
 * diorama; positions here are freshly composed around the path loop rather
 * than copied verbatim.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getToonGradientMap } from './toonGradient';
import { DOCK_POSITION, TREE_POSITION, WORLD_SIZE, terrainHeightAt } from './worldLayout';

const PINE_FOLIAGE = '#3E7C4A';
const PINE_TRUNK = '#8B5A2B';
const WOOD_COLOR = '#B9834F';
const WOOD_DARK = '#8A5D34';
const ROCK_COLOR = '#9C9C94';

/** Tiny deterministic PRNG (mulberry32) so the decor scatter is stable
 * across renders/hot-reloads instead of reshuffling with Math.random(). */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function PineTree({ position, scale = 1, rotationY = 0 }: { position: [number, number, number]; scale?: number; rotationY?: number }) {
  const gradientMap = getToonGradientMap();
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.13, 0.8, 8]} />
        <meshToonMaterial color={PINE_TRUNK} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.9, 1.5, 8]} />
        <meshToonMaterial color={PINE_FOLIAGE} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.68, 1.2, 8]} />
        <meshToonMaterial color={PINE_FOLIAGE} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 2.65, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.48, 0.9, 8]} />
        <meshToonMaterial color={PINE_FOLIAGE} gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale, seed }: { position: [number, number, number]; scale: number; seed: number }) {
  const gradientMap = getToonGradientMap();
  return (
    <mesh position={position} rotation={[seed, seed * 1.3, seed * 0.7]} scale={scale} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshToonMaterial color={ROCK_COLOR} gradientMap={gradientMap} />
    </mesh>
  );
}

function Lantern({ position, withLight = true }: { position: [number, number, number]; withLight?: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const gradientMap = getToonGradientMap();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flicker = 0.85 + Math.sin(t * 9) * 0.08 + Math.sin(t * 3.7) * 0.05;
    if (lightRef.current) lightRef.current.intensity = 0.5 * flicker;
    const mat = flameRef.current?.material as THREE.MeshStandardMaterial | undefined;
    if (mat) mat.emissiveIntensity = 1.1 * flicker;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.045, 0.055, 1.0, 8]} />
        <meshToonMaterial color={WOOD_DARK} gradientMap={gradientMap} />
      </mesh>
      <mesh ref={flameRef} position={[0, 1.05, 0]}>
        <boxGeometry args={[0.16, 0.2, 0.16]} />
        <meshStandardMaterial color="#FFE9A8" emissive="#FFC24B" emissiveIntensity={1.1} />
      </mesh>
      {/* The dynamic point light is the expensive part - a real per-fragment
       * light. On low-tier devices we keep the glowing lantern but drop the
       * light itself (these lanterns sit out in the distant field anyway). */}
      {withLight && <pointLight ref={lightRef} position={[0, 1.05, 0]} color="#FFC24B" intensity={0.5} distance={4} decay={2} />}
    </group>
  );
}

function FencePost({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const gradientMap = getToonGradientMap();
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.6, 8]} />
        <meshToonMaterial color={WOOD_DARK} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.25, 0.36, 0]} castShadow>
        <boxGeometry args={[0.45, 0.06, 0.06]} />
        <meshToonMaterial color={WOOD_COLOR} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.25, 0.2, 0]} castShadow>
        <boxGeometry args={[0.45, 0.06, 0.06]} />
        <meshToonMaterial color={WOOD_COLOR} gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

function Pond({ position }: { position: [number, number, number] }) {
  const waterRef = useRef<THREE.Mesh>(null);
  const gradientMap = getToonGradientMap();
  useFrame((state) => {
    const mat = waterRef.current?.material as THREE.MeshStandardMaterial | undefined;
    if (mat) mat.emissiveIntensity = 0.12 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
  });
  const pads = [
    { angle: 0.4, radius: 1.1, scale: 0.32 },
    { angle: 2.6, radius: 1.5, scale: 0.26 },
    { angle: 4.4, radius: 1.0, scale: 0.22 },
    { angle: 5.6, radius: 1.7, scale: 0.28 },
  ];
  return (
    <group position={position}>
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[3.2, 40]} />
        <meshStandardMaterial color="#6FB8D6" emissive="#3E86A8" emissiveIntensity={0.12} roughness={0.3} metalness={0.1} />
      </mesh>
      {pads.map((p, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[Math.cos(p.angle) * p.radius, 0.03, Math.sin(p.angle) * p.radius]}
          scale={p.scale}
        >
          <circleGeometry args={[1, 12]} />
          <meshToonMaterial color="#5FAE5C" gradientMap={gradientMap} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Dock({ position }: { position: [number, number, number] }) {
  const gradientMap = getToonGradientMap();
  const planks = 6;
  const legOffsets: [number, number][] = [
    [-0.7, -0.2],
    [0.7, -0.2],
    [-0.7, -planks * 0.55 + 0.3],
    [0.7, -planks * 0.55 + 0.3],
  ];
  return (
    <group position={position}>
      {Array.from({ length: planks }).map((_, i) => (
        <mesh key={i} position={[0, 0.12, -i * 0.55]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.08, 0.5]} />
          <meshToonMaterial color={WOOD_COLOR} gradientMap={gradientMap} />
        </mesh>
      ))}
      {legOffsets.map(([x, z], i) => (
        <mesh key={i} position={[x, -0.3, z]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
          <meshToonMaterial color={WOOD_DARK} gradientMap={gradientMap} />
        </mesh>
      ))}
    </group>
  );
}

const LANTERN_POSITIONS: [number, number][] = [
  [-13, 9],
  [-6, -3],
  [8, -2],
  [16, 8],
];

export function Decor({ lanternLights = true }: { lanternLights?: boolean }) {
  const scattered = useMemo(() => {
    const rand = mulberry32(20260716);
    const half = WORLD_SIZE / 2;
    const pines: { position: [number, number, number]; scale: number; rotationY: number }[] = [];
    const rocks: { position: [number, number, number]; scale: number; seed: number }[] = [];

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + rand() * 0.3;
      const radius = half - 4 - rand() * 4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      pines.push({
        position: [x, terrainHeightAt(x, z), z],
        scale: 0.8 + rand() * 0.6,
        rotationY: rand() * Math.PI * 2,
      });
    }

    for (let i = 0; i < 10; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 6 + rand() * (half - 10);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      rocks.push({ position: [x, terrainHeightAt(x, z), z], scale: 0.3 + rand() * 0.4, seed: rand() * 6 });
    }

    return { pines, rocks };
  }, []);

  return (
    <>
      {scattered.pines.map((p, i) => (
        <PineTree key={`pine-${i}`} position={p.position} scale={p.scale} rotationY={p.rotationY} />
      ))}
      {scattered.rocks.map((r, i) => (
        <Rock key={`rock-${i}`} position={r.position} scale={r.scale} seed={r.seed} />
      ))}

      {/* A short cottage-style fence flanking the tree mound. */}
      {[-3, -2.4, -1.8].map((x, i) => {
        const z = TREE_POSITION[1] - 3.5;
        return <FencePost key={`fl-${i}`} position={[TREE_POSITION[0] + x, terrainHeightAt(TREE_POSITION[0] + x, z), z]} />;
      })}
      {[1.8, 2.4, 3].map((x, i) => {
        const z = TREE_POSITION[1] - 3.5;
        return <FencePost key={`fr-${i}`} position={[TREE_POSITION[0] + x, terrainHeightAt(TREE_POSITION[0] + x, z), z]} />;
      })}

      {LANTERN_POSITIONS.map(([x, z], i) => (
        <Lantern key={`lantern-${i}`} position={[x, terrainHeightAt(x, z), z]} withLight={lanternLights} />
      ))}

      <Pond position={[DOCK_POSITION[0] + 3, terrainHeightAt(DOCK_POSITION[0] + 3, DOCK_POSITION[1] + 2), DOCK_POSITION[1] + 2]} />
      <Dock position={[DOCK_POSITION[0], terrainHeightAt(DOCK_POSITION[0], DOCK_POSITION[1]), DOCK_POSITION[1]]} />
    </>
  );
}
