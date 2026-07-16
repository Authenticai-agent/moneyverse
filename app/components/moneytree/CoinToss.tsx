'use client';

/**
 * CoinToss - the year's new coins as something you physically toss into a
 * bucket, instead of nudging a percentage with +/- buttons. Ten identical
 * coins sit in a pile; tapping a bucket sends the next one flying there in a
 * scripted arc, then hands it off to a real Rapier rigid body so it drops
 * the last little bit and settles/jiggles against whatever's already piled
 * up - genuine physics for the one moment that benefits most from it,
 * without betting the whole interaction on freeform ballistic aim.
 *
 * Fully controlled by `history` (the ordered list of which bucket each
 * tossed coin went to, owned by MoneyTreeGame) - a tap calls `onToss`, but
 * the actual count only changes when the parent updates `history`, so an
 * "undo" from the 2D panel below drives the exact same animation path in
 * reverse. `settledRef` is allowed to lag `history` by the one coin
 * currently mid-flight; a tiny queue (`busyRef`) serialises rapid taps so
 * animations never overlap on the same coin slot.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { sfx } from '@/app/lib/moneytree/sound';
import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import { BUCKETS, type Bucket } from '@/app/lib/moneytree/types';
import { getToonGradientMap } from './toonGradient';

export const NUM_COINS = 10;

// Kept deliberately narrow (total spread well under 4 units) and close to
// centre - CameraRig widens the lens and dollies back on portrait/narrow
// screens, but there's still a limit to how much horizontal spread any
// screen shape can guarantee, so the layout itself stays tight rather than
// leaning entirely on the camera to compensate.
const BUCKET_POS: Record<Bucket, [number, number, number]> = {
  safe: [-1.55, 0, 2.15],
  growth: [0.15, 0, 2.35],
  moonshot: [1.65, 0, 2.05],
};
const BUCKET_COLOR: Record<Bucket, string> = { safe: '#2F9E67', growth: '#3A6DD8', moonshot: '#D8407A' };
const PILE_POS: [number, number, number] = [0.15, 0.15, 3.05];
const COIN_THICKNESS = 0.075;
const BUCKET_FLOOR_Y = 0.16;
const FLIGHT_TIME = 0.4;

function countsInHistory(history: Bucket[]): Record<Bucket, number> {
  const c: Record<Bucket, number> = { safe: 0, growth: 0, moonshot: 0 };
  for (const b of history) c[b]++;
  return c;
}

/** A plain (non-physics) coin mesh - used for the pile and for the one
 * coin mid-flight, where we're driving position ourselves every frame. */
function CoinMesh({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.06, 20]} />
        <meshStandardMaterial color="#FFD84D" emissive="#F3C218" emissiveIntensity={0.25} metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
}

/** A soft, breathing puddle of colored light under an interactive bucket -
 * a real-3D (not DOM) affordance that reads as "tap me" even on a touch
 * screen with no hover state, and quiets down once it's not your move. */
function BucketGlow({ bucket, interactive }: { bucket: Bucket; interactive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((state) => {
    const pulse = interactive ? Math.sin(state.clock.elapsedTime * 2.6) * 0.5 + 0.5 : 0;
    meshRef.current?.scale.setScalar(1 + pulse * 0.16);
    if (matRef.current) matRef.current.opacity = interactive ? 0.22 + pulse * 0.16 : 0.07;
  });
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
      <circleGeometry args={[0.52, 28]} />
      <meshBasicMaterial ref={matRef} color={BUCKET_COLOR[bucket]} transparent opacity={0.12} depthWrite={false} />
    </mesh>
  );
}

/** A bowl-shaped bucket - a fixed Rapier body so tossed coins land, collide,
 * and stack against it and each other instead of sinking through the floor.
 * The label is real WebGL text (drei's Text/troika), not an Html overlay -
 * Html elements here kept getting visually covered by the 2D panel below
 * (the two share screen space but not a stacking context) and needed
 * constant re-tuning as that panel's height changed; text baked into the
 * scene itself has no such conflict. */
function BucketMesh({ bucket, interactive }: { bucket: Bucket; interactive: boolean }) {
  const pos = BUCKET_POS[bucket];
  const color = BUCKET_COLOR[bucket];
  const gradientMap = getToonGradientMap();
  const profile = BUCKET_PROFILES[bucket];
  return (
    <group position={pos}>
      <BucketGlow bucket={bucket} interactive={interactive} />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.34, 0.06, 0.34]} position={[0, 0.06, 0]} />
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.42, 0.3, 0.35, 20]} />
          <meshToonMaterial color={color} gradientMap={gradientMap} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <torusGeometry args={[0.42, 0.035, 10, 24]} />
          <meshToonMaterial color={color} gradientMap={gradientMap} />
        </mesh>
      </RigidBody>
      <Text
        position={[0, 0.72, 0]}
        font="/fonts/inter-bold.woff2"
        fontSize={0.16}
        maxWidth={1.1}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#fff"
        outlineWidth={0.014}
        outlineColor={color}
      >
        {profile.label}
      </Text>
    </group>
  );
}

/** An invisible, oversized click target over each bucket (and its label) -
 * much easier to hit than the bowl's own geometry, especially on a phone. */
