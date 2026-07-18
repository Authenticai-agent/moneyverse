'use client';

/**
 * Grass - a few thousand instanced cross-quad blades (two crossed planes,
 * cheap volumetric look from any angle), wind-swayed by rotating each
 * instance slightly around its own base every frame on the CPU.
 *
 * Deliberately NOT using a custom onBeforeCompile shader splice into
 * MeshToonMaterial's compiled output for the sway - that technique caused a
 * real (not just a test-tool) THREE.WebGLRenderer "Context Lost" crash
 * roughly a second after mount, reproduced in a real browser. Plain,
 * unmodified materials only for grass until that's understood.
 *
 * This single element carries more of the "walkable grove" feeling than
 * anything else in Phase 1, per the master prompt - built before decor.
 */

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getToonGradientMap } from './toonGradient';
import { PATH_WAYPOINTS, WORLD_SIZE, terrainHeightAt } from './worldLayout';

const BLADE_COUNT = 3500;
const MAX_BLADE_COUNT = 3500; // upper bound for the InstancedMesh buffer
const BLADE_WIDTH = 0.1;
const BLADE_HEIGHT = 0.45;
const PATH_CLEARANCE = 1.7;
const PLAY_RADIUS = WORLD_SIZE / 2 - 3;

type BladeInstance = { position: [number, number, number]; rotationY: number; scale: number; phase: number };

function distanceToPath(x: number, z: number): number {
  let min = Infinity;
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const [ax, az] = PATH_WAYPOINTS[i];
    const [bx, bz] = PATH_WAYPOINTS[i + 1];
    const abx = bx - ax;
    const abz = bz - az;
    const lenSq = abx * abx + abz * abz || 1;
    const t = THREE.MathUtils.clamp(((x - ax) * abx + (z - az) * abz) / lenSq, 0, 1);
    const cx = ax + abx * t;
    const cz = az + abz * t;
    const d = Math.hypot(x - cx, z - cz);
    if (d < min) min = d;
  }
  return min;
}

/** A blade: two crossed quads tapering to a point, root at y=0 so rotating
 * the instance around its own origin bends it at the base like real wind. */
function buildBladeGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const hw = BLADE_WIDTH / 2;

  const addQuad = (angle: number) => {
    const base = positions.length / 3;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const corners: [number, number][] = [
      [-hw, 0],
      [hw, 0],
      [hw * 0.3, BLADE_HEIGHT],
      [-hw * 0.3, BLADE_HEIGHT],
    ];
    for (const [x, y] of corners) {
      positions.push(x * cos, y, x * sin);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  addQuad(0);
  addQuad(Math.PI / 2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildInstances(count: number): BladeInstance[] {
  const instances: BladeInstance[] = [];
  let attempts = 0;
  while (instances.length < count && attempts < count * 4) {
    attempts++;
    const x = (Math.random() - 0.5) * PLAY_RADIUS * 2;
    const z = (Math.random() - 0.5) * PLAY_RADIUS * 2;
    if (distanceToPath(x, z) < PATH_CLEARANCE) continue;
    instances.push({
      position: [x, terrainHeightAt(x, z), z],
      rotationY: Math.random() * Math.PI * 2,
      scale: 0.75 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return instances;
}

export function Grass({ count = BLADE_COUNT }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => buildBladeGeometry(), []);
  const instances = useMemo(() => buildInstances(count), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const gradientMap = getToonGradientMap();
  const material = useMemo(() => new THREE.MeshToonMaterial({ color: '#4F9E4A', gradientMap, side: THREE.DoubleSide }), [gradientMap]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (mesh) mesh.count = instances.length;
  }, [instances]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const sway = Math.sin(t * 1.6 + inst.phase) * 0.1 + Math.sin(t * 3.1 + inst.phase * 1.7) * 0.04;
      dummy.position.set(inst.position[0], inst.position[1], inst.position[2]);
      dummy.rotation.set(sway, inst.rotationY, 0);
      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, MAX_BLADE_COUNT]} />;
}
