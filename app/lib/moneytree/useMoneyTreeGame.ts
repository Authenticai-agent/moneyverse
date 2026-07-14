'use client';

/**
 * Money Tree — game state hook
 * ----------------------------
 * Owns the game lifecycle (setup → playing → resolving → report) on top of the
 * pure engine. Authoritative mutable data lives in refs (so callbacks never see
 * stale values); a tick forces re-render. Progress persists to localStorage.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { coinsForYear, emptyPortfolio, resolveTurn } from './engine';
import { createRng, type Rng } from './rng';
import { summarizeGame, type GameSummary } from './summary';
import {
  emptyProgress,
  loadProgress,
  mergeSummary,
  saveProgress,
  type MoneyTreeProgress,
} from './storage';
import type { Allocation, GameConfig, GamePhase, Portfolio, TurnResult } from './types';

/** Even split across all three buckets — a friendly, diversified default. */
export const DEFAULT_ALLOCATION: Allocation = { safe: 1, growth: 1, moonshot: 1 };

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

export interface MoneyTreeGame {
  phase: GamePhase;
  config: GameConfig | null;
  portfolio: Portfolio;
  /** 1-based current year (the one about to be, or just, played). */
  year: number;
  totalYears: number;
  /** Coins the player places this year (start money is folded in for year 1). */
  coinsThisYear: number;
  allocation: Allocation;
  results: TurnResult[];
  lastResult: TurnResult | null;
  summary: GameSummary | null;
  progress: MoneyTreeProgress;
  isNewBest: boolean;
  newCardIds: string[];
  newBadgeIds: string[];

  startGame: (config: GameConfig) => void;
  setAllocation: (allocation: Allocation) => void;
  /** Resolve the current year → moves to `resolving` so the UI can show it. */
  growYear: () => void;
  /** Acknowledge the resolved year → next year, or the report if the game ended. */
  next: () => void;
  /** Start a fresh game with the same setup but a new market. */
  replay: () => void;
  /** Go back to the setup screen. */
  resetToSetup: () => void;
}

export function useMoneyTreeGame(): MoneyTreeGame {
  const configRef = useRef<GameConfig | null>(null);
  const rngRef = useRef<Rng | null>(null);
  const portfolioRef = useRef<Portfolio>(emptyPortfolio());
  const yearRef = useRef(1);
  const phaseRef = useRef<GamePhase>('setup');
  const allocationRef = useRef<Allocation>(DEFAULT_ALLOCATION);
  const resultsRef = useRef<TurnResult[]>([]);
  const allocationsRef = useRef<Allocation[]>([]);
  const lastResultRef = useRef<TurnResult | null>(null);
  const summaryRef = useRef<GameSummary | null>(null);
  const progressRef = useRef<MoneyTreeProgress>(emptyProgress());
  const isNewBestRef = useRef(false);
  const newCardIdsRef = useRef<string[]>([]);
  const newBadgeIdsRef = useRef<string[]>([]);

  const [, setTick] = useState(0);
  const render = useCallback(() => setTick((t) => t + 1), []);

  // Load saved progress once on the client.
  useEffect(() => {
    progressRef.current = loadProgress();
    render();
  }, [render]);

  const begin = useCallback(
    (config: GameConfig) => {
      configRef.current = config;
      rngRef.current = createRng(config.seed >>> 0);
      portfolioRef.current = emptyPortfolio();
      yearRef.current = 1;
      allocationRef.current = DEFAULT_ALLOCATION;
      resultsRef.current = [];
      allocationsRef.current = [];
      lastResultRef.current = null;
      summaryRef.current = null;
      isNewBestRef.current = false;
      newCardIdsRef.current = [];
      newBadgeIdsRef.current = [];
      phaseRef.current = 'playing';
      render();
    },
    [render]
  );

  const startGame = useCallback((config: GameConfig) => begin(config), [begin]);

  const setAllocation = useCallback(
    (allocation: Allocation) => {
      allocationRef.current = allocation;
      render();
    },
    [render]
  );

  const growYear = useCallback(() => {
    const config = configRef.current;
    const rng = rngRef.current;
    if (phaseRef.current !== 'playing' || !config || !rng) return;

    const deposit = coinsForYear(config, yearRef.current);
    const res = resolveTurn(portfolioRef.current, allocationRef.current, deposit, yearRef.current, rng);

    portfolioRef.current = res.after;
    resultsRef.current = [...resultsRef.current, res];
    allocationsRef.current = [...allocationsRef.current, allocationRef.current];
    lastResultRef.current = res;
    phaseRef.current = 'resolving';
    render();
  }, [render]);

  const next = useCallback(() => {
    const config = configRef.current;
    if (phaseRef.current !== 'resolving' || !config) return;

    const gameOver = yearRef.current >= config.years || !!lastResultRef.current?.bankrupt;
    if (gameOver) {
      const summary = summarizeGame(config, resultsRef.current, allocationsRef.current);
      const merged = mergeSummary(progressRef.current, summary);
      saveProgress(merged.progress);
      summaryRef.current = summary;
      progressRef.current = merged.progress;
      isNewBestRef.current = merged.isNewBest;
      newCardIdsRef.current = merged.newCardIds;
      newBadgeIdsRef.current = merged.newBadgeIds;
      phaseRef.current = 'report';
    } else {
      yearRef.current += 1;
      phaseRef.current = 'playing';
    }
    render();
  }, [render]);

  const replay = useCallback(() => {
    const config = configRef.current;
    if (!config) return;
    begin({ ...config, seed: randomSeed() });
  }, [begin]);

  const resetToSetup = useCallback(() => {
    phaseRef.current = 'setup';
    render();
  }, [render]);

  const config = configRef.current;
  return {
    phase: phaseRef.current,
    config,
    portfolio: portfolioRef.current,
    year: yearRef.current,
    totalYears: config?.years ?? 0,
    coinsThisYear: config ? coinsForYear(config, yearRef.current) : 0,
    allocation: allocationRef.current,
    results: resultsRef.current,
    lastResult: lastResultRef.current,
    summary: summaryRef.current,
    progress: progressRef.current,
    isNewBest: isNewBestRef.current,
    newCardIds: newCardIdsRef.current,
    newBadgeIds: newBadgeIdsRef.current,
    startGame,
    setAllocation,
    growYear,
    next,
    replay,
    resetToSetup,
  };
}
