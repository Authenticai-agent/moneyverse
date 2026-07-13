'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  scrollProgressRef: React.MutableRefObject<number>;
  mouseRef: React.MutableRefObject<{ x: number; y: number }>;
  flyIn?: boolean;
  onFlyInComplete?: () => void;
  reducedMotion?: boolean;
}

const FLY_DURATION = 1.8; // seconds
const INITIAL_POSITION = new THREE.Vector3(0, 4, 8);
const FLY_TARGET = new THREE.Vector3(0, 1.2, 3);

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function CameraController({
  scrollProgressRef,
  mouseRef: _mouseRef,
  flyIn = false,
  onFlyInComplete,
  reducedMotion = false,
}: CameraControllerProps) {
  const { camera } = useThree();
  const flyStartRef = useRef<number | null>(null);
  const flyCompleteRef = useRef(false);

  useEffect(() => {
    if (flyIn && !flyCompleteRef.current && flyStartRef.current === null) {
      if (reducedMotion) {
        flyCompleteRef.current = true;
        onFlyInComplete?.();
      } else {
        flyStartRef.current = performance.now();
      }
    }
  }, [flyIn, reducedMotion, onFlyInComplete]);

  useFrame(() => {
    const scroll = scrollProgressRef.current;

    let basePosition = INITIAL_POSITION.clone();

    if (flyStartRef.current !== null) {
      const elapsed = (performance.now() - flyStartRef.current) / 1000;
      if (elapsed >= FLY_DURATION) {
        if (!flyCompleteRef.current) {
          flyCompleteRef.current = true;
          onFlyInComplete?.();
        }
        basePosition.copy(FLY_TARGET);
      } else {
        const t = easeOutCubic(Math.min(1, elapsed / FLY_DURATION));
        basePosition.lerpVectors(INITIAL_POSITION, FLY_TARGET, t);
      }
    } else {
      basePosition.z -= scroll * 4;
    }

    camera.position.lerp(basePosition, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
