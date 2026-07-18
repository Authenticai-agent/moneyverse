'use client';

/**
 * MoneyTree - the centerpiece: a procedural, toon-shaded tree at a quiet spot
 * by the pond, with a log bench beside it, whose shape literally IS the
 * portfolio. Three canopy lobes (one per bucket) grow individually with that
 * bucket's own dollar share, so a safe-heavy portfolio visibly reads as a
 * lopsided tree, not just a bigger or smaller one. Overall size follows the
 * same smooth sqrt growth curve as the 2D game's TreeScene (`growthFactor`),
 * health tints green-to-wilted with `mood`, small coin props appear at
 * wealth milestones, and a sparkle burst fires from the canopy whenever the
 * total goes up.
 *
 * Deliberately procedural, not the GLB TreeModel from app/components/moneytree
 * - that folder is frozen and slated for deletion after the Phase 6 swap, and
 * this world is meant to stand alone as its replacement.
 */

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUCKETS, type Bucket } from '@/app/lib/moneytree/types';
import { getToonGradientMap } from './toonGradient';
import { useWorldStore, type WorldMood } from './useWorldStore';
import { MONEY_TREE_POSITION, terrainHeightAt } from './worldLayout';

const TRUNK_COLOR = '#8B6136';
const HEALTHY_COLOR = new THREE.Color('#5FD38D');
const WILTED_COLOR = new THREE.Color('#B99A5B');
const GOOD_GLOW_COLOR = new THREE.Color('#8CF0A8');
const WOOD_COLOR = '#B9834F';
const WOOD_DARK = '#8A5D34';

const LOBE_ANGLE: Record<Bucket, number> = {
  safe: 0,
  growth: (Math.PI * 2) / 3,
  moonshot: (Math.PI * 4) / 3,
};
const LOBE_RADIUS = 1.1;

const GROWTH_REFERENCE = 50000; // total ($) at which the tree reaches full size
const COIN_TIERS = [400, 1500, 4000, 10000, 20000];

const MOOD_BASE_TINT: Record<WorldMood, THREE.Color> = {
  good: GOOD_GLOW_COLOR,
  bad: HEALTHY_COLOR,
  neutral: HEALTHY_COLOR,
};

function growthFactor(total: number): number {
  // A wider range than before so growth is dramatic and legible: a fresh
  // seedling starts small and the tree visibly balloons as wealth builds.
  return 0.4 + Math.sqrt(Math.min(Math.max(total, 0), GROWTH_REFERENCE) / GROWTH_REFERENCE) * 1.35;
}

function bucketScale(value: number, total: number): number {
  const fraction = total > 0 ? value / total : 1 / 3;
  return 0.4 + Math.sqrt(fraction) * 1.15;
}

const LOBE_PUFFS: { position: [number, number, number]; radius: number }[] = [
  { position: [0, 0, 0], radius: 0.62 },
  { position: [0.32, -0.08, 0.1], radius: 0.42 },
  { position: [-0.3, -0.1, -0.12], radius: 0.4 },
  { position: [0.05, 0.28, -0.2], radius: 0.38 },
];

/** One canopy lobe: a small cluster of overlapping spheres, like the sky's
 * cloud puffs, but foliage-colored - cheap, and reads as a soft round mass
 * from any angle without needing a sculpted mesh. Shares one material
 * (passed down from MoneyTree) with every other lobe so tinting the whole
 * canopy for mood is a single color mutation, not a per-mesh loop. */
function CanopyLobe({ angle, scale, material }: { angle: number; scale: number; material: THREE.MeshToonMaterial }) {
  return (
    <group position={[Math.sin(angle) * LOBE_RADIUS, 0.15, Math.cos(angle) * LOBE_RADIUS]} scale={scale}>
      {LOBE_PUFFS.map((puff, i) => (
        <mesh key={i} position={puff.position} scale={puff.radius} material={material} castShadow>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
      ))}
    </group>
  );
}

function Coin({ position, seed }: { position: [number, number, number]; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += delta * 0.9;
    g.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + seed) * 0.05;
  });
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.055, 20]} />
        <meshStandardMaterial color="#FFD84D" emissive="#F3C218" emissiveIntensity={0.25} metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** A simple log bench beside the tree - somewhere to sit while the money
 * grows. Purely a visual invitation for now; an actual sit interaction is a
 * later phase's job. */
function Bench({ gradientMap }: { gradientMap: THREE.DataTexture }) {
  return (
    <group position={[1.7, 0, 1.3]} rotation={[0, -Math.PI / 5, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.14, 1.3, 10]} />
        <meshToonMaterial color={WOOD_COLOR} gradientMap={gradientMap} />
      </mesh>
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.28, 8]} />
          <meshToonMaterial color={WOOD_DARK} gradientMap={gradientMap} />
        </mesh>
      ))}
    </group>
  );
}

const COIN_POSITIONS: [number, number, number][] = [
  [0.75, 1.3, 0.3],
  [-0.65, 1.0, 0.4],
  [0.25, 1.7, -0.5],
  [-0.5, 1.6, -0.25],
  [0.55, 0.85, -0.55],
];

/** A one-shot puff of golden sparks fired from the canopy whenever the
 * portfolio's total meaningfully increases - ported from TreeScene's
 * GrowthBurst, built directly on a Points buffer rather than one mesh per
 * particle. */
