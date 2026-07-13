'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Building } from './Building';
import { MoneyTree } from './MoneyTree';
import LoDMesh from './LoDMesh';
import { BUILDINGS, isBuildingVisible } from './buildings';
import { getCurrentSeason, getSeasonTheme } from './Season';

interface IslandProps {
  scrollProgressRef: React.MutableRefObject<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  lowPower?: boolean;
  nightFactorRef?: React.MutableRefObject<number>;
}

export function Island({ scrollProgressRef, mouseRef, lowPower = false, nightFactorRef }: IslandProps) {
  const groupRef = useRef<THREE.Group>(null);
  const season = getCurrentSeason();
  const theme = getSeasonTheme(season);

  const groundMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: theme.ground, emissive: theme.ground, emissiveIntensity: 0.05 }),
    [theme.ground]
  );
  const dirtMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8B5A2B' }), []);

  useFrame((state) => {
    if (!groupRef.current || lowPower) return;
    const time = state.clock.getElapsedTime();
    const progress = scrollProgressRef.current;
    const mouse = mouseRef.current;

    const targetRotationY = time * 0.05 + mouse.x * 0.2;
    const targetRotationX = mouse.y * 0.05;
    groupRef.current.rotation.y += (targetRotationY - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.x += (targetRotationX - groupRef.current.rotation.x) * 0.05;
    groupRef.current.position.y = Math.sin(time * 0.5) * 0.05 + progress * 0.2;

    const targetScale = 1 + progress * 0.1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
  });

  const progress = scrollProgressRef.current;

  return (
    <group ref={groupRef}>
      <LoDMesh
        shape="cylinder"
        args={[4.5, 3.5, 1, 64]}
        material={groundMaterial}
        position={[0, -0.5, 0]}
        receiveShadow
        castShadow
      />

      <LoDMesh
        shape="cylinder"
        args={[3.5, 1.2, 1.5, 32]}
        material={dirtMaterial}
        position={[0, -1.2, 0]}
      />

      {BUILDINGS.map((b) => (
        <Building
          key={b.label}
          position={b.position}
          color={b.color}
          roofColor={b.roofColor}
          size={b.size}
          label={b.label}
          description={b.description}
          shape={b.shape}
          visible={isBuildingVisible(b.stage, progress)}
          nightFactorRef={nightFactorRef}
          season={season}
        />
      ))}

      <MoneyTree
        position={[-2.2, 0.1, 0.8]}
        scrollProgressRef={scrollProgressRef}
        nightFactorRef={nightFactorRef}
        season={season}
      />

      <LoDMesh
        shape="cylinder"
        args={[0.02, 0.02, 1.2, 8]}
        material={new THREE.MeshStandardMaterial({ color: '#e5e7eb' })}
        position={[2.5, 0.8, -0.5]}
        rotation={[0, 0, 0.5]}
      />
      <LoDMesh
        shape="box"
        args={[1.2, 0.05, 0.05]}
        material={new THREE.MeshStandardMaterial({ color: '#e5e7eb' })}
        position={[2.5, 1.4, -0.5]}
        rotation={[0, 0, 0.5]}
      />

      {/* Paths */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshStandardMaterial color="#d97706" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.0, 32]} />
        <meshStandardMaterial color="#d97706" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.4, 32]} />
        <meshStandardMaterial color="#d97706" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
