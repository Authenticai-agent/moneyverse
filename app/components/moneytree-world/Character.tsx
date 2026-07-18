'use client';

/**
 * Character - a cute, round garden mascot (not the old pencil-shaped capsule):
 * a chubby honey-colored body, an oversized friendly head with big eyes,
 * rosy cheeks and a little smile, stubby arms and legs, and a leaf sprout on
 * top. Fully procedural and toon-shaded (no GLB/skeletal rig) - limbs swing
 * on a sine walk cycle scaled by speed, and the whole body does a gentle idle
 * breathing bob when standing still.
 *
 * Same public interface as before (`{ speedRef }`), so the stationary
 * IdleGardener and any future walking use both keep working unchanged.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getToonGradientMap } from './toonGradient';

const BODY_COLOR = '#F2B24A'; // warm honey
const HEAD_COLOR = '#FBE3B8'; // soft cream
const LIMB_COLOR = '#C9822F'; // deeper honey-brown
const CHEEK_COLOR = '#FF9E9E';
const EYE_COLOR = '#3A2E22';
const LEAF_COLOR = '#6FBE5A';
const STEM_COLOR = '#4F9E4A';

const WALK_CYCLE_SPEED = 7;
const WALK_SWING_MAX = 0.6;
const IDLE_BOB_SPEED = 1.6;
const IDLE_BOB_AMOUNT = 0.035;

export function Character({ speedRef }: { speedRef: React.MutableRefObject<number> }) {
  const gradientMap = getToonGradientMap();
  const bodyGroupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const phaseRef = useRef(0);

  useFrame((state, delta) => {
    const speed = speedRef.current;
    phaseRef.current += delta * WALK_CYCLE_SPEED * Math.min(1, speed / 3 + (speed > 0.05 ? 0.4 : 0));

    const walkAmount = Math.min(1, speed / 3);
    const swing = Math.sin(phaseRef.current) * WALK_SWING_MAX * walkAmount;

    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;

    if (bodyGroupRef.current) {
      const idle = 1 - walkAmount;
      const bob =
        walkAmount > 0.05
          ? Math.abs(Math.sin(phaseRef.current)) * 0.05 * walkAmount
          : Math.sin(state.clock.elapsedTime * IDLE_BOB_SPEED) * IDLE_BOB_AMOUNT * idle;
      bodyGroupRef.current.position.y = bob;
    }
  });

  return (
    <group ref={bodyGroupRef}>
      {/* Stubby legs with little feet - pivot at the hip */}
      <group ref={leftLegRef} position={[0.14, 0.2, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.08, 4, 8]} />
          <meshToonMaterial color={LIMB_COLOR} gradientMap={gradientMap} />
        </mesh>
        <mesh position={[0, -0.18, 0.05]} castShadow>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshToonMaterial color={LIMB_COLOR} gradientMap={gradientMap} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[-0.14, 0.2, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.08, 4, 8]} />
          <meshToonMaterial color={LIMB_COLOR} gradientMap={gradientMap} />
        </mesh>
        <mesh position={[0, -0.18, 0.05]} castShadow>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshToonMaterial color={LIMB_COLOR} gradientMap={gradientMap} />
        </mesh>
      </group>

      {/* Chubby round body - a squashed sphere */}
      <mesh position={[0, 0.44, 0]} scale={[1, 0.92, 1]} castShadow receiveShadow>
        <sphereGeometry args={[0.36, 18, 16]} />
        <meshToonMaterial color={BODY_COLOR} gradientMap={gradientMap} />
      </mesh>
      {/* Lighter belly patch */}
      <mesh position={[0, 0.4, 0.28]} scale={[0.8, 0.9, 0.6]}>
        <sphereGeometry args={[0.22, 14, 12]} />
        <meshToonMaterial color={HEAD_COLOR} gradientMap={gradientMap} />
      </mesh>

      {/* Stubby arms - pivot at the shoulder */}
      <group ref={leftArmRef} position={[0.33, 0.52, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.12, 4, 8]} />
          <meshToonMaterial color={BODY_COLOR} gradientMap={gradientMap} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[-0.33, 0.52, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.12, 4, 8]} />
          <meshToonMaterial color={BODY_COLOR} gradientMap={gradientMap} />
        </mesh>
      </group>

      {/* Big friendly head */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <sphereGeometry args={[0.32, 20, 18]} />
        <meshToonMaterial color={HEAD_COLOR} gradientMap={gradientMap} />
      </mesh>

      {/* Eyes - dark ovals with a white highlight for a kawaii look */}
      <mesh position={[-0.11, 0.96, 0.29]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color={EYE_COLOR} />
      </mesh>
      <mesh position={[0.11, 0.96, 0.29]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color={EYE_COLOR} />
      </mesh>
      <mesh position={[-0.09, 0.985, 0.33]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[0.13, 0.985, 0.33]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Rosy cheeks */}
      <mesh position={[-0.19, 0.88, 0.24]} scale={[1, 0.7, 0.4]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshBasicMaterial color={CHEEK_COLOR} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0.19, 0.88, 0.24]} scale={[1, 0.7, 0.4]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshBasicMaterial color={CHEEK_COLOR} transparent opacity={0.8} />
      </mesh>

      {/* Little smile - a half-torus arc */}
      <mesh position={[0, 0.87, 0.3]} rotation={[Math.PI, 0, 0]}>
        <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
        <meshBasicMaterial color={EYE_COLOR} />
      </mesh>

      {/* Leaf sprout on top (rounded - not a pointy hat) */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.14, 6]} />
        <meshToonMaterial color={STEM_COLOR} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.08, 1.29, 0]} rotation={[0, 0, -0.7]} scale={[1, 0.55, 0.5]} castShadow>
        <sphereGeometry args={[0.11, 12, 10]} />
        <meshToonMaterial color={LEAF_COLOR} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[-0.07, 1.26, 0]} rotation={[0, 0, 0.8]} scale={[1, 0.5, 0.5]} castShadow>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshToonMaterial color={LEAF_COLOR} gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}