function GrowthBurst({ origin, onDone }: { origin: [number, number, number]; onDone: () => void }) {
  const COUNT = 24;
  const LIFETIME = 1.1;
  const pointsRef = useRef<THREE.Points>(null);
  const basePos = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.8;
      arr[i * 3 + 0] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = Math.random() * 0.3;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);
  const velocities = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 0.7;
      arr[i * 3 + 1] = 1.0 + Math.random() * 0.8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
    }
    return arr;
  }, []);
  const delays = useMemo(() => Array.from({ length: COUNT }, () => Math.random() * 0.25), []);
  const positions = useMemo(() => basePos.slice(), [basePos]);
  const elapsed = useRef(0);

  useFrame((_, dt) => {
    elapsed.current += dt;
    const attr = pointsRef.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!attr) return;
    let allExpired = true;
    for (let i = 0; i < COUNT; i++) {
      const t = Math.min(Math.max(0, elapsed.current - delays[i]), LIFETIME);
      if (elapsed.current - delays[i] < LIFETIME) allExpired = false;
      attr.array[i * 3 + 0] = basePos[i * 3 + 0] + velocities[i * 3 + 0] * t;
      attr.array[i * 3 + 1] = basePos[i * 3 + 1] + velocities[i * 3 + 1] * t - 0.8 * t * t;
      attr.array[i * 3 + 2] = basePos[i * 3 + 2] + velocities[i * 3 + 2] * t;
    }
    attr.needsUpdate = true;
    const mat = pointsRef.current?.material as THREE.PointsMaterial | undefined;
    if (mat) mat.opacity = Math.max(0, 1 - elapsed.current / LIFETIME);
    if (allExpired) onDone();
  });

  return (
    <points ref={pointsRef} position={origin}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.12} color="#FFD84D" transparent opacity={1} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export function MoneyTree() {
  const gradientMap = getToonGradientMap();
  const groupRef = useRef<THREE.Group>(null);
  const canopyMaterial = useMemo(() => new THREE.MeshToonMaterial({ color: HEALTHY_COLOR, gradientMap }), [gradientMap]);
  const tintRef = useRef(new THREE.Color());
  const scaleRef = useRef(growthFactor(0));
  const wiltRef = useRef(0);
  const prevTotalRef = useRef(0);
  // A short-lived "pop" that fires on a good year: eases up to 1 then decays,
  // driving a springy overshoot on the tree's scale so a good outcome reads
  // as a visible celebratory bounce, not just a color shift.
  const popRef = useRef(0);
  const prevMoodRef = useRef<WorldMood>('neutral');
  const [burstId, setBurstId] = useState(0);
  const [activeBurst, setActiveBurst] = useState<number | null>(null);

  const baseY = terrainHeightAt(MONEY_TREE_POSITION[0], MONEY_TREE_POSITION[1]);

  useFrame((state, delta) => {
    const { portfolio, mood } = useWorldStore.getState();
    const total = portfolio.safe + portfolio.growth + portfolio.moonshot;

    if (total > prevTotalRef.current + 0.5) {
      setBurstId((id) => id + 1);
      setActiveBurst((id) => (id ?? 0) + 1);
    }
    prevTotalRef.current = total;

    // Kick the celebratory pop the moment mood flips to good.
    if (mood === 'good' && prevMoodRef.current !== 'good') popRef.current = 1;
    prevMoodRef.current = mood;
    popRef.current = Math.max(0, popRef.current - delta * 1.8);
    const pop = Math.sin(popRef.current * Math.PI) * 0.12;

    const targetScale = growthFactor(total);
    scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, delta * 3);
    const g = groupRef.current;
    if (g) {
      g.scale.setScalar(scaleRef.current * (1 + pop));
      // Gentle idle sway so the tree feels alive rather than frozen.
      const t = state.clock.elapsedTime;
      g.rotation.x = Math.sin(t * 0.7) * 0.015;
      g.position.y = Math.sin(t * 0.9) * 0.02;
    }

    const targetWilt = mood === 'bad' ? 1 : 0;
    wiltRef.current += (targetWilt - wiltRef.current) * Math.min(1, delta * 2.5);
    tintRef.current.copy(MOOD_BASE_TINT[mood]).lerp(WILTED_COLOR, wiltRef.current);
    canopyMaterial.color.copy(tintRef.current);

    if (g) g.rotation.z = -wiltRef.current * 0.05 + Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
  });

  const portfolio = useWorldStore((s) => s.portfolio);
  const total = portfolio.safe + portfolio.growth + portfolio.moonshot;

  return (
    <group position={[MONEY_TREE_POSITION[0], baseY, MONEY_TREE_POSITION[1]]}>
      <Bench gradientMap={gradientMap} />
      <group ref={groupRef}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.32, 1.0, 10]} />
          <meshToonMaterial color={TRUNK_COLOR} gradientMap={gradientMap} />
        </mesh>
        <group position={[0, 1.15, 0]}>
          {BUCKETS.map((bucket) => (
            <CanopyLobe key={bucket} angle={LOBE_ANGLE[bucket]} scale={bucketScale(portfolio[bucket], total)} material={canopyMaterial} />
          ))}
        </group>
        {COIN_TIERS.map((tier, i) => (total > tier ? <Coin key={i} position={COIN_POSITIONS[i]} seed={i} /> : null))}
      </group>
      {activeBurst !== null && activeBurst === burstId && (
        <GrowthBurst key={burstId} origin={[0, 1.6, 0]} onDone={() => setActiveBurst(null)} />
      )}
    </group>
  );
}
