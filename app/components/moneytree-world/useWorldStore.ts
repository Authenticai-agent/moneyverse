'use client';

/**
 * useWorldStore - Zustand store for the walkable Money Tree world.
 *
 * Phase 0: just enough shape for Player/FollowCamera/World to compile
 * against and share state without prop-drilling through the Canvas tree.
 * Expanded in later phases: `activeStation` backs Phase 4's diegetic
 * interact-prompt system (garden plots, the bell, the dock), `mood` backs
 * Phase 3's tree/sky/grass/butterfly reactions to the last `TurnResult`.
 */

import { create } from 'zustand';

export type WorldMood = 'neutral' | 'good' | 'bad';

interface WorldState {
  /** Player's current world-space position, updated every frame by Player. */
  playerPosition: [number, number, number];
  setPlayerPosition: (position: [number, number, number]) => void;

  /** Id of the station the player is currently in range of, or null. */
  activeStation: string | null;
  setActiveStation: (id: string | null) => void;

  /** Derived from the last resolved TurnResult - drives ambience, not logic. */
  mood: WorldMood;
  setMood: (mood: WorldMood) => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  playerPosition: [0, 0, 0],
  setPlayerPosition: (position) => set({ playerPosition: position }),

  activeStation: null,
  setActiveStation: (id) => set({ activeStation: id }),

  mood: 'neutral',
  setMood: (mood) => set({ mood }),
}));
