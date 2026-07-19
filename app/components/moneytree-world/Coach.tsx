'use client';

/**
 * Coach - the selected coach (educator), shown as a camera-facing billboard
 * sprite that FLOATS in the upper sky area rather than standing on the ground.
 * It sits up top on purpose: the coach gives directions/education, and its
 * (future) speech bubble needs open sky above the garden so it never covers
 * the tree, the buckets, or the gardener. The gardener down in the garden
 * does the investing; this magical coach hovers and comments.
 *
 * Which of the four coaches shows is driven by `selectedCoachId`; each is a
 * hand-illustrated sprite (generated art, keyed to transparent).
 */

import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { MascotId } from '@/app/lib/moneytree/types';
import { useWorldStore } from './useWorldStore';

// Up and to the right, back a little - reads as the top-right of the frame,
// with clear sky to its upper-left for a speech bubble.
const COACH_POSITION: [number, number, number] = [4, 5, -2.5];
const COACH_HEIGHT = 2.5;

const COACH_TEXTURE: Record<MascotId, string> = {
  wizard: '/mascot/sage.webp', // Sage
  robot: '/mascot/bit.webp', // Bit
  adventurer: '/mascot/robin.webp', // Robin
  hero: '/mascot/nova.webp', // Nova
};

function CoachSprite({ id }: { id: MascotId }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const texture = useTexture(COACH_TEXTURE[id]);
  texture.colorSpace = THREE.SRGBColorSpace;

  const img = texture.image as { width: number; height: number } | undefined;
  const aspect = img ? img.width / img.height : 0.75;
  const width = COACH_HEIGHT * aspect;

  const [x, y, z] = COACH_POSITION;

  useFrame((state) => {
    const s = spriteRef.current;
    if (!s) return;
    const t = state.clock.elapsedTime;
    // Gentle hover + a tiny sway, like a magical spirit floating in place.
    s.position.y = y + Math.sin(t * 1.4) * 0.16;
    s.material.rotation = Math.sin(t * 1.1 + 0.6) * 0.03;
  });

  return (
    <sprite ref={spriteRef} position={[x, y, z]} scale={[width, COACH_HEIGHT, 1]}>
      <spriteMaterial map={texture} transparent alphaTest={0.35} depthWrite={false} />
    </sprite>
  );
}

export function Coach() {
  const id = useWorldStore((s) => s.selectedCoachId);
  return (
    <Suspense fallback={null}>
      {/* key forces a clean texture swap when the player changes coach */}
      <CoachSprite key={id} id={id} />
    </Suspense>
  );
}
