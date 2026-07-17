'use client';

/**
 * Player - Phase 0 stub: a capsule the player can walk around with WASD or
 * arrow keys, using a simple dynamic Rapier rigid body with locked rotations
 * so it doesn't tip over.
 *
 * Phase 2 replaces this with a proper kinematic character controller
 * (acceleration/deceleration, a rendered touch joystick, a real
 * modeled/procedural character with idle/walk animation).
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useWorldStore } from './useWorldStore';

const SPEED = 4;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_HEIGHT = 0.9;
const SPAWN: [number, number, number] = [0, 1, 0];

/** Tracks which movement keys are currently held, without triggering re-renders. */
function useMovementKeys() {
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const onUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);
  return keys;
}

export function Player() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const keys = useMovementKeys();
  const setPlayerPosition = useWorldStore((s) => s.setPlayerPosition);
  const moveDir = useRef(new THREE.Vector3());

  useFrame(() => {
    const body = bodyRef.current;
    if (!body) return;

    const k = keys.current;
    moveDir.current.set(0, 0, 0);
    if (k['w'] || k['arrowup']) moveDir.current.z -= 1;
    if (k['s'] || k['arrowdown']) moveDir.current.z += 1;
    if (k['a'] || k['arrowleft']) moveDir.current.x -= 1;
    if (k['d'] || k['arrowright']) moveDir.current.x += 1;
    if (moveDir.current.lengthSq() > 0) moveDir.current.normalize().multiplyScalar(SPEED);

    const currentVel = body.linvel();
    body.setLinvel({ x: moveDir.current.x, y: currentVel.y, z: moveDir.current.z }, true);

    const t = body.translation();
    setPlayerPosition([t.x, t.y, t.z]);
  });

  return (
    <RigidBody ref={bodyRef} type="dynamic" colliders={false} mass={1} lockRotations position={SPAWN} friction={0.2}>
      <CapsuleCollider args={[CAPSULE_HEIGHT / 2, CAPSULE_RADIUS]} />
      <mesh castShadow>
        <capsuleGeometry args={[CAPSULE_RADIUS, CAPSULE_HEIGHT, 4, 8]} />
        <meshStandardMaterial color="#6B4EFF" />
      </mesh>
    </RigidBody>
  );
}
