'use client';

/**
 * IdleGardener - the gardener (the "investor"): a hand-illustrated mascot
 * (generated art, keyed to transparent) shown as a camera-facing billboard
 * sprite that stands on the ground. It holds the year's coins and (via
 * CoinThrower) tosses them into the buckets. The selected coach stands beside
 * it via the separate Coach component.
 *
 * The sprite is BOTTOM-anchored (center = 0.5, 0) so its feet sit on the
 * terrain regardless of the art's padding or pose - positioning by half-height
 * made it hover. Its "aliveness" is a gentle weight-shift wobble and a subtle
 * breathing squash that both pivot from the feet, so it never lifts off.
 */

import { Suspense, useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { MASCOT_POSITION } from './worldLayout';

const MASCOT_HEIGHT = 3.1;
const MASCOT_TEXTURE = '/mascot/coach.png';

function MascotSprite() {
  const spriteRef = useRef<THREE.Sprite>(null);
  const texture = useTexture(MASCOT_TEXTURE);
  texture.colorSpace = THREE.SRGBColorSpace;

  const img = texture.image as { width: number; height: number } | undefined;
  const aspect = img ? img.width / img.height : 0.717;
  const width = MASCOT_HEIGHT * aspect;

  const [x, z] = MASCOT_POSITION;
  // The 2.5D world is a flat painted ground at y=0, so the feet sit at 0.
  const groundY = 0;

  // Anchor the sprite at its bottom edge so `position.y` IS where the feet
  // sit. A touch below ground (-0.06) hides the tiny transparent pad under
  // the feet so it reads as planted, not floating.
  useLayoutEffect(() => {
    spriteRef.current?.center.set(0.5, 0);
  }, []);

  useFrame((state) => {
    const s = spriteRef.current;
    if (!s) return;
    const t = state.clock.elapsedTime;
    s.material.rotation = Math.sin(t * 1.3) * 0.02; // weight-shift wobble around the feet
    s.scale.set(width, MASCOT_HEIGHT * (1 + Math.sin(t * 1.6) * 0.012), 1); // breathing, feet stay put
  });

  return (
    <sprite ref={spriteRef} position={[x, groundY - 0.06, z]} scale={[width, MASCOT_HEIGHT, 1]}>
      <spriteMaterial map={texture} transparent alphaTest={0.35} depthWrite={false} />
    </sprite>
  );
}

export function IdleGardener() {
  return (
    <Suspense fallback={null}>
      <MascotSprite />
    </Suspense>
  );
}
