'use client';

/**
 * TreeSprite - the illustrated magical money tree, replacing the procedural 3D
 * tree. A camera-facing billboard sprite bottom-anchored at y=0 that grows
 * with the portfolio: it eases toward a height set by the same sqrt growth
 * curve the old tree used, and does a gentle breathing sway. A good/bad year
 * gives it a brief scale pop / droop via mood.
 */

import { Suspense, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from './useWorldStore';
import { MONEY_TREE_POSITION } from './worldLayout';

const TREE_TEXTURE = '/env/tree.png';
const MIN_HEIGHT = 2.2;
const MAX_HEIGHT = 5.2;
const GROWTH_REFERENCE = 50000;

function heightFor(total: number): number {
  return MIN_HEIGHT + Math.sqrt(Math.min(Math.max(total, 0), GROWTH_REFERENCE) / GROWTH_REFERENCE) * (MAX_HEIGHT - MIN_HEIGHT);
}

function TreeMesh() {
  const spriteRef = useRef<THREE.Sprite>(null);
  const texture = useTexture(TREE_TEXTURE);
  texture.colorSpace = THREE.SRGBColorSpace;

  const img = texture.image as { width: number; height: number } | undefined;
  const aspect = img ? img.width / img.height : 0.79;

  const [x, z] = MONEY_TREE_POSITION;
  const heightRef = useRef(MIN_HEIGHT);
  const popRef = useRef(0);
  const prevMoodRef = useRef<'neutral' | 'good' | 'bad'>('neutral');

  useLayoutEffect(() => {
    spriteRef.current?.center.set(0.5, 0);
  }, []);

  useFrame((state, delta) => {
    const s = spriteRef.current;
    if (!s) return;
    const { portfolio, mood } = useWorldStore.getState();
    const total = portfolio.safe + portfolio.growth + portfolio.moonshot;

    if (mood === 'good' && prevMoodRef.current !== 'good') popRef.current = 1;
    prevMoodRef.current = mood;
    popRef.current = Math.max(0, popRef.current - delta * 1.8);
    const pop = Math.sin(popRef.current * Math.PI) * 0.08;

    heightRef.current += (heightFor(total) - heightRef.current) * Math.min(1, delta * 3);
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 1.1) * 0.01;
    const h = heightRef.current * (1 + pop) * breathe;
    s.scale.set(h * aspect, h, 1);
    s.material.rotation = Math.sin(state.clock.elapsedTime * 0.5) * 0.012;
  });

  return (
    <sprite ref={spriteRef} position={[x, 0, z]} scale={[MIN_HEIGHT * aspect, MIN_HEIGHT, 1]}>
      <spriteMaterial map={texture} transparent alphaTest={0.35} depthWrite={false} />
    </sprite>
  );
}

export function TreeSprite() {
  return (
    <Suspense fallback={null}>
      <TreeMesh />
    </Suspense>
  );
}
