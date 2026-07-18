'use client';

/**
 * Bell - purely decorative feedback now (it used to be a walk-up station).
 * An A-frame stand with a bell that swings and rings whenever a year actually
 * resolves - the visual "ring" that answers the on-screen "Grow the year"
 * button - and brightens gold once every coin this year is placed
 * (canResolveYear) as a "ready to grow" cue. Nothing interacts with it
 * directly.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getToonGradientMap } from './toonGradient';
import { useWorldStore } from './useWorldStore';
import { BELL_POSITION, terrainHeightAt } from './worldLayout';

const POST_COLOR = '#8A5D34';
const BELL_DIM = '#8C7A4A';
const BELL_READY = '#FFD84D';

export function Bell() {
  const gradientMap = getToonGradientMap();
  const bellRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const swingRef = useRef(0);
  const prevYearRef = useRef(useWorldStore.getState().year);
  const baseY = terrainHeightAt(BELL_POSITION[0], BELL_POSITION[1]);

  useFrame((_, delta) => {
    const { year, canResolveYear } = useWorldStore.getState();
    if (year !== prevYearRef.current) {
      prevYearRef.current = year;
      swingRef.current = 1;
    }
    swingRef.current *= Math.max(0, 1 - delta * 2.5);
    if (bellRef.current) {
      bellRef.current.rotation.z = Math.sin(swingRef.current * Math.PI * 4) * swingRef.current * 0.5;
    }
    if (materialRef.current) {
      const ready = canResolveYear();
      const target = ready ? new THREE.Color(BELL_READY) : new THREE.Color(BELL_DIM);
      materialRef.current.color.lerp(target, Math.min(1, delta * 4));
      materialRef.current.emissiveIntensity = ready ? 0.35 + Math.sin(swingRef.current * 10) * 0.1 : 0.05;
    }
  });

  return (
    <group position={[BELL_POSITION[0], baseY, BELL_POSITION[1]]}>
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.6, 0]} rotation={[0, 0, x > 0 ? -0.25 : 0.25]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 1.3, 8]} />
          <meshToonMaterial color={POST_COLOR} gradientMap={gradientMap} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.05, 8]} />
        <meshToonMaterial color={POST_COLOR} gradientMap={gradientMap} />
      </mesh>

      <group ref={bellRef} position={[0, 0.85, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.24, 0.34, 14, 1, true]} />
          <meshStandardMaterial ref={materialRef} color={BELL_DIM} emissive="#FFC24B" emissiveIntensity={0.05} metalness={0.6} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.17, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#5C4A28" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}
