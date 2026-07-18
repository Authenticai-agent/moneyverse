'use client';

/**
 * GardenPlot - a small tilled-soil patch with a bucket-colored signpost, the
 * in-world home of each bucket. It's the visual feedback for that bucket's
 * coin button in GardenControls: as coins are planted there this year, the
 * coin pile on the plot visibly grows. Not interacted with directly.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { Bucket } from '@/app/lib/moneytree/types';
import { getToonGradientMap } from './toonGradient';
import { useWorldStore } from './useWorldStore';
import { terrainHeightAt } from './worldLayout';

const BUCKET_COLOR: Record<Bucket, string> = {
  safe: '#3FA34D', // green - steady and safe
  growth: '#3B82C4', // blue - balanced growth
  moonshot: '#DB4B3E', // red - high risk, high reward
};

const BUCKET_LABEL: Record<Bucket, string> = {
  safe: 'Safe Seed',
  growth: 'Growth',
  moonshot: 'Moonshot',
};

const SOIL_COLOR = '#6B4A32';
const POST_COLOR = '#8A5D34';
const MAX_VISIBLE_COINS = 10;

export function GardenPlot({ bucket, position }: { bucket: Bucket; position: [number, number] }) {
  const gradientMap = getToonGradientMap();
  // Show only coins that have actually LANDED: this year's count minus the
  // ones the mascot has tossed but are still mid-air. Each flying coin adds
  // itself to the pile the instant it lands (CoinThrower clears its in-flight
  // count then), so the pile grows on arrival, not on tap.
  const coins = useWorldStore((s) => Math.max(0, s.coinsThisYear[bucket] - s.coinsInFlight[bucket]));
  const baseY = terrainHeightAt(position[0], position[1]);
  const color = BUCKET_COLOR[bucket];

  // The signpost sits behind the plot; sample the terrain THERE so its post
  // always meets the ground instead of sinking into (or floating over) a
  // slope - the sinking was making the green/red signs read as buried.
  const SIGN_BACK = 1.4;
  const signYOffset = terrainHeightAt(position[0], position[1] - SIGN_BACK) - baseY;

  const coinOffsets = useMemo(
    () =>
      Array.from({ length: MAX_VISIBLE_COINS }, (_, i) => ({
        x: (Math.sin(i * 12.9) * 0.5) * 0.18,
        z: (Math.cos(i * 7.3) * 0.5) * 0.18,
        y: 0.05 + i * 0.05,
      })),
    []
  );

  return (
    <group position={[position[0], baseY, position[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <circleGeometry args={[1.3, 24]} />
        <meshToonMaterial color={SOIL_COLOR} gradientMap={gradientMap} />
      </mesh>

      {/* Signpost - taller and clearly above the soil, grounded on real terrain */}
      <group position={[0, signYOffset, -SIGN_BACK]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 1.1, 8]} />
          <meshToonMaterial color={POST_COLOR} gradientMap={gradientMap} />
        </mesh>
        <mesh position={[0, 1.18, 0]} castShadow>
          <boxGeometry args={[0.7, 0.44, 0.07]} />
          <meshToonMaterial color={color} gradientMap={gradientMap} />
        </mesh>
      </group>

      {/* Coin pile - grows with coins placed this year */}
      {coinOffsets.slice(0, coins).map((offset, i) => (
        <mesh key={i} position={[offset.x, offset.y, offset.z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.055, 16]} />
          <meshStandardMaterial color="#FFD84D" emissive="#F3C218" emissiveIntensity={0.2} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export { BUCKET_LABEL, BUCKET_COLOR };
