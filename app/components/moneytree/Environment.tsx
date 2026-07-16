'use client';

/**
 * Environment - the cozy grove surrounding the money tree, styled after warm
 * "cottagecore village" life-sim games: toon-shaded foliage, wooden fences,
 * glowing lantern posts, and a small lily pond, instead of realistic PBR
 * shading. Pine trees and rocks are pure procedural geometry (stacked cones,
 * cylinders, icosahedra) rather than downloaded GLBs: the free-library
 * "tree-pine" models turned out to be alpha-cutout billboard sprites (a
 * couple of flat quads meant to be masked by a texture) - without their
 * texture they render as solid rectangles, so procedural shapes are both
 * simpler and more reliable here. The bush GLB has real volumetric geometry
 * and works fine.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getToonGradientMap } from './toonGradient';

const SKY_COLOR = '#CFEEFB';
const FOG_COLOR = '#E9F3E0';

const BUSH_MODEL = '/models/moneytree/bush-3d.glb';
const GROUND_TEXTURE = '/textures/moneytree/ground-grass-dirt.jpg';

const PINE_FOLIAGE = '#3E7C4A';
const PINE_TRUNK = '#8B5A2B';
const BUSH_FOLIAGE = '#4CAF6D';
const WOOD_COLOR = '#B9834F';
const WOOD_DARK = '#8A5D34';

function normalize(object: THREE.Object3D, targetHeight: number) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const height = size.y || 1;
  const scale = targetHeight / height;
  return { scale, yOffset: -box.min.y * scale };
}

const TRUNK_RE = /trunk|bark|wood|stem|log|branch/i;

/** The bush GLB references an external texture file that isn't bundled in
 * the standalone .glb, so its baked material fails to load - swap in a flat
 * toon color instead (same fix TreeScene already applies to the main tree). */
function restyle(object: THREE.Object3D, foliageColor: string, trunkColor?: string) {
  const gradientMap = getToonGradientMap();
  object.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    const name = (Array.isArray(mat) ? mat[0]?.name : mat?.name) || mesh.name;
    const isTrunk = trunkColor !== undefined && TRUNK_RE.test(name);
    mesh.material = new THREE.MeshToonMaterial({
      color: isTrunk ? trunkColor : foliageColor,
      gradientMap,
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

function Bush({ position, rotationY, targetHeight }: { position: [number, number, number]; rotationY: number; targetHeight: number }) {
  const { scene } = useGLTF(BUSH_MODEL);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    restyle(c, BUSH_FOLIAGE);
    return c;
  }, [scene]);
  const { scale, yOffset } = useMemo(() => normalize(cloned, targetHeight), [cloned, targetHeight]);
  return (
    <primitive
      object={cloned}
      position={[position[0], position[1] + yOffset, position[2]]}
      rotation={[0, rotationY, 0]}
      scale={scale}
    />
  );
}
useGLTF.preload(BUSH_MODEL);

/** A simple layered-cone pine tree - no asset dependency. */
function PineTree({ position, scale = 1, rotationY = 0 }: { position: [number, number, number]; scale?: number; rotationY?: number }) {
  const gradientMap = getToonGradientMap();
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.5, 8]} />
        <meshToonMaterial color={PINE_TRUNK} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.55, 0.9, 8]} />
        <meshToonMaterial color={PINE_FOLIAGE} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.42, 0.75, 8]} />
        <meshToonMaterial color={PINE_FOLIAGE} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.3, 0.55, 8]} />
        <meshToonMaterial color={PINE_FOLIAGE} gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

const TREES: { position: [number, number, number]; scale: number; rotationY: number }[] = [
  { position: [-2.2, 0, -1.5], scale: 0.85, rotationY: 0.3 },
  { position: [2.4, 0, -2.2], scale: 0.7, rotationY: 1.1 },
  { position: [-3.3, 0, 0.5], scale: 1.1, rotationY: 2.0 },
  { position: [3.4, 0, -0.8], scale: 1.2, rotationY: 0.4 },
  { position: [-1.6, 0, -3.6], scale: 1.35, rotationY: 0.8 },
  { position: [2.0, 0, -3.8], scale: 1.25, rotationY: 2.5 },
];

const BUSHES: { position: [number, number, number]; rotationY: number; targetHeight: number }[] = [
  { position: [-1.3, 0, 1.7], rotationY: 0.6, targetHeight: 0.55 },
  { position: [1.5, 0, 1.9], rotationY: 2.1, targetHeight: 0.5 },
];

