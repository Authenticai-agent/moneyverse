'use client';

import { useState, useEffect, useRef, Suspense, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Use local Draco decoder from three.js
useGLTF.setDecoderPath('/draco/gltf/');

interface GLTFModelProps {
  fallback: ReactNode;
  reducedMotion?: boolean;
  lowPower?: boolean;
  mouseRef?: React.MutableRefObject<{ x: number; y: number }>;
}

function LoadedModel({
  reducedMotion = false,
  lowPower = false,
  mouseRef,
}: {
  reducedMotion?: boolean;
  lowPower?: boolean;
  mouseRef?: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const { scene, nodes } = useGLTF('/models/hero-island.glb', true, true);
  const baseRef = useRef({ coinsY: 0, cloudsX: 0, glowOpacity: 0.8 });
  const rotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const coins = nodes['Money_Tree_Coins'] as THREE.Object3D | undefined;
    const clouds = nodes['Clouds'] as THREE.Object3D | undefined;
    const glow = nodes['Money_Tree_Glow'] as THREE.Mesh | undefined;

    if (coins) baseRef.current.coinsY = coins.position.y;
    if (clouds) baseRef.current.cloudsX = clouds.position.x;
    if (glow && (glow.material as THREE.MeshStandardMaterial)?.opacity !== undefined) {
      baseRef.current.glowOpacity = (glow.material as THREE.MeshStandardMaterial).opacity;
    }
  }, [nodes]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (!reducedMotion && !lowPower) {
      const windTurbines = nodes['Wind_Turbines'] as THREE.Object3D | undefined;
      if (windTurbines) {
        windTurbines.rotation.y += delta * 0.3;
      }

      const clouds = nodes['Clouds'] as THREE.Object3D | undefined;
      if (clouds) {
        clouds.position.x = baseRef.current.cloudsX + Math.sin(t * 0.08) * 0.4;
      }

      const coins = nodes['Money_Tree_Coins'] as THREE.Object3D | undefined;
      if (coins) {
        coins.position.y = baseRef.current.coinsY + Math.sin(t * 1.5) * 0.05;
        coins.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.material && 'emissiveIntensity' in mesh.material) {
            (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.3;
          }
        });
      }

      const glow = nodes['Money_Tree_Glow'] as THREE.Mesh | undefined;
      if (glow && glow.material) {
        const material = glow.material as THREE.MeshStandardMaterial;
        material.transparent = true;
        material.opacity = baseRef.current.glowOpacity + Math.sin(t * 1.2) * 0.2;
        if ('emissiveIntensity' in material) {
          material.emissiveIntensity = 0.6 + Math.sin(t * 1.2) * 0.3;
        }
      }
    }

    if (mouseRef) {
      const mouse = mouseRef.current;
      const targetY = mouse.x * 0.4;
      const targetX = mouse.y * 0.12;
      rotationRef.current.x += (targetX - rotationRef.current.x) * 0.05;
      rotationRef.current.y += (targetY - rotationRef.current.y) * 0.05;
      scene.rotation.x = rotationRef.current.x;
      scene.rotation.y = rotationRef.current.y;
    }

    scene.position.y = Math.sin(t * 0.5) * 0.08;
  });

  return <primitive object={scene} />;
}

export default function GLTFModel({ fallback, reducedMotion, lowPower, mouseRef }: GLTFModelProps) {
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/models/hero-island.glb', { method: 'HEAD' })
      .then((res) => setExists(res.ok))
      .catch(() => setExists(false));
  }, []);

  if (exists === null || !exists) return <>{fallback}</>;

  return (
    <Suspense fallback={fallback}>
      <LoadedModel reducedMotion={reducedMotion} lowPower={lowPower} mouseRef={mouseRef} />
    </Suspense>
  );
}
