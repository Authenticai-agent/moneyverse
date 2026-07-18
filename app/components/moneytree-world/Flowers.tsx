'use client';

/**
 * Flowers - little toon-shaded flower clusters scattered through the garden
 * courtyard for charm: a green stem, a colored petal ring, and a golden
 * center. Deterministically placed (stable across reloads) in a ring around
 * the central mound, kept clear of the tree, the plots, and the pond so they
 * decorate the edges rather than clutter the play area.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { getToonGradientMap } from './toonGradient';
import { terrainHeightAt } from './worldLayout';

const PETAL_COLORS = ['#FF7EB6', '#FFD84D', '#FFFFFF', '#FF9E7A', '#C58BE0', '#7FC8F8'];
const STEM_COLOR = '#4F9E4A';
const CENTER_COLOR = '#F3C218';

const DEFAULT_COUNT = 40;
const INNER_RADIUS = 6.5; // clear of the tree + plots + bell
const OUTER_RADIUS = 12;

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

type Flower = { position: [number, number, number]; color: string; scale: number; rotationY: number };

function buildFlowers(count: number): Flower[] {
  const flowers: Flower[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand(i) * 0.5;
    const radius = INNER_RADIUS + rand(i + 100) * (OUTER_RADIUS - INNER_RADIUS);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    // Skip anything that would land in the pond (front-right of the mound).
    if (x > 5 && z > 3 && x < 12 && z < 10) continue;
    flowers.push({
      position: [x, terrainHeightAt(x, z), z],
      color: PETAL_COLORS[i % PETAL_COLORS.length],
      scale: 0.7 + rand(i + 200) * 0.6,
      rotationY: rand(i + 300) * Math.PI * 2,
    });
  }
  return flowers;
}

function Flower({ position, color, scale, rotationY, gradientMap }: Flower & { gradientMap: THREE.DataTexture }) {
  const petals = useMemo(() => Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2), []);
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.32, 5]} />
        <meshToonMaterial color={STEM_COLOR} gradientMap={gradientMap} />
      </mesh>
      <group position={[0, 0.34, 0]}>
        {petals.map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09]} castShadow>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshToonMaterial color={color} gradientMap={gradientMap} />
          </mesh>
        ))}
        <mesh>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshToonMaterial color={CENTER_COLOR} gradientMap={gradientMap} />
        </mesh>
      </group>
    </group>
  );
}

export function Flowers({ count = DEFAULT_COUNT }: { count?: number }) {
  const gradientMap = getToonGradientMap();
  const flowers = useMemo(() => buildFlowers(count), [count]);
  return (
    <>
      {flowers.map((f, i) => (
        <Flower key={i} {...f} gradientMap={gradientMap} />
      ))}
    </>
  );
}
