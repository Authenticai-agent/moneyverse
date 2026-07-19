'use client';

/**
 * BucketField - the three illustrated pots (Safe / Growth / Moonshot) standing
 * on the painted ground, replacing the old 3D soil-plot + signpost. Each is a
 * camera-facing billboard sprite bottom-anchored at y=0, with the year's
 * landed coins piling up at its open top. Coins still in flight (tossed by the
 * gardener, not yet arrived) are subtracted so the pile grows on arrival.
 */

import { Suspense, useLayoutEffect, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Bucket } from '@/app/lib/moneytree/types';
import { useWorldStore } from './useWorldStore';
import { GARDEN_PLOTS } from './worldLayout';

const BUCKET_TEXTURE: Record<Bucket, string> = {
  safe: '/env/bucket-safe.webp',
  growth: '/env/bucket-growth.webp',
  moonshot: '/env/bucket-moonshot.webp',
};
// Per-image sprite height. The three pot illustrations frame the pot slightly
// differently (the Moonshot pot has a short sprout, so its pot fills more of
// the image), so a single shared height made the red pot read noticeably
// bigger. These heights are tuned from each image's measured rim width so the
// three pot BODIES render at the same on-screen size.
const BUCKET_HEIGHT: Record<Bucket, number> = {
  safe: 1.78,
  growth: 1.8,
  moonshot: 1.56,
};
const MAX_VISIBLE_COINS = 10;

function BucketSprite({ bucket, position }: { bucket: Bucket; position: [number, number] }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const texture = useTexture(BUCKET_TEXTURE[bucket]);
  texture.colorSpace = THREE.SRGBColorSpace;

  const height = BUCKET_HEIGHT[bucket];
  const img = texture.image as { width: number; height: number } | undefined;
  const aspect = img ? img.width / img.height : 1;
  const width = height * aspect;

  const coins = useWorldStore((s) => Math.max(0, s.coinsThisYear[bucket] - s.coinsInFlight[bucket]));
  const [x, z] = position;

  useLayoutEffect(() => {
    spriteRef.current?.center.set(0.5, 0);
  }, []);

  return (
    <group position={[x, 0, z]}>
      <sprite ref={spriteRef} position={[0, 0, 0]} scale={[width, height, 1]}>
        <spriteMaterial map={texture} transparent alphaTest={0.35} depthWrite={false} />
      </sprite>
      {/* Landed coins piling in the open top - unlit gold to match the flat art. */}
      {Array.from({ length: Math.min(coins, MAX_VISIBLE_COINS) }, (_, i) => (
        <mesh
          key={i}
          position={[Math.sin(i * 12.9) * 0.12, height * 0.6 + i * 0.028, 0.35 + Math.cos(i * 7.3) * 0.06]}
          rotation={[Math.PI / 2, 0, i * 0.5]}
        >
          <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
          <meshBasicMaterial color="#FFD84D" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function BucketField() {
  return (
    <Suspense fallback={null}>
      {GARDEN_PLOTS.map((p) => (
        <BucketSprite key={p.bucket} bucket={p.bucket} position={p.position} />
      ))}
    </Suspense>
  );
}
