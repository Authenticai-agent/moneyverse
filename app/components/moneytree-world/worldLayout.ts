/**
 * Shared world-space layout constants and the terrain height field.
 *
 * Single source of truth for where things sit in the 60x60 world - the
 * terrain mesh, the dirt path, decor placement, and (in later phases) the
 * player spawn point and garden-plot allocation stations all read from here
 * so nothing drifts out of sync with each other.
 */

export const WORLD_SIZE = 60;

// COMPACT GARDEN LAYOUT. Everything the player interacts with is packed into
// a single small courtyard on the central mound, all within ~8 units of the
// spawn point and all in view the instant the world loads - no wandering, no
// "run off nowhere to find the next thing". The 60x60 field of grass and
// distant pines still exists, but only as a backdrop; the player never needs
// to leave the courtyard.
//
// The layout is a fan the player faces on spawn (looking -Z / "north" toward
// the tree): the three garden plots across the front, the money tree on the
// mound behind them, the bell front-left and the cash-out dock front-right.

export const TREE_POSITION: [number, number] = [0, -6.5];
/** The money tree sits on the mound, set well back behind the plots so it
 * rises up clear of the (much nearer) Growth signpost instead of hiding
 * behind it. */
export const MONEY_TREE_POSITION: [number, number] = [0, -6.5];
/** Spawn just south of the courtyard, facing it - a couple of steps from the
 * nearest plot, the whole garden ahead. */
export const SPAWN_POSITION: [number, number] = [0, 8];
/** Dock + pond, off to the right of the courtyard (clear of the moonshot
 * plot), a pretty edge to the scene rather than something to walk to. */
export const DOCK_POSITION: [number, number] = [8, 1];

/** Where the gardener (the investor) stands - right beside the bell, which it
 * "rings" to grow the year. It holds the year's coins and tosses them to the
 * plots from here, so CoinThrower reads this too (not just IdleGardener). */
export const MASCOT_POSITION: [number, number] = [-3.0, -1.8];

// Plots sit further back (smaller z = further from the camera) so they - and
// the coin piles that grow on them - ride high enough in the frame to clear
// the on-screen control card, which occupies the bottom of the view.
export const GARDEN_PLOTS: { bucket: 'safe' | 'growth' | 'moonshot'; position: [number, number] }[] = [
  // Growth is nudged off-center to the right so it doesn't cover the money
  // tree (which stands at x=0 behind the row). Spacing is intentionally not
  // equal - keeping the tree visible wins over a perfectly even row.
  { bucket: 'safe', position: [-6, -2.5] },
  { bucket: 'growth', position: [2.2, -2.5] },
  { bucket: 'moonshot', position: [6, -2.5] },
];

/** The bell that resolves a year - front-left, between the plots and tree. */
export const BELL_POSITION: [number, number] = [-3.5, 0.6];

/** No connecting dirt path anymore: with no walking, the wide brown ribbons
 * only crossed over and buried the plots. Each plot carries its own tidy soil
 * patch instead. Left empty so Terrain draws no path and Grass imposes no
 * path-clearance. */
export const PATH_WAYPOINTS: [number, number][] = [];

/**
 * Gentle rolling-hill height field - sine noise, not a heightmap texture -
 * plus a low mound under the tree so it reads from everywhere in the grove.
 * Shared by the terrain mesh (visual + collider basis), the path (so path
 * segments sit flush with the ground), and decor placement.
 */
export function terrainHeightAt(x: number, z: number): number {
  const rolling = Math.sin(x * 0.15) * Math.cos(z * 0.13) * 0.18 + Math.sin(x * 0.06 + z * 0.08) * 0.25;
  const dx = x - TREE_POSITION[0];
  const dz = z - TREE_POSITION[1];
  const distToTree = Math.sqrt(dx * dx + dz * dz);
  const mound = Math.max(0, 1 - distToTree / 8) ** 2 * 1.1;
  return rolling + mound;
}
