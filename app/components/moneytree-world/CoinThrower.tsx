'use client';

/**
 * CoinThrower - makes the mascot actually DO something with the coins: it
 * holds the year's unallocated coins in a little stack by its hands, and each
 * time the player taps a bucket (a coin is added to coinHistory) it launches
 * one coin on an arc from the mascot to that bucket's plot, where it lands on
 * the pile. Undo just pulls a coin back into the held stack (no throw).
 *
 * The held stack size = coins left to place; it shrinks to nothing as the
 * year is fully allocated. Flying coins are drawn from a small fixed pool and
 * animated imperatively in useFrame (no per-frame React re-renders). Each
 * flight marks its bucket "in flight" in the store while airborne so the
 * plot's own pile only grows the instant the coin lands.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Bucket } from '@/app/lib/moneytree/types';
import { useWorldStore } from './useWorldStore';
import { GARDEN_PLOTS, MASCOT_POSITION } from './worldLayout';

const POOL_SIZE = 8; // max coins that can be mid-air at once
const THROW_DURATION = 0.5; // seconds per throw
const COIN_COLOR = '#FFD84D';

// Where a coin leaves the mascot's raised throwing hand - aligned to the
// upper-left hand in the illustrated sprite, pushed slightly toward the
// camera so it flies in front of the flat sprite.
const HAND_OFFSET = { x: -0.4, y: 1.7, z: 0.2 };

type Flight = { poolIndex: number; bucket: Bucket; from: THREE.Vector3; to: THREE.Vector3; arc: number; t: number };

export function CoinThrower() {
  const coinHistory = useWorldStore((s) => s.coinHistory);
  const addInFlight = useWorldStore((s) => s.addInFlight);
  const removeInFlight = useWorldStore((s) => s.removeInFlight);

  // Flat painted ground at y=0; the hand offset is measured up from the feet.
  const handPos = useMemo(
    () => new THREE.Vector3(MASCOT_POSITION[0] + HAND_OFFSET.x, HAND_OFFSET.y, MASCOT_POSITION[1] + HAND_OFFSET.z),
    []
  );

  // Landing point at each bucket's open top (buckets are 1.8 tall sprites).
  const targets = useMemo(() => {
    const m = {} as Record<Bucket, THREE.Vector3>;
    for (const p of GARDEN_PLOTS) {
      m[p.bucket] = new THREE.Vector3(p.position[0], 1.1, p.position[1]);
    }
    return m;
  }, []);

  const poolRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flights = useRef<Flight[]>([]);
  const freeIndices = useRef<number[]>(Array.from({ length: POOL_SIZE }, (_, i) => i));
  const prevLen = useRef(coinHistory.length);

  // Spawn a throw whenever a coin is newly placed (history grew). On undo
  // (history shrank) we just resync - the held stack re-renders bigger.
  useEffect(() => {
    const len = coinHistory.length;
    if (len > prevLen.current) {
      const bucket = coinHistory[len - 1];
      const poolIndex = freeIndices.current.pop();
      if (poolIndex !== undefined) {
        const to = targets[bucket];
        const arc = 0.9 + handPos.distanceTo(to) * 0.14;
        flights.current.push({ poolIndex, bucket, from: handPos.clone(), to: to.clone(), arc, t: 0 });
        addInFlight(bucket);
      }
    }
    prevLen.current = len;
  }, [coinHistory, targets, handPos, addInFlight]);

  useFrame((_, delta) => {
    for (let i = flights.current.length - 1; i >= 0; i--) {
      const f = flights.current[i];
      f.t += delta / THROW_DURATION;
      const mesh = poolRefs.current[f.poolIndex];

      if (f.t >= 1) {
        if (mesh) mesh.visible = false;
        freeIndices.current.push(f.poolIndex);
        flights.current.splice(i, 1);
        removeInFlight(f.bucket); // coin has landed -> plot pile gains it now
        continue;
      }

      if (mesh) {
        const t = f.t;
        mesh.visible = true;
        mesh.position.x = THREE.MathUtils.lerp(f.from.x, f.to.x, t);
        mesh.position.z = THREE.MathUtils.lerp(f.from.z, f.to.z, t);
        mesh.position.y = THREE.MathUtils.lerp(f.from.y, f.to.y, t) + Math.sin(t * Math.PI) * f.arc;
        mesh.rotation.x += delta * 12;
        mesh.rotation.y += delta * 7;
      }
    }
  });

  return (
    <>
      {/* Pool of flying coins, hidden until a throw uses them. The mascot's
          own held-coin stack is part of the illustrated sprite, so we don't
          render a separate 3D stack here. */}
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            poolRefs.current[i] = el;
          }}
          visible={false}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.17, 0.17, 0.05, 16]} />
          <meshBasicMaterial color={COIN_COLOR} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}
