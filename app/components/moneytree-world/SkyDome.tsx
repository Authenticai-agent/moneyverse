'use client';

/**
 * SkyDome - a large inverted sphere with a custom gradient shader (light sky
 * blue horizon lerping to deeper blue zenith), painterly rather than
 * physically based, plus a sun and a handful of drifting cartoon clouds.
 * Radius is huge relative to the 60-unit play field so the gradient looks
 * consistent no matter where the player wanders.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const TOP_COLOR = new THREE.Color('#4A90D9');
export const SKY_HORIZON_COLOR = '#CFEEFB';
const DOME_RADIUS = 200;

// Deliberately decoupled from World.tsx's shadow-casting light direction, and
// deliberately low-elevation. FollowCamera looks from (player + [0,3.5,6])
// toward (player + [0,1,0]) - a ~22.6 degree downward pitch - so with a 50
// degree vertical FOV, the frustum's upper edge sits only ~2.4 degrees above
// the horizon. Anything placed at a "nice round" elevation like 20-40
// degrees (as a real sun/cloud layer would be) never enters frame at all.
// This keeps the sun and clouds low, near the treeline, on purpose so they
// actually show up during normal third-person play.
const SUN_DIRECTION = new THREE.Vector3(4, 1.2, -10).normalize();
const SUN_DISTANCE = 130;
const SUN_POSITION: [number, number, number] = [
  SUN_DIRECTION.x * SUN_DISTANCE,
  SUN_DIRECTION.y * SUN_DISTANCE,
  SUN_DIRECTION.z * SUN_DISTANCE,
];

const VERTEX_SHADER = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform float exponent;
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition).y;
    float t = pow(max(h, 0.0), exponent);
    gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
  }
`;

export function SkyDome() {
  const uniforms = useMemo(
    () => ({
      topColor: { value: TOP_COLOR },
      horizonColor: { value: new THREE.Color(SKY_HORIZON_COLOR) },
      exponent: { value: 0.6 },
    }),
    []
  );

  return (
    <mesh scale={[DOME_RADIUS, DOME_RADIUS, DOME_RADIUS]}>
      <sphereGeometry args={[1, 24, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
      />
    </mesh>
  );
}

/** A bright unlit sun disc (a sphere, not a billboard, so it reads as round
 * from any angle without needing to face the camera) with a soft glow halo.
 * fog={false} on both - scene fog dulling a bright light source into haze
 * the same way it dulls a diffuse surface reads wrong, and at this distance
 * (130 units, past the fog's 70-unit far distance) fog would otherwise wash
 * it out to almost nothing. */
export function Sun() {
  return (
    <group position={SUN_POSITION}>
      <mesh renderOrder={-3}>
        <sphereGeometry args={[40, 16, 16]} />
        <meshBasicMaterial color="#FFE066" transparent opacity={0.45} depthWrite={false} fog={false} />
      </mesh>
      <mesh renderOrder={-2}>
        <sphereGeometry args={[18, 16, 16]} />
        <meshBasicMaterial color="#FFD23F" depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}

type CloudPuff = { position: [number, number, number]; scale: number };
type CloudCluster = { basePosition: [number, number, number]; puffs: CloudPuff[]; driftSpeed: number };

const CLOUD_COLOR = '#FFFFFF';

function buildClouds(): CloudCluster[] {
  const rand = (seed: number) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const clusters: CloudCluster[] = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    // Bias angles toward -Z (the general direction the player faces from
    // spawn) so more clouds land inside typical camera framing, while still
    // keeping a few scattered all the way around.
    const angle = -Math.PI / 2 + (i / count - 0.5) * Math.PI * 1.5 + rand(i) * 0.4;
    const radius = 60 + rand(i + 10) * 40;
    // Low elevation on purpose - see the SUN_DIRECTION comment above for why.
    const height = 8 + rand(i + 20) * 10;
    const basePosition: [number, number, number] = [Math.cos(angle) * radius, height, Math.sin(angle) * radius];

    const puffCount = 5 + Math.floor(rand(i + 30) * 3);
    const puffs: CloudPuff[] = [];
    for (let p = 0; p < puffCount; p++) {
      const spread = 10;
      puffs.push({
        position: [(rand(i * 7 + p) - 0.5) * spread * 2, (rand(i * 11 + p) - 0.5) * 4, (rand(i * 13 + p) - 0.5) * spread],
        scale: 9 + rand(i * 17 + p) * 7,
      });
    }

    clusters.push({ basePosition, puffs, driftSpeed: 0.4 + rand(i + 40) * 0.4 });
  }
  return clusters;
}

/** A handful of cartoon clouds (clustered unlit spheres, gently flattened)
 * drifting slowly around the sky dome on a big fixed-radius loop. */
export function Clouds() {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const clusters = useMemo(() => buildClouds(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    clusters.forEach((cluster, i) => {
      const group = groupRefs.current[i];
      if (!group) return;
      const [bx, by, bz] = cluster.basePosition;
      const radius = Math.hypot(bx, bz);
      const baseAngle = Math.atan2(bz, bx);
      const angle = baseAngle + t * 0.008 * cluster.driftSpeed;
      group.position.set(Math.cos(angle) * radius, by, Math.sin(angle) * radius);
    });
  });

  return (
    <>
      {clusters.map((cluster, i) => (
        <group key={i} ref={(el) => { groupRefs.current[i] = el; }} position={cluster.basePosition}>
          {cluster.puffs.map((puff, p) => (
            <mesh key={p} position={puff.position} scale={puff.scale}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshBasicMaterial color={CLOUD_COLOR} depthWrite={false} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
