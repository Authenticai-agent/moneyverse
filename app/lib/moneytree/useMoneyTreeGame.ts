'use client';

/**
 * Money Tree - game state hook
 * ----------------------------
 * Owns the game lifecycle (setup → playing → resolving → report) on top of the
 * pure engine. Authoritative mutable data lives in refs (so callbacks never see
 * stale values); a tick forces re-render. Progress persists to localStorage.
 *
 * Selling: the player can cash out part or all of a bucket during the
 * 'playing' phase. Proceeds move to a separate cash pile that no longer
 * compounds - the tree only knows about what's still invested. Combined
 * wealth (tree + cash) is what "bankrupt" and the final score are judged on,
 * so a deliberate full cash-out is never confused with going broke.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { BANKRUPT_THRESHOLD } from './content';
import { coinsForYear, emptyPortfolio, resolveTurn, sellFromBucket } from './engine';
import { sellReactionLine } from './coach';
import { mascotById } from './mascots';
import { createRng, type Rng } from './rng';
import { summarizeGame, type GameSummary } from './summary';
import {
  emptyProgress,
  loadProgress,
  mergeSummary,
  saveProgress,
  type MoneyTreeProgress,
} from './storage';
import type { Allocation, Bucket, GameConfig, GamePhase, Portfolio, TurnResult, Withdrawal } from './types';

/** Percentages that sum to 100 - a friendly, diversified default. */
export const DEFAULT_ALLOCATION: Allocation = { safe: 34, growth: 33, moonshot: 33 };

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
  /** Total dollars cashed out so far this game (no longer invested). */
  cashOut: number;
  withdrawals: Withdrawal[];
  /** The coach's reaction to the most recent sale, or null once dismissed/superseded. */
  lastSellMessage: string | null;

  startGame: (config: GameConfig) => void;
  setAllocation: (allocation: Allocation) => void;
  /** Cash out a fraction (0..1] of one bucket. Only during the 'playing' phase. */
  sellShares: (bucket: Bucket, fraction: number) => void;
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
  const cashRef = useRef(0);
  const withdrawalsRef = useRef<Withdrawal[]>([]);
  const lastSellMessageRef = useRef<string | null>(null);

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
      cashRef.current = 0;
      withdrawalsRef.current = [];
      lastSellMessageRef.current = null;
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

  const sellShares = useCallback(
    (bucket: Bucket, fraction: number) => {
      const config = configRef.current;
      if (phaseRef.current !== 'playing' || !config) return;

      const { portfolio: after, proceeds } = sellFromBucket(portfolioRef.current, bucket, fraction);
      if (proceeds <= 0) return;

      portfolioRef.current = after;
      cashRef.current += proceeds;
      const soldAll = after[bucket] <= 0.01;
      withdrawalsRef.current = [
        ...withdrawalsRef.current,
        { year: yearRef.current, bucket, fraction: Math.min(1, Math.max(0, fraction)), proceeds },
      ];

      const mascot = mascotById(config.mascot);
      const yearsRemaining = Math.max(1, config.years - yearRef.current + 1);
      lastSellMessageRef.current = sellReactionLine(mascot, { bucket, amount: proceeds, soldAll, yearsRemaining });
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
    lastSellMessageRef.current = null;
    phaseRef.current = 'resolving';
    render();
  }, [render]);

  const next = useCallback(() => {
    const config = configRef.current;
    if (phaseRef.current !== 'resolving' || !config) return;

    // Combined wealth (still-invested tree + cash already taken out) decides
    // whether the player is truly out of the game - a deliberate full
    // cash-out must never be mistaken for going bankrupt.
    const combinedWealth = (lastResultRef.current?.total ?? 0) + cashRef.current;
    const trulyBankrupt = combinedWealth <= BANKRUPT_THRESHOLD;
    const gameOver = yearRef.current >= config.years || trulyBankrupt;

    if (gameOver) {
      const summary = summarizeGame(config, resultsRef.current, allocationsRef.current, withdrawalsRef.current);
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
    cashOut: cashRef.current,
    withdrawals: withdrawalsRef.current,
    lastSellMessage: lastSellMessageRef.current,
    startGame,
    setAllocation,
    sellShares,
    growYear,
    next,
    replay,
    resetToSetup,
  };
}
