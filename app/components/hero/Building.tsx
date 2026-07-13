'use client';

import { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import LoDMesh from './LoDMesh';
import type { Season } from './Season';

type BuildingShape = 'box' | 'cylinder' | 'tower' | 'observatory' | 'vault' | 'stall' | 'hub' | 'garden';

interface BuildingProps {
  position: [number, number, number];
  color: string;
  size: [number, number, number];
  label: string;
  description: string;
  roofColor?: string;
  shape?: BuildingShape;
  visible?: boolean;
  nightFactorRef?: React.MutableRefObject<number>;
  season?: Season;
}

function baseMaterial(color: string, emissive = color, emissiveIntensity = 0.05) {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity });
}

export function Building({
  position,
  color,
  size,
  label,
  description,
  roofColor,
  shape = 'box',
  visible = true,
  nightFactorRef,
  season = 'summer',
}: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const bodyMaterial = useMemo(() => baseMaterial(color, color, 0.05), [color]);
  const accentMaterial = useMemo(() => baseMaterial(roofColor || color, roofColor || color, 0.2), [roofColor, color]);
  const gardenMaterial = useMemo(
    () =>
      baseMaterial(
        season === 'autumn' ? '#d97706' : season === 'winter' ? '#94a3b8' : '#5FD38D',
        '#5FD38D',
        0
      ),
    [season]
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const targetY = hovered ? 0.1 : 0;
    const targetScale = visible ? 1 : 0;

    groupRef.current.position.y += (position[1] + targetY - groupRef.current.position.y) * 0.1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    const night = nightFactorRef?.current ?? 0;
    bodyMaterial.emissiveIntensity = hovered ? 0.25 : Math.max(0.05, night * 0.2);
    accentMaterial.emissiveIntensity = hovered ? 0.35 : Math.max(0.1, night * 0.25);
  });

  return (
    <group ref={groupRef} position={position}>
      {shape === 'box' && (
        <LoDMesh
          shape="box"
          args={[size[0], size[1], size[2]]}
          material={bodyMaterial}
          position={[0, size[1] / 2, 0]}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={() => setHovered((h) => !h)}
          castShadow
          receiveShadow
        />
      )}

      {shape === 'tower' && (
        <LoDMesh
          shape="box"
          args={[size[0], size[1], size[2]]}
          material={bodyMaterial}
          position={[0, size[1] / 2, 0]}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={() => setHovered((h) => !h)}
          castShadow
          receiveShadow
        />
      )}

      {(shape === 'cylinder' || shape === 'observatory' || shape === 'vault') && (
        <LoDMesh
          shape="cylinder"
          args={[size[0] / 2, size[0] / 2, size[1]]}
          material={bodyMaterial}
          position={[0, size[1] / 2, 0]}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={() => setHovered((h) => !h)}
          castShadow
          receiveShadow
        />
      )}

      {shape === 'box' && roofColor && (
        <LoDMesh
          shape="cone"
          args={[size[0] * 0.7, 0.5]}
          material={accentMaterial}
          position={[0, size[1] + 0.25, 0]}
          castShadow
          receiveShadow
        />
      )}

      {shape === 'observatory' && (
        <LoDMesh
          shape="sphere"
          args={[size[0] / 2]}
          material={accentMaterial}
          position={[0, size[1] + 0.25, 0]}
          castShadow
          receiveShadow
        />
      )}

      {shape === 'vault' && (
        <>
          <LoDMesh
            shape="cylinder"
            args={[size[0] / 2.2, size[0] / 2.2, 0.4]}
            material={accentMaterial}
            position={[0, size[1] + 0.2, 0]}
            castShadow
            receiveShadow
          />
          <LoDMesh
            shape="cylinder"
            args={[0.08, 0.08, 0.05]}
            material={baseMaterial('#FFD84D', '#FFD84D', 0.5)}
            position={[0, size[1] + 0.1, size[0] / 2.5]}
            rotation={[Math.PI / 2, 0, 0]}
          />
        </>
      )}

      {shape === 'stall' && (
        <>
          <LoDMesh
            shape="box"
            args={[size[0], size[1], size[2]]}
            material={bodyMaterial}
            position={[0, size[1] / 2, 0]}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onClick={() => setHovered((h) => !h)}
            castShadow
            receiveShadow
          />
          <LoDMesh
            shape="cone"
            args={[size[0] * 0.9, 0.6]}
            material={accentMaterial}
            position={[0, size[1] + 0.35, 0]}
            castShadow
            receiveShadow
          />
        </>
      )}

      {shape === 'hub' && (
        <>
          <LoDMesh
            shape="box"
            args={[size[0], size[1] * 0.5, size[2]]}
            material={bodyMaterial}
            position={[0, size[1] * 0.25, 0]}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onClick={() => setHovered((h) => !h)}
            castShadow
            receiveShadow
          />
          <LoDMesh
            shape="box"
            args={[0.5, 0.3, 0.2]}
            material={baseMaterial('#60a5fa', '#60a5fa', 0.1)}
            position={[0.5, 0.2, 0]}
            castShadow
          />
        </>
      )}

      {shape === 'garden' && (
        <>
          <LoDMesh
            shape="box"
            args={[size[0], size[1] * 0.2, size[2]]}
            material={gardenMaterial}
            position={[0, size[1] * 0.1, 0]}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
            onClick={() => setHovered((h) => !h)}
            castShadow
            receiveShadow
          />
          <LoDMesh
            shape="box"
            args={[0.1, 0.4, 0.1]}
            material={baseMaterial(season === 'autumn' ? '#f59e0b' : '#22c55e', '#22c55e', 0)}
            position={[0, size[1] * 0.3, 0]}
            castShadow
          />
        </>
      )}

      <Html position={[0, size[1] / 2 + 0.7, 0]} center distanceFactor={10}>
        <div
          className="pointer-events-none select-none rounded-xl bg-white/90 backdrop-blur-md border border-white/40 px-3 py-2 text-mv-dark shadow-lg transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0, width: 'max-content', maxWidth: '220px' }}
          role="tooltip"
        >
          <strong className="block text-sm font-semibold text-mv-primary mb-1">{label}</strong>
          <span className="block text-xs leading-tight">{description}</span>
        </div>
      </Html>
    </group>
  );
}
