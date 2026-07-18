'use client';

/**
 * FixedCamera - a static, hand-framed camera looking at the whole compact
 * garden courtyard, replacing the walkable FollowCamera. The player no longer
 * moves, so the camera just holds a pleasant 3/4 view of the tree, the plots,
 * the bell, and the pond, with a gentle idle sway.
 *
 * It is ASPECT-AWARE: on a narrow/portrait screen (a phone held upright) the
 * horizontal field of view is much tighter for the same vertical FOV, which
 * would clip the wide row of plots at the sides. So on narrow aspects it
 * smoothly dollies the camera back and opens the lens, keeping the entire
 * garden in frame - the same responsive-reframing trick the original 2D game
 * used. At/above the reference (desktop) aspect the hand-tuned framing is
 * untouched.
 *
 * Framing is applied in a useEffect too (not only useFrame) so the first
 * painted frame is already correct even where the render loop is throttled.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Centered on the world's X axis so the symmetric painted layout (tree
// center-back, the three pots in a row) reads evenly - an off-center camera
// made the near-side pot balloon and the far-side pot shrink.
//
// The pitch is deliberately shallow (camera only ~2.4 units above the look
// target over ~11 units of depth, ~12 degrees down): a steeper top-down angle
// squeezed the sky to a thin sliver and hid the painted mountains behind the
// bush hedge. This shallower angle opens the upper third of the frame for the
// sky, sun and mountains while still reading the pots clearly.
const BASE_POSITION = new THREE.Vector3(0, 5.0, 13.2);
const LOOK_TARGET = new THREE.Vector3(0, 2.6, 1.2);
const BASE_FOV = 46;
const SWAY_AMOUNT = 0.3;
const SWAY_SPEED = 0.13;

// Below this width:height ratio the garden's wide plot row starts clipping;
// narrower than this we dolly back and open the lens proportionally.
const REFERENCE_ASPECT = 1.3;
const MAX_DISTANCE_SCALE = 2.3;
const MAX_FOV = 66;
// On a tall/portrait screen the dolly-back opens up a big band of empty
// foreground grass between the pots and the bottom control card. Raising the
// look-target on narrow screens tilts the camera up a touch, sliding the whole
// garden down toward the card and trimming that dead foreground. Zero on
// desktop, so the hand-tuned landscape framing is untouched there.
const NARROW_LOOK_RAISE = 4.2;

function framingFor(aspect: number): { narrowness: number; distanceScale: number; fov: number } {
  const narrowness = aspect >= REFERENCE_ASPECT ? 0 : Math.min(1, (REFERENCE_ASPECT - aspect) / REFERENCE_ASPECT);
  return {
    narrowness,
    distanceScale: 1 + narrowness * (MAX_DISTANCE_SCALE - 1),
    fov: BASE_FOV + narrowness * (MAX_FOV - BASE_FOV),
  };
}

export function FixedCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());

  const place = (aspect: number, swayX: number, swayY: number) => {
    const { narrowness, distanceScale, fov } = framingFor(aspect);
    // Dolly the camera back along its view direction (position math uses the
    // base look target so the pull-back direction stays constant)...
    desired.current.copy(BASE_POSITION).sub(LOOK_TARGET).multiplyScalar(distanceScale).add(LOOK_TARGET);
    camera.position.set(desired.current.x + swayX, desired.current.y + swayY, desired.current.z);
    // ...then aim at a look target raised on narrow screens, tilting the view
    // up so the garden slides down toward the card.
    lookAt.current.copy(LOOK_TARGET);
    lookAt.current.y += narrowness * NARROW_LOOK_RAISE;
    camera.lookAt(lookAt.current);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  };

  useEffect(() => {
    place(size.width / Math.max(size.height, 1), 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size.width, size.height]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    place(
      size.width / Math.max(size.height, 1),
      Math.sin(t * SWAY_SPEED) * SWAY_AMOUNT,
      Math.sin(t * SWAY_SPEED * 0.7) * SWAY_AMOUNT * 0.4
    );
  });

  return null;
}