function BucketHitbox({ bucket, interactive, onTap }: { bucket: Bucket; interactive: boolean; onTap: (b: Bucket) => void }) {
  const pos = BUCKET_POS[bucket];
  const [hovered, setHovered] = useState(false);
  return (
    <mesh
      position={[pos[0], pos[1] + 0.42, pos[2]]}
      visible={false}
      onClick={(e) => {
        e.stopPropagation();
        if (interactive) onTap(bucket);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = interactive ? 'pointer' : 'default';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      <cylinderGeometry args={[0.68, 0.68, 1.0, 12]} />
      <meshBasicMaterial transparent opacity={hovered && interactive ? 0.1 : 0} color={BUCKET_COLOR[bucket]} />
    </mesh>
  );
}

/** A settled coin - a real dynamic rigid body, spawned a touch above the
 * current stack height in its bucket so it visibly drops the last bit and
 * jiggles to rest against whatever's already there. */
function LandedCoin({ bucket, stackIndex }: { bucket: Bucket; stackIndex: number }) {
  const base = BUCKET_POS[bucket];
  const jitter = useMemo(() => ({ x: (Math.random() - 0.5) * 0.18, z: (Math.random() - 0.5) * 0.18, rot: Math.random() * Math.PI }), []);
  return (
    <RigidBody
      type="dynamic"
      colliders="hull"
      position={[base[0] + jitter.x, base[1] + BUCKET_FLOOR_Y + stackIndex * COIN_THICKNESS + 0.12, base[2] + jitter.z]}
      rotation={[Math.PI / 2, 0, jitter.rot]}
      restitution={0.15}
      friction={0.9}
      angularDamping={0.6}
      linearDamping={0.3}
    >
      <CoinMesh />
    </RigidBody>
  );
}

interface Flight {
  kind: 'toss' | 'undo';
  bucket: Bucket;
}

/** The single coin currently mid-animation - eased arc out to a bucket, or
 * a straight return back to the pile. Not a physics body: we want full
 * control of exactly where it starts and ends so it always visibly leaves
 * the pile and always visibly arrives over the right bucket. */
function FlyingCoin({ flight, stackIndex, onDone }: { flight: Flight; stackIndex: number; onDone: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const target = BUCKET_POS[flight.bucket];
  const landY = target[1] + BUCKET_FLOOR_Y + stackIndex * COIN_THICKNESS + 0.3;
  const from = flight.kind === 'toss' ? PILE_POS : ([target[0], landY, target[2]] as [number, number, number]);
  const to = flight.kind === 'toss' ? ([target[0], landY, target[2]] as [number, number, number]) : PILE_POS;

  useEffect(() => {
    sfx.coinLaunch();
  }, [flight]);

  useFrame((_, dt) => {
    elapsed.current += dt;
    const t = Math.min(1, elapsed.current / FLIGHT_TIME);
    const ease = 1 - (1 - t) * (1 - t);
    const g = ref.current;
    if (g) {
      g.position.x = from[0] + (to[0] - from[0]) * ease;
      g.position.z = from[2] + (to[2] - from[2]) * ease;
      const arc = Math.sin(t * Math.PI) * 0.9;
      g.position.y = from[1] + (to[1] - from[1]) * ease + arc;
      g.rotation.x += dt * 10;
    }
    if (t >= 1) onDone();
  });

  return (
    <group ref={ref} position={from}>
      <CoinMesh />
    </group>
  );
}

export function CoinToss({
  history,
  interactive,
  onToss,
}: {
  history: Bucket[];
  interactive: boolean;
  onToss: (bucket: Bucket) => void;
}) {
  const settledRef = useRef<Record<Bucket, number>>({ safe: 0, growth: 0, moonshot: 0 });
  const [rendered, setRendered] = useState<Record<Bucket, number>>({ safe: 0, growth: 0, moonshot: 0 });
  const [flight, setFlight] = useState<Flight | null>(null);
  const busyRef = useRef(false);

  const processQueue = () => {
    if (busyRef.current) return;
    const target = countsInHistory(history);
    const current = settledRef.current;
    for (const b of BUCKETS) {
      if (target[b] > current[b]) {
        busyRef.current = true;
        setFlight({ kind: 'toss', bucket: b });
        return;
      }
    }
    for (const b of BUCKETS) {
      if (target[b] < current[b]) {
        busyRef.current = true;
        setFlight({ kind: 'undo', bucket: b });
        return;
      }
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { processQueue(); }, [history]);

  const handleFlightDone = () => {
    if (!flight) return;
    const delta = flight.kind === 'toss' ? 1 : -1;
    settledRef.current = { ...settledRef.current, [flight.bucket]: settledRef.current[flight.bucket] + delta };
    if (flight.kind === 'toss') sfx.coinLand();
    setRendered({ ...settledRef.current });
    setFlight(null);
    busyRef.current = false;
    // A follow-up tap (or undo) may already be queued in `history`.
    setTimeout(processQueue, 0);
  };

  const pileCount = Math.max(0, NUM_COINS - history.length);

  return (
    <>
      <Physics gravity={[0, -9.81, 0]}>
        {Array.from({ length: pileCount }, (_, i) => (
          <group key={`pile-${i}`} position={[PILE_POS[0], PILE_POS[1] + i * COIN_THICKNESS, PILE_POS[2]]}>
            <CoinMesh />
          </group>
        ))}
        {BUCKETS.map((b) => (
          <BucketMesh key={b} bucket={b} interactive={interactive && !flight} />
        ))}
        {BUCKETS.map((b) => (
          <BucketHitbox key={b} bucket={b} interactive={interactive && !flight} onTap={onToss} />
        ))}
        {BUCKETS.flatMap((b) =>
          Array.from({ length: rendered[b] }, (_, i) => <LandedCoin key={`${b}-${i}`} bucket={b} stackIndex={i} />)
        )}
        {flight && <FlyingCoin flight={flight} stackIndex={rendered[flight.bucket]} onDone={handleFlightDone} />}
      </Physics>
    </>
  );
}
