'use client';

/**
 * TreeScene - the 3D money tree.
 * Loads the GLB tree, auto-normalises it to a target height (so any model size
 * works), grows it with the portfolio value, and sprinkles coins as it gains.
 * Falls back to the 2D PlaceholderTree on reduced-motion, no-WebGL, or load error.
 */

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TREE_MODEL } from '@/app/lib/moneytree/mascots';
import type { Bucket } from '@/app/lib/moneytree/types';
import { Environment } from './Environment';
import { getToonGradientMap } from './toonGradient';
import { CoinToss } from './CoinToss';

function growthFactor(total: number): number {
  return 0.55 + Math.sqrt(Math.min(Math.max(total, 0), 50000) / 50000) * 0.85;
}

const TRUNK_RE = /trunk|bark|wood|stem|log|branch/i;

const HEALTHY_CANOPY = new THREE.Color('#5FD38D');
const WILTED_CANOPY = new THREE.Color('#B99A5B');

function TreeModel({ total, wilting }: { total: number; wilting?: boolean }) {
  const { scene } = useGLTF(TREE_MODEL);
  // Clone and re-material the tree: the source GLB's baked textures fail to
  // load, so we give it a clean stylised green-foliage / brown-trunk look.
  // Canopy materials are kept in their own list (not re-traversed every
  // frame) so a bad year can tint them toward a wilted tone for feedback.
  const { cloned, canopyMaterials } = useMemo(() => {
    const c = scene.clone(true);
    const canopyMats: THREE.MeshToonMaterial[] = [];
    const gradientMap = getToonGradientMap();
    c.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const name = (Array.isArray(mat) ? mat[0]?.name : mat?.name) || mesh.name;
      const isTrunk = TRUNK_RE.test(name);
      const material = new THREE.MeshToonMaterial({
        color: isTrunk ? '#8B5A2B' : '#5FD38D',
        gradientMap,
      });
      mesh.material = material;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (!isTrunk) canopyMats.push(material);
    });
    return { cloned: c, canopyMaterials: canopyMats };
  }, [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const wiltRef = useRef(0);
  const wiltColor = useRef(new THREE.Color());

  // Normalise to a target height, sit the base on the ground (y=0), and
  // recentre X/Z on the canopy's own bounding-box centre. The source GLB's
  // canopy is modelled off-axis (e.g. spanning z -1.02..0, not -0.5..0.5),
  // so without this the tree spins around a point at its own edge - sweeping
  // the whole canopy through a wide circle instead of rotating in place,
  // which periodically swings it into anything standing nearby.
  const { baseScale, yOffset, centerOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const height = size.y || 1;
    const s = 2.6 / height;
    const center = new THREE.Vector3();
    box.getCenter(center);
    return {
      baseScale: s,
      yOffset: -box.min.y * s,
      centerOffset: [-center.x, 0, -center.z] as [number, number, number],
    };
  }, [cloned]);

  const target = useRef(growthFactor(total));
  target.current = growthFactor(total);
  const current = useRef(growthFactor(total));

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += dt * 0.25;
    // ease the scale toward the target so growth animates smoothly
    current.current += (target.current - current.current) * Math.min(1, dt * 3);
    const s = baseScale * current.current;
    g.scale.setScalar(s);
    g.position.y = yOffset * current.current;

    // A bad year eases the canopy toward a wilted tone and a slight droop,
    // then eases back once the down year is behind us - visual feedback for
    // a signal the game already computed but the tree never reacted to.
    const targetWilt = wilting ? 1 : 0;
    wiltRef.current += (targetWilt - wiltRef.current) * Math.min(1, dt * 2.5);
    if (canopyMaterials.length) {
      wiltColor.current.lerpColors(HEALTHY_CANOPY, WILTED_CANOPY, wiltRef.current);
      for (const mat of canopyMaterials) mat.color.copy(wiltColor.current);
    }
    g.rotation.z = -wiltRef.current * 0.06;
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} position={centerOffset} />
    </group>
  );
}
useGLTF.preload(TREE_MODEL);

const BURST_COUNT = 26;
const BURST_LIFETIME = 1.1;

