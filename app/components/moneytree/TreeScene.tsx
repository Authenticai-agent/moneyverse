'use client';

/**
 * TreeScene - the 3D money tree.
 * Loads the GLB tree, auto-normalises it to a target height (so any model size
 * works), grows it with the portfolio value, and sprinkles coins as it gains.
 * Falls back to the 2D PlaceholderTree on reduced-motion, no-WebGL, or load error.
 */

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TREE_MODEL } from '@/app/lib/moneytree/mascots';

function growthFactor(total: number): number {
  return 0.55 + Math.sqrt(Math.min(Math.max(total, 0), 50000) / 50000) * 0.85;
}

const TRUNK_RE = /trunk|bark|wood|stem|log|branch/i;

function TreeModel({ total }: { total: number }) {
  const { scene } = useGLTF(TREE_MODEL);
  // Clone and re-material the tree: the source GLB's baked textures fail to
  // load, so we give it a clean stylised green-foliage / brown-trunk look.
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const name = (Array.isArray(mat) ? mat[0]?.name : mat?.name) || mesh.name;
      const isTrunk = TRUNK_RE.test(name);
      mesh.material = new THREE.MeshStandardMaterial({
        color: isTrunk ? '#8B5A2B' : '#5FD38D',
        roughness: 0.85,
        metalness: 0,
      });
    });
    return c;
  }, [scene]);
  const groupRef = useRef<THREE.Group>(null);

  // Normalise to a target height and sit the base on the ground (y=0).
  const { baseScale, yOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const height = size.y || 1;
    const s = 2.6 / height;
    return { baseScale: s, yOffset: -box.min.y * s };
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
  });

  return (
    <group ref={groupRef}>
      <primitive object={cloned} />
    </group>
  );
}
useGLTF.preload(TREE_MODEL);

function Coins({ total }: { total: number }) {
  const tiers = [400, 1500, 4000, 10000, 20000];
  const positions: [number, number, number][] = [
    [0.9, 1.6, 0.4],
    [-0.8, 1.2, 0.5],
    [0.3, 2.1, -0.6],
    [-0.6, 2.0, -0.3],
    [0.7, 1.0, -0.7],
  ];
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.children.forEach((c, i) => (c.position.y += Math.sin(state.clock.elapsedTime * 2 + i) * 0.0015));
  });
  return (
    <group ref={ref}>
      {tiers.map((t, i) =>
        total > t ? (
          <mesh key={i} position={positions[i]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.04, 20]} />
            <meshStandardMaterial color="#FFD84D" emissive="#F3C218" emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
          </mesh>
        ) : null
      )}
    </group>
  );
}

function Scene({ total }: { total: number }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 8, 5]} intensity={1.1} castShadow />
      <directionalLight position={[-4, 3, -4]} intensity={0.3} />
      <Suspense fallback={null}>
        <TreeModel total={total} />
      </Suspense>
      <Coins total={total} />
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[4, 48]} />
        <meshStandardMaterial color="#6FCF94" />
      </mesh>
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

export default function TreeScene({ total, fallback }: { total: number; wilting?: boolean; fallback: ReactNode }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(prefersReducedMotion()), []);

  if (reduced) return <>{fallback}</>;

  return (
    <div className="absolute inset-x-0" style={{ top: 0, bottom: 150, zIndex: 3 }}>
      <GLBoundary fallback={fallback}>
        <Canvas camera={{ position: [0, 2.2, 6], fov: 42 }} dpr={[1, 1.8]} gl={{ antialias: true }}>
          <Scene total={total} />
        </Canvas>
      </GLBoundary>
    </div>
  );
}
