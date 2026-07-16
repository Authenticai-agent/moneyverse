'use client';

/**
 * World - Canvas root for the walkable Money Tree world.
 *
 * Phase 0 stub: sky color, one shadow-casting light, a Rapier physics
 * provider, flat terrain, and a walkable player capsule - just enough to
 * confirm the whole stack (R3F + Rapier + Zustand) boots behind next/dynamic.
 * Later phases layer in: the real island terrain + grass + grove decor
 * (Phase 1), player model + camera polish (Phase 2), the growth/mood tree
 * (Phase 3), diegetic stations replacing every card/slider (Phase 4), and
 * ambient audio + postprocessing (Phase 5).
 */

import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { FollowCamera } from './FollowCamera';
import { Player } from './Player';
import { Terrain } from './Terrain';

const SKY_COLOR = '#CFEEFB';

export default function World() {
  return (
    <div className="absolute inset-0">
      <Canvas shadows camera={{ position: [0, 3.5, 6], fov: 50 }}>
        <color attach="background" args={[SKY_COLOR]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
        <Physics gravity={[0, -9.81, 0]}>
          <Terrain />
          <Player />
        </Physics>
        <FollowCamera />
      </Canvas>
    </div>
  );
}