/** A one-shot puff of golden sparks fired from the canopy whenever the tree's
 * total goes up - built directly on three.js BufferGeometry/Points rather
 * than a mesh-per-particle, since a few dozen short-lived sprites is exactly
 * what a GPU point cloud is for. Each particle gets its own random launch
 * delay and velocity, arcs under a light "gravity", and fades; the whole
 * effect reports itself done (unmounts) once every particle has expired. */
function GrowthBurst({ origin }: { origin: [number, number, number] }) {
  const pointsRef = useRef<THREE.Points>(null);
  const basePos = useMemo(() => {
    const arr = new Float32Array(BURST_COUNT * 3);
    for (let i = 0; i < BURST_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.2 + Math.random() * 0.5;
      arr[i * 3 + 0] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = Math.random() * 0.25;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);
  const velocities = useMemo(() => {
    const arr = new Float32Array(BURST_COUNT * 3);
    for (let i = 0; i < BURST_COUNT; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 0.6;
      arr[i * 3 + 1] = 0.9 + Math.random() * 0.7;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }
    return arr;
  }, []);
  const delays = useMemo(() => Array.from({ length: BURST_COUNT }, () => Math.random() * 0.25), []);
  const positions = useMemo(() => basePos.slice(), [basePos]);
  const elapsed = useRef(0);
  const [done, setDone] = useState(false);

  useFrame((_, dt) => {
    if (done) return;
    elapsed.current += dt;
    const attr = pointsRef.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!attr) return;
    let allExpired = true;
    for (let i = 0; i < BURST_COUNT; i++) {
      const t = Math.min(Math.max(0, elapsed.current - delays[i]), BURST_LIFETIME);
      if (elapsed.current - delays[i] < BURST_LIFETIME) allExpired = false;
      attr.array[i * 3 + 0] = basePos[i * 3 + 0] + velocities[i * 3 + 0] * t;
      attr.array[i * 3 + 1] = basePos[i * 3 + 1] + velocities[i * 3 + 1] * t - 0.7 * t * t;
      attr.array[i * 3 + 2] = basePos[i * 3 + 2] + velocities[i * 3 + 2] * t;
    }
    attr.needsUpdate = true;
    const mat = pointsRef.current?.material as THREE.PointsMaterial | undefined;
    if (mat) mat.opacity = Math.max(0, 1 - elapsed.current / BURST_LIFETIME);
    if (allExpired) setDone(true);
  });

  if (done) return null;

  return (
    <points ref={pointsRef} position={origin}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#FFD84D" transparent opacity={1} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/** A solid gold coin - a chunky cylinder body with a slightly darker inset
 * rim on each face for an embossed edge, spinning slowly so its depth (not
 * just a flat circle) reads clearly. */
function Coin({ position, seed }: { position: [number, number, number]; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += dt * 0.9;
    g.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + seed) * 0.05;
  });
  return (
    <group ref={ref} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.07, 24]} />
        <meshStandardMaterial color="#FFD84D" emissive="#F3C218" emissiveIntensity={0.25} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.036]}>
        <ringGeometry args={[0.09, 0.14, 24]} />
        <meshStandardMaterial color="#F3C218" metalness={0.75} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.036]}>
        <ringGeometry args={[0.09, 0.14, 24]} />
        <meshStandardMaterial color="#F3C218" metalness={0.75} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Coins({ total }: { total: number }) {
  const tiers = [400, 1500, 4000, 10000, 20000];
  const positions: [number, number, number][] = [
    [0.9, 1.6, 0.4],
    [-0.8, 1.2, 0.5],
    [0.3, 2.1, -0.6],
    [-0.6, 2.0, -0.3],
    [0.7, 1.0, -0.7],
  ];
  return (
    <>
      {tiers.map((t, i) => (total > t ? <Coin key={i} position={positions[i]} seed={i} /> : null))}
    </>
  );
}

const LOOK_AT = new THREE.Vector3(0, 1.3, 0);
const BASE_CAMERA_POS = new THREE.Vector3(0, 2.2, 6);
const BASE_FOV = 42;
// Below this width:height ratio (portrait phones, and even a phone in the
// fullscreen overlay), the hand-tuned framing above no longer keeps the
// bucket row in view - a narrow canvas has a much narrower horizontal FOV
// for the same vertical FOV, so wide-set content clips at the sides. Once
// the aspect drops under this reference (roughly the shape of the desktop
// card this was tuned against), dolly the camera back and open the lens a
// touch, smoothly, so nothing pops - at/above the reference the original
// framing is untouched.
const REFERENCE_ASPECT = 1.5;
const MIN_ASPECT = 0.35;
const MAX_DISTANCE_SCALE = 1.55;
const MAX_FOV = 56;

