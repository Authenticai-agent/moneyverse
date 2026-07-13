'use client';

import { Detailed } from '@react-three/drei';
import * as THREE from 'three';

type ShapeType = 'box' | 'cylinder' | 'cone' | 'sphere';

interface LoDMeshProps {
  shape: ShapeType;
  args: number[];
  material: THREE.Material;
  position?: [number, number, number];
  rotation?: [number, number, number];
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onClick?: () => void;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

function createGeometry(shape: ShapeType, args: number[], segments: number) {
  switch (shape) {
    case 'box':
      return (
        <boxGeometry
          args={[
            args[0] || 1,
            args[1] || 1,
            args[2] || 1,
            Math.max(1, segments),
            Math.max(1, segments),
            Math.max(1, segments),
          ]}
        />
      );
    case 'cylinder':
      return (
        <cylinderGeometry
          args={[
            args[0] || 0.5,
            args[1] || 0.5,
            args[2] || 1,
            Math.max(3, segments),
            Math.max(1, segments),
          ]}
        />
      );
    case 'cone':
      return (
        <coneGeometry
          args={[
            args[0] || 0.5,
            args[1] || 1,
            Math.max(3, segments),
            Math.max(1, segments),
          ]}
        />
      );
    case 'sphere':
      return (
        <sphereGeometry
          args={[
            args[0] || 0.5,
            Math.max(4, segments),
            Math.max(4, segments),
          ]}
        />
      );
    default:
      return <boxGeometry args={[1, 1, 1]} />;
  }
}

export default function LoDMesh({
  shape,
  args,
  material,
  position,
  rotation,
  onPointerEnter,
  onPointerLeave,
  onClick,
  castShadow,
  receiveShadow,
}: LoDMeshProps) {
  const high = createGeometry(shape, args, 16);
  const medium = createGeometry(shape, args, 8);
  const low = createGeometry(shape, args, 4);

  return (
    <Detailed distances={[0, 8, 16]}>
      <mesh
        position={position}
        rotation={rotation}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
      >
        {high}
        <primitive object={material} attach="material" />
      </mesh>
      <mesh
        position={position}
        rotation={rotation}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
      >
        {medium}
        <primitive object={material} attach="material" />
      </mesh>
      <mesh
        position={position}
        rotation={rotation}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onClick={onClick}
      >
        {low}
        <primitive object={material} attach="material" />
      </mesh>
    </Detailed>
  );
}