const ROCKS: { position: [number, number, number]; scale: number; seed: number }[] = [
  { position: [-1.8, 0.12, 2.4], scale: 0.22, seed: 0.4 },
  { position: [1.9, 0.1, 2.5], scale: 0.18, seed: 1.7 },
  { position: [-2.6, 0.14, -0.5], scale: 0.26, seed: 2.6 },
  { position: [2.7, 0.11, 0.3], scale: 0.2, seed: 3.3 },
];

function Rock({ position, scale, seed }: { position: [number, number, number]; scale: number; seed: number }) {
  return (
    <mesh position={position} rotation={[seed, seed * 1.3, seed * 0.7]} scale={scale} castShadow receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshToonMaterial color="#9C9C94" gradientMap={getToonGradientMap()} />
    </mesh>
  );
}

function Ground() {
  const texture = useTexture(GROUND_TEXTURE);
  useMemo(() => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[6, 64]} />
      <meshToonMaterial map={texture} gradientMap={getToonGradientMap()} />
    </mesh>
  );
}

/** A short wooden fence post with two horizontal rails - the same "cared for
 * village" cue as the reference's cottage-core fencing, built from plain
 * cylinders (no texture dependency). */
function FencePost({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const gradientMap = getToonGradientMap();
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.44, 8]} />
        <meshToonMaterial color={WOOD_DARK} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.19, 0.26, 0]} castShadow>
        <boxGeometry args={[0.34, 0.045, 0.045]} />
        <meshToonMaterial color={WOOD_COLOR} gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0.19, 0.15, 0]} castShadow>
        <boxGeometry args={[0.34, 0.045, 0.045]} />
        <meshToonMaterial color={WOOD_COLOR} gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

const FENCE_RUNS: { positions: [number, number, number][]; rotationY: number }[] = [
  {
    rotationY: 0,
    positions: [
      [-2.4, 0, 3.1],
      [-2.05, 0, 3.1],
      [-1.7, 0, 3.1],
    ],
  },
  {
    rotationY: 0,
    positions: [
      [1.7, 0, 3.1],
      [2.05, 0, 3.1],
      [2.4, 0, 3.1],
    ],
  },
];

/** A warm glowing lantern post - a small emissive "flame" box on a wooden
 * pole, echoing the reference scene's path lanterns. Flickers gently. */
function Lantern({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flicker = 0.85 + Math.sin(t * 9) * 0.08 + Math.sin(t * 3.7) * 0.05;
    if (lightRef.current) lightRef.current.intensity = 0.55 * flicker;
    const mat = flameRef.current?.material as THREE.MeshStandardMaterial | undefined;
    if (mat) mat.emissiveIntensity = 1.1 * flicker;
  });
  const gradientMap = getToonGradientMap();
  return (
    <group position={position}>
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.03, 0.035, 0.64, 8]} />
        <meshToonMaterial color={WOOD_DARK} gradientMap={gradientMap} />
      </mesh>
      <mesh ref={flameRef} position={[0, 0.66, 0]}>
        <boxGeometry args={[0.11, 0.14, 0.11]} />
        <meshStandardMaterial color="#FFE9A8" emissive="#FFC24B" emissiveIntensity={1.1} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.66, 0]} color="#FFC24B" intensity={0.55} distance={2.2} decay={2} />
    </group>
  );
}

const LANTERNS: [number, number, number][] = [
  [-2.9, 0, 1.4],
  [2.9, 0, 1.4],
];

/** A small round lily pond tucked to one side - flattened cylinder "water"
 * plus a few floating lily-pad discs, echoing the reference scene's pond. */
