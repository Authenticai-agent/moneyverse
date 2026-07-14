/**
 * Money Tree — mascot registry
 * ----------------------------
 * The four coach characters, each backed by a GLB model in
 * /public/models/moneytree. `emoji` is a lightweight stand-in used in 2D UI and
 * as a fallback while the 3D model loads.
 */

import type { MascotId } from './types';

/**
 * Each coach has a distinct investing personality that colors every line they
 * say — from the setup screen to yearly nudges to the end report. The facts
 * they teach never change; only their risk appetite and tone do.
 */
export type CoachPersona = 'bold' | 'balanced' | 'calm' | 'cautious';

export interface Mascot {
  id: MascotId;
  name: string;
  role: string;
  persona: CoachPersona;
  personaLabel: string;
  /** One-line description of their investing style, shown on the setup screen. */
  tagline: string;
  emoji: string;
  /** Public path to the GLB model. */
  model: string;
}

export const MASCOTS: Mascot[] = [
  {
    id: 'wizard',
    name: 'Sage',
    role: 'Money Wizard',
    persona: 'balanced',
    personaLabel: 'Balanced strategist',
    tagline: 'Believes in a little of everything — spreads coins evenly across all three buckets.',
    emoji: '🧙',
    model: '/models/moneytree/low-poly-wizard.glb',
  },
  {
    id: 'robot',
    name: 'Bit',
    role: 'Money Robot',
    persona: 'cautious',
    personaLabel: 'Ultra-safe analyst',
    tagline: 'Hates surprises — keeps almost everything in Safe Seed.',
    emoji: '🤖',
    model: '/models/moneytree/cute-mechanical-robot.glb',
  },
  {
    id: 'adventurer',
    name: 'Robin',
    role: 'Coin Explorer',
    persona: 'bold',
    personaLabel: 'Bold risk-taker',
    tagline: 'Chases big wins in Moonshot — but never bets it all.',
    emoji: '🧭',
    model: '/models/moneytree/cute-chibi-adventurer.glb',
  },
  {
    id: 'hero',
    name: 'Nova',
    role: 'Future Investor',
    persona: 'calm',
    personaLabel: 'Mellow & patient',
    tagline: 'Plays the long game — slow, steady, never in a rush.',
    emoji: '🦸',
    model: '/models/moneytree/cyberpunk-player.glb',
  },
];

/** The tree model used for the 3D stage. */
export const TREE_MODEL = '/models/moneytree/pixel-tree-broad-deciduous-3d.glb';

export function mascotById(id: MascotId): Mascot {
  return MASCOTS.find((m) => m.id === id) ?? MASCOTS[0];
}