/** Idle life for the camera - a slow, small horizontal sway, always re-aiming
 * at the tree - plus the responsive reframing described above. */
function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const aspect = Math.max(size.width / Math.max(size.height, 1), MIN_ASPECT);
    const narrowness = aspect >= REFERENCE_ASPECT ? 0 : Math.min(1, (REFERENCE_ASPECT - aspect) / REFERENCE_ASPECT);
    const distanceScale = 1 + narrowness * (MAX_DISTANCE_SCALE - 1);
    const fov = BASE_FOV + narrowness * (MAX_FOV - BASE_FOV);

    camera.position.set(
      LOOK_AT.x + (BASE_CAMERA_POS.x - LOOK_AT.x) * distanceScale + Math.sin(t * 0.15) * 0.05,
      LOOK_AT.y + (BASE_CAMERA_POS.y - LOOK_AT.y) * distanceScale,
      LOOK_AT.z + (BASE_CAMERA_POS.z - LOOK_AT.z) * distanceScale
    );
    camera.lookAt(LOOK_AT);

    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function Scene({
  total,
  wilting,
  tossHistory,
  tossInteractive,
  onToss,
}: {
  total: number;
  wilting?: boolean;
  tossHistory: Bucket[];
  tossInteractive: boolean;
  onToss: (bucket: Bucket) => void;
}) {
  // Fire a burst of sparks from the canopy whenever the total meaningfully
  // increases (a "grow the year" that paid off) - a fresh `key` per burst so
  // React fully remounts GrowthBurst instead of trying to reset it mid-flight.
  const [burstId, setBurstId] = useState(0);
  const prevTotalRef = useRef(total);
  useEffect(() => {
    if (total > prevTotalRef.current + 0.5) setBurstId((id) => id + 1);
    prevTotalRef.current = total;
  }, [total]);

  return (
    <>
      <CameraRig />
      <hemisphereLight args={['#FFEFD6', '#4B7A52', 0.6]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.3}
        color="#FFE9C2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <directionalLight position={[-4, 3, -4]} intensity={0.22} color="#D9C9FF" />
      <Suspense fallback={null}>
        <TreeModel total={total} wilting={wilting} />
        <Environment />
      </Suspense>
      <Coins total={total} />
      <Suspense fallback={null}>
        <CoinToss history={tossHistory} interactive={tossInteractive} onToss={onToss} />
      </Suspense>
      {burstId > 0 && <GrowthBurst key={burstId} origin={[0, 1.3, 0]} />}
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.4} luminanceSmoothing={0.25} intensity={0.45} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.5} />
      </EffectComposer>
    </>
  );
}

/** Falls back to `fallback` if anything in the 3D subtree throws. */
class GLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function TreeScene({
  total,
  wilting,
  tossHistory,
  tossInteractive = false,
  onToss,
  fallback,
}: {
  total: number;
  wilting?: boolean;
  /** Ordered list of which bucket each of this year's coins has been tossed into so far. */
  tossHistory: Bucket[];
  /** Whether tapping a bucket should launch a coin right now (only true mid-turn while playing). */
  tossInteractive?: boolean;
  onToss: (bucket: Bucket) => void;
  fallback: ReactNode;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(prefersReducedMotion()), []);

  if (reduced) return fallback;

  return (
    <div className="absolute inset-x-0" style={{ top: 0, bottom: 230, zIndex: 3 }}>
      <GLBoundary fallback={fallback}>
        <Canvas shadows camera={{ position: [0, 2.2, 6], fov: 42 }} dpr={[1, 1.8]} gl={{ antialias: true }}>
          <Scene
            total={total}
            wilting={wilting}
            tossHistory={tossHistory}
            tossInteractive={tossInteractive}
            onToss={onToss}
          />
        </Canvas>
      </GLBoundary>
    </div>
  );
}
