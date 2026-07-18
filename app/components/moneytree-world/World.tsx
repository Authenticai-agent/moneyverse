'use client';

/**
 * World - Canvas root for the Money Tree garden (fully-painted 2.5D).
 *
 * The world is one cohesive illustration seen from a fixed, hand-framed camera:
 * a painted sky/landscape Backdrop, a painted grass GroundPlane, and on top of
 * it a small cast of hand-illustrated billboard sprites - the money TreeSprite,
 * the three BucketField pots (Safe / Growth / Moonshot), the IdleGardener (the
 * "investor"), and the floating Coach (the educator). Everything is the same
 * painterly art style and lit into the painting itself (unlit meshBasic /
 * sprite materials), so there is no seam between a 3D environment and the 2D
 * art - the earlier low-poly terrain, grass, decor, mood lighting and sky dome
 * were removed in favor of this single painted look.
 *
 * The player does NOT walk. Everything is driven from the on-screen
 * GardenControls bar (toss coins into a bucket, ring the bell to grow the year,
 * cash out), and the scene reacts as diegetic feedback: the gardener tosses
 * coins (CoinThrower) that land and pile in the pots, and the tree grows and
 * changes mood. The game logic itself is unchanged - only the presentation is
 * this painted world.
 */

import { Canvas } from '@react-three/fiber';
import { Backdrop } from './Backdrop';
import { BucketField } from './BucketField';
import { Coach } from './Coach';
import { CoachPicker } from './CoachPicker';
import { CoachSpeech } from './CoachSpeech';
import { CoinThrower } from './CoinThrower';
import { FixedCamera } from './FixedCamera';
import { GardenControls } from './GardenControls';
import { GroundPlane } from './GroundPlane';
import { GroundShadow } from './GroundShadow';
import { IdleGardener } from './IdleGardener';
import { Scenery } from './Scenery';
import { TreeSprite } from './TreeSprite';
import { YearResult } from './YearResult';
import { useQualityTier } from './quality';
import { GARDEN_PLOTS, MASCOT_POSITION, MONEY_TREE_POSITION } from './worldLayout';

/**
 * @param embedded - true when the world is the playing view of a real
 *   useMoneyTreeGame session (via GardenStage). In that case the coach is fixed
 *   by the setup screen (hide the in-world CoachPicker) and the year-result
 *   popup is owned by the game host's EventCard (hide the in-world YearResult),
 *   so they don't double up. Left false, the world is the standalone demo.
 */
export default function World({ embedded = false }: { embedded?: boolean }) {
  // On phones/low-tier devices we cap the pixel ratio. The painted 2.5D scene
  // is already cheap (a handful of unlit sprites + two textured planes), so
  // there's little else to shed.
  const low = useQualityTier() === 'low';

  return (
    <div className="absolute inset-0">
      <Canvas dpr={low ? [1, 1.5] : [1, 2]} camera={{ position: [4.6, 6.4, 12.6], fov: 46 }}>
        {/* The whole scene is unlit painted art, but a soft ambient keeps any
            incidental standard-material safe and lets sprites read at full
            texture brightness. */}
        <ambientLight intensity={1} />
        <Backdrop />
        <GroundPlane />
        {/* Distant hedge + mid scatter, behind the tree and pots. */}
        <Scenery layer="back" />
        {/* Soft blob shadows where each sprite meets the grass - what makes the
            flat billboards read as planted in the world rather than floating. */}
        <GroundShadow position={MONEY_TREE_POSITION} radius={1.9} />
        <GroundShadow position={MASCOT_POSITION} radius={1.35} />
        {GARDEN_PLOTS.map((p) => (
          <GroundShadow key={p.bucket} position={p.position} radius={1.05} />
        ))}
        <TreeSprite />
        <BucketField />
        <IdleGardener />
        <Coach />
        <CoachSpeech />
        <CoinThrower />
        {/* Big foreground clusters framing the bottom corners, in front. */}
        <Scenery layer="front" />
        <FixedCamera />
      </Canvas>
      {!embedded && <CoachPicker />}
      <GardenControls />
      {/* Standalone demo only - in a real game the host renders EventCard. */}
      {!embedded && <YearResult />}
    </div>
  );
}
