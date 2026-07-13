'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { Season } from './Season';

interface SeasonalParticlesProps {
  season: Season;
  lowPower?: boolean;
  nightFactorRef?: React.MutableRefObject<number>;
}

function createPoints(count: number, radius: number, y: number) {
  const positions = new Float32Array(count * 3);
  const velocities: number[] = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * radius * 2;
    positions[i * 3 + 1] = y + Math.random() * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
    velocities.push((Math.random() - 0.5) * 0.01, -0.005 - Math.random() * 0.01, (Math.random() - 0.5) * 0.01);
  }
  return { positions, velocities };
}

function FallingPoints({
  count,
  color,
  radius,
  speed,
  lowPower,
}: {
  count: number;
  color: string;
  radius: number;
  speed: number;
  lowPower: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const actualCount = lowPower ? Math.floor(count / 3) : count;
  const { positions, velocities } = useMemo(() => createPoints(actualCount, radius, 3), [actualCount, radius]);
  const originalY = useMemo(() => positions.slice(1), [positions]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < actualCount; i++) {
      pos[i * 3] += velocities[i * 3] * speed;
      pos[i * 3 + 1] += velocities[i * 3 + 1] * speed;
      pos[i * 3 + 2] += velocities[i * 3 + 2] * speed;
      if (pos[i * 3 + 1] < -2) {
        pos[i * 3] = (Math.random() - 0.5) * radius * 2;
        pos[i * 3 + 1] = 5 + Math.random() * 2;
        pos[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={actualCount} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.08} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function SeasonalParticles({ season, lowPower = false, nightFactorRef }: SeasonalParticlesProps) {
  const night = nightFactorRef?.current ?? 0;

  if (season === 'spring' || season === 'summer') {
    return (
      <Sparkles
        count={lowPower ? 20 : 50}
        color={season === 'spring' ? '#f0abfc' : '#FFD84D'}
        size={0.15}
        speed={0.5}
        opacity={0.6 - night * 0.3}
        scale={6}
      />
    );
  }

  if (season === 'autumn') {
    return <FallingPoints count={120} color="#f59e0b" radius={4} speed={1.5} lowPower={lowPower} />;
  }

  if (season === 'winter') {
    return <FallingPoints count={200} color="#ffffff" radius={5} speed={1} lowPower={lowPower} />;
  }

  return null;
}
