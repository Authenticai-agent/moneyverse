/**
 * Money Tree — mascot registry
 * ----------------------------
 * The four coach characters, each backed by a GLB model in
 * /public/models/moneytree. `emoji` is a lightweight stand-in used in 2D UI and
 * as a fallback while the 3D model loads.
 */

import type { MascotId } from './types';

export interface Mascot {
  id: MascotId;
  name: string;
  role: string;
  emoji: string;
  /** Public path to the GLB model. */
  model: string;
}

export const MASCOTS: Mascot[] = [
  { id: 'wizard', name: 'Sage', role: 'Money Wizard', emoji: '🧙', model: '/models/moneytree/low-poly-wizard.glb' },
  { id: 'robot', name: 'Bit', role: 'Money Robot', emoji: '🤖', model: '/models/moneytree/cute-mechanical-robot.glb' },
  { id: 'adventurer', name: 'Robin', role: 'Coin Explorer', emoji: '🧭', model: '/models/moneytree/cute-chibi-adventurer.glb' },
  { id: 'hero', name: 'Nova', role: 'Future Investor', emoji: '🦸', model: '/models/moneytree/cyberpunk-player.glb' },
];

/** The tree model used for the 3D stage. */
export const TREE_MODEL = '/models/moneytree/pixel-tree-broad-deciduous-3d.glb';

export function mascotById(id: MascotId): Mascot {
  return MASCOTS.find((m) => m.id === id) ?? MASCOTS[0];
}
