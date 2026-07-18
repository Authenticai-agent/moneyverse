'use client';

/**
 * Scenery - the painted bushes and flower clusters that give the flat 2.5D
 * garden real depth. They're placed in three parallax layers at different
 * distances so the eye reads front-to-back space instead of one flat plane:
 *
 *  - a distant HEDGE of bushes strung along the horizon, which also masks the
 *    straight far edge of the finite GroundPlane where it meets the sky;
 *  - a MID scatter of bushes and flower clumps out to the sides, between the
 *    pots and the horizon;
 *  - a few big FRONT flower clusters hugging the bottom corners, close to the
 *    camera, that frame the scene.
 *
 * Every piece is a bottom-anchored, camera-facing billboard sprite (same
 * treatment as the tree, pots and characters) with a gentle idle sway. Layers
 * render in separate draw groups: `back` is mounted behind the tree/pots,
 * `front` in front of them, so depth sorting is by scene-graph order (these
 * sprites are unlit and depth-write-free, like the rest of the painted world).
 */

import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const BUSH_TEXTURE = '/env/bush.png';
const FLOWERS_TEXTURE = '/env/flowers.png';

type Prop = {
  kind: 'bush' | 'flowers';
  position: [number, number]; // [x, z]
  height: number;
  flip?: boolean;
};

// Deterministic jitter (no Math.random - keeps SSR/first-frame stable).
const jitter = (i: number, a: number, b: number) => a + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * (b - a);

function buildBack(): Prop[] {
  const props: Prop[] = [];
  // Distant hedge along the horizon (z ~ -14) masking the ground's far edge.
  // Kept low so the painted mountains rise behind and above it.
  for (let i = 0; i < 15; i++) {
    const x = -28 + i * 4;
    props.push({
      kind: 'bush',
      position: [x + jitter(i, -0.8, 0.8), -14.2 + jitter(i + 7, -0.6, 0.6)],
      height: 1.9 + jitter(i + 3, -0.3, 0.5),
      flip: i % 2 === 0,
    });
  }
  // Mid scatter out to the sides (kept clear of the central tree + pot row).
  const mid: Prop[] = [
    { kind: 'bush', position: [-10.5, -6], height: 2.4 },
    { kind: 'bush', position: [9.5, -5.2], height: 2.6, flip: true },
    { kind: 'flowers', position: [-12.5, -2.5], height: 1.5 },
    { kind: 'flowers', position: [11.5, -3], height: 1.6, flip: true },
    { kind: 'bush', position: [13.5, -8], height: 2.2, flip: true },
    { kind: 'bush', position: [-14.5, -8.5], height: 2.3 },
  ];
  return props.concat(mid);
}

function buildFront(): Prop[] {
  // Big, close clusters hugging the bottom corners to frame the view.
  return [
    { kind: 'flowers', position: [-10, 8.5], height: 3.2 },
    { kind: 'flowers', position: [10.5, 8], height: 3.4, flip: true },
    { kind: 'bush', position: [-15, 7], height: 4.0 },
    { kind: 'bush', position: [15.5, 6.5], height: 4.2, flip: true },
  ];
}

function PropSprite({ prop, index }: { prop: Prop; index: number }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const texture = useTexture(prop.kind === 'bush' ? BUSH_TEXTURE : FLOWERS_TEXTURE);
  texture.colorSpace = THREE.SRGBColorSpace;

  const img = texture.image as { width: number; height: number } | undefined;
  const aspect = img ? img.width / img.height : 1;
  const width = prop.height * aspect * (prop.flip ? -1 : 1);

  const [x, z] = prop.position;
  const phase = index * 1.7;

  useLayoutEffect(() => {
    spriteRef.current?.center.set(0.5, 0);
  }, []);

  useFrame((state) => {
    const s = spriteRef.current;
    if (!s) return;
    // A soft breeze sway pivoting from the base.
    s.material.rotation = Math.sin(state.clock.elapsedTime * 0.6 + phase) * 0.02;
  });

  return (
    <sprite ref={spriteRef} position={[x, 0, z]} scale={[width, prop.height, 1]}>
      <spriteMaterial map={texture} transparent alphaTest={0.4} depthWrite={false} />
    </sprite>
  );
}

export function Scenery({ layer }: { layer: 'back' | 'front' }) {
  const props = useMemo(() => (layer === 'back' ? buildBack() : buildFront()), [layer]);
  return (
    <Suspense fallback={null}>
      {props.map((p, i) => (
        <PropSprite key={`${layer}-${i}`} prop={p} index={i} />
      ))}
    </Suspense>
  );
}
