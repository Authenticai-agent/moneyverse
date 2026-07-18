'use client';

/**
 * GroundShadow - a soft blob shadow painted on the ground under a billboard
 * sprite. Flat 2.5D sprites standing on a flat ground read as "stickers
 * floating on grass"; a dark soft ellipse where each one meets the ground
 * anchors it and gives the whole scene depth. The texture is a radial gradient
 * baked once to a canvas, and the shadow lies flat on the ground (rotated onto
 * the XZ plane) just above y=0 so it never z-fights with the grass.
 */

import { useMemo } from 'react';
import * as THREE from 'three';

function makeShadowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(35,25,15,0.42)');
  g.addColorStop(0.55, 'rgba(35,25,15,0.22)');
  g.addColorStop(1, 'rgba(35,25,15,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// One shared texture for every shadow in the scene.
let sharedTexture: THREE.Texture | null = null;

export function GroundShadow({
  position,
  radius = 1,
  yOffset = 0.02,
  opacity = 1,
}: {
  position: [number, number];
  radius?: number;
  yOffset?: number;
  opacity?: number;
}) {
  const texture = useMemo(() => {
    if (!sharedTexture) sharedTexture = makeShadowTexture();
    return sharedTexture;
  }, []);

  const [x, z] = position;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, yOffset, z]}>
      {/* Slightly squashed in depth so it reads as a shadow cast on the ground,
          not a flat disc. */}
      <planeGeometry args={[radius * 2, radius * 1.4]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