function Pond({ position }: { position: [number, number, number] }) {
  const waterMeshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const mat = waterMeshRef.current?.material as THREE.MeshStandardMaterial | undefined;
    if (mat) mat.emissiveIntensity = 0.12 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
  });
  const pads: { angle: number; radius: number; scale: number }[] = [
    { angle: 0.4, radius: 0.35, scale: 0.16 },
    { angle: 2.6, radius: 0.42, scale: 0.13 },
    { angle: 4.4, radius: 0.28, scale: 0.11 },
  ];
  return (
    <group position={position}>
      <mesh ref={waterMeshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[0.85, 32]} />
        <meshStandardMaterial color="#6FB8D6" emissive="#3E86A8" emissiveIntensity={0.12} roughness={0.3} metalness={0.1} />
      </mesh>
      {pads.map((p, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[Math.cos(p.angle) * p.radius, 0.022, Math.sin(p.angle) * p.radius]}
          scale={p.scale}
        >
          <circleGeometry args={[1, 12]} />
          <meshToonMaterial color="#5FAE5C" gradientMap={getToonGradientMap()} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/** A tiny daisy-like flower cluster - a yellow center bead with a few white
 * petal discs, scattered near the fence line for cottage-core detail. */
function Flower({ position, hue = '#fff' }: { position: [number, number, number]; hue?: string }) {
  const gradientMap = getToonGradientMap();
  const petals = 5;
  return (
    <group position={position} scale={0.09}>
      {Array.from({ length: petals }).map((_, i) => {
        const a = (i / petals) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.55, 0.3, Math.sin(a) * 0.55]} rotation={[Math.PI / 2, 0, a]}>
            <circleGeometry args={[0.5, 8]} />
            <meshToonMaterial color={hue} gradientMap={gradientMap} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.31, 0]}>
        <sphereGeometry args={[0.32, 8, 8]} />
        <meshToonMaterial color="#FFD84D" gradientMap={gradientMap} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.28, 6]} />
        <meshToonMaterial color="#4C8A4E" gradientMap={gradientMap} />
      </mesh>
    </group>
  );
}

const FLOWERS: { position: [number, number, number]; hue?: string }[] = [
  { position: [-2.6, 0, 2.0], hue: '#fff' },
  { position: [-2.35, 0, 2.35], hue: '#FFEEF5' },
  { position: [2.6, 0, 2.0], hue: '#fff' },
  { position: [2.3, 0, 2.4], hue: '#FFEEF5' },
  { position: [-3.1, 0, -0.2], hue: '#fff' },
  { position: [3.15, 0, -0.4], hue: '#FFEEF5' },
];

const MOTE_COUNT = 34;

/** Slow-drifting pollen/firefly motes for atmosphere - a plain three.js
 * Points cloud (cheaper and simpler than 34 individual meshes) that loops
 * forever, each mote bobbing on its own sine offset so the cloud never looks
 * like it's moving in lockstep. */
function AmbientMotes() {
  const ref = useRef<THREE.Points>(null);
  const basePos = useMemo(() => {
    const arr = new Float32Array(MOTE_COUNT * 3);
    for (let i = 0; i < MOTE_COUNT; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 1] = 0.3 + Math.random() * 3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    return arr;
  }, []);
  const speeds = useMemo(() => Array.from({ length: MOTE_COUNT }, () => 0.05 + Math.random() * 0.1), []);
  const positions = useMemo(() => basePos.slice(), [basePos]);

  useFrame((state) => {
    const attr = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!attr) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < MOTE_COUNT; i++) {
      attr.array[i * 3 + 0] = basePos[i * 3 + 0] + Math.sin(t * 0.4 + i) * 0.3;
      attr.array[i * 3 + 1] = basePos[i * 3 + 1] + Math.sin(t * speeds[i] + i * 2) * 0.4;
      attr.array[i * 3 + 2] = basePos[i * 3 + 2] + Math.cos(t * 0.35 + i) * 0.3;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} color="#FFF7C2" transparent opacity={0.65} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export function Environment() {
  return (
    <>
      <color attach="background" args={[SKY_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, 10, 23]} />
      <Ground />
      {TREES.map((t, i) => (
        <PineTree key={i} position={t.position} scale={t.scale} rotationY={t.rotationY} />
      ))}
      {BUSHES.map((b, i) => (
        <Bush key={i} position={b.position} rotationY={b.rotationY} targetHeight={b.targetHeight} />
      ))}
      {ROCKS.map((r, i) => (
        <Rock key={i} position={r.position} scale={r.scale} seed={r.seed} />
      ))}
      {FENCE_RUNS.map((run, ri) =>
        run.positions.map((p, pi) => <FencePost key={`${ri}-${pi}`} position={p} rotationY={run.rotationY} />)
      )}
      {LANTERNS.map((p, i) => (
        <Lantern key={i} position={p} />
      ))}
      <Pond position={[-3.6, 0, -2.4]} />
      {FLOWERS.map((f, i) => (
        <Flower key={i} position={f.position} hue={f.hue} />
      ))}
      <AmbientMotes />
    </>
  );
}
