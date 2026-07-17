'use client';

/**
 * FollowCamera - Phase 0 stub: a plain, un-springed follow positioned behind
 * and above the player, always looking at them.
 *
 * Phase 2 replaces this with spring-damped position/look-at, slow auto-yaw
 * toward the movement direction, idle drift when standing still, and a
 * terrain-floor clamp.
 */

import { useFrame, useThree } from '@react-three/fiber';
import { useWorldStore } from './useWorldStore';

const OFFSET = { x: 0, y: 3.5, z: 6 };

export function FollowCamera() {
  const camera = useThree((s) => s.camera);
  const playerPosition = useWorldStore((s) => s.playerPosition);

  useFrame(() => {
    const [x, y, z] = playerPosition;
    camera.position.set(x + OFFSET.x, y + OFFSET.y, z + OFFSET.z);
    camera.lookAt(x, y + 1, z);
  });

  return null;
}
