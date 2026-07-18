'use client';

/**
 * Terrain - a gently displaced ground plane (sine noise via terrainHeightAt,
 * not a heightmap texture) with patchy two-tone toon-shaded grass and a
 * dirt-colored path loop, sitting on a fixed Rapier heightfield collider.
 *
 * Deliberately a heightfield rather than a trimesh: a trimesh auto-collider
 * under a dynamic body that walks across it (the player capsule) is prone to
 * catching on internal triangle edges, producing jitter that snowballs into
 * the body being launched into empty space after a second or so of contact -
 * heightfields don't have that edge-catching failure mode, which is exactly
 * why Rapier documents them as the shape for walkable terrain.
 */

import { useMemo } from 'react';
import { HeightfieldCollider, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { getToonGradientMap } from './toonGradient';
import { PATH_WAYPOINTS, WORLD_SIZE, terrainHeightAt } from './worldLayout';

const SEGMENTS = 72;
const GRASS_DARK = new THREE.Color('#5FAE55');
const GRASS_LIGHT = new THREE.Color('#7BC96B');
const PATH_COLOR = '#B9834F';
const PATH_WIDTH = 2.2;

// Collider resolution is deliberately coarser than the visual mesh (SEGMENTS)
// - a heightfield only needs to be smooth enough to walk on, not pixel-exact.
const HEIGHTFIELD_RESOLUTION = 48;

/** Column-major height samples, per Rapier's heightfield convention: row
 * index maps to local X, column index maps to local Z, heights[row + col *
 * (nrows + 1)]. */
function buildHeightfieldSamples(): number[] {
  const nrows = HEIGHTFIELD_RESOLUTION;
  const ncols = HEIGHTFIELD_RESOLUTION;
  const heights = new Array<number>((nrows + 1) * (ncols + 1)).fill(0);
  for (let row = 0; row <= nrows; row++) {
    const x = (row / nrows - 0.5) * WORLD_SIZE;
    for (let col = 0; col <= ncols; col++) {
      const z = (col / ncols - 0.5) * WORLD_SIZE;
      heights[row + col * (nrows + 1)] = terrainHeightAt(x, z);
    }
  }
  return heights;
}

function buildGroundGeometry(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, SEGMENTS, SEGMENTS);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, terrainHeightAt(x, z));

    // Patchy two-tone variation, independent of height, so the field reads
    // as a real grove instead of a flat single-color plane.
    const patch = Math.sin(x * 0.4 + z * 0.31) + Math.sin(x * 0.17 - z * 0.53);
    const t = THREE.MathUtils.clamp(patch * 0.25 + 0.5, 0, 1);
    tmp.copy(GRASS_DARK).lerp(GRASS_LIGHT, t);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

type PathSegment = { position: [number, number, number]; length: number; angle: number };

function buildPathSegments(): PathSegment[] {
  const segments: PathSegment[] = [];
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i++) {
    const [ax, az] = PATH_WAYPOINTS[i];
    const [bx, bz] = PATH_WAYPOINTS[i + 1];
    const midX = (ax + bx) / 2;
    const midZ = (az + bz) / 2;
    const dx = bx - ax;
    const dz = bz - az;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);
    const y = terrainHeightAt(midX, midZ) + 0.03;
    segments.push({ position: [midX, y, midZ], length, angle });
  }
  return segments;
}

export function Terrain() {
  const groundGeometry = useMemo(() => buildGroundGeometry(), []);
  const heightSamples = useMemo(() => buildHeightfieldSamples(), []);
  const pathSegments = useMemo(() => buildPathSegments(), []);
  const gradientMap = getToonGradientMap();

  return (
    <>
      <RigidBody type="fixed" colliders={false} friction={1}>
        <mesh geometry={groundGeometry} receiveShadow>
          <meshToonMaterial vertexColors gradientMap={gradientMap} />
        </mesh>
        <HeightfieldCollider
          args={[HEIGHTFIELD_RESOLUTION, HEIGHTFIELD_RESOLUTION, heightSamples, { x: WORLD_SIZE, y: 1, z: WORLD_SIZE }]}
        />
      </RigidBody>
      {pathSegments.map((seg, i) => (
        <mesh key={i} position={seg.position} rotation={[0, seg.angle, 0]} receiveShadow>
          <boxGeometry args={[PATH_WIDTH, 0.04, seg.length + 0.4]} />
          <meshToonMaterial color={PATH_COLOR} gradientMap={gradientMap} />
        </mesh>
      ))}
    </>
  );
}
