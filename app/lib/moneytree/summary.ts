/**
 * Money Tree — end-of-game summary (pure)
 * ---------------------------------------
 * Grades a finished game: final score, which Money Cards were unlocked, and
 * which badges were earned. Kept pure and separate from the React hook so it is
 * easy to test headlessly.
 */

import { contributionForYear, normalizeAllocation } from './engine';
import type { Allocation, GameConfig, Stage, TurnResult } from './types';

export interface GameSummary {
  score: number;
  total: number;
  stage: Stage;
  bankrupt: boolean;
  /** Total dollars the player put in (start + all contributions actually made). */
  contributed: number;
  unlockedCardIds: string[];
  earnedBadgeIds: string[];
}

/** Largest single-bucket share of an allocation, after normalising (0..1). */
function maxShare(a: Allocation): number {
  const w = normalizeAllocation(a);
  return Math.max(w.safe, w.growth, w.moonshot);
}

/**
 * Grade a completed game.
 * @param results     the TurnResult for each year played, in order
 * @param allocations the allocation the player used each year, in order
 */
export function summarizeGame(
  config: GameConfig,
  results: TurnResult[],
  allocations: Allocation[]
): GameSummary {
  const last = results[results.length - 1];
  const total = last ? last.total : Math.max(0, config.startAmount);
  const stage = last ? last.stage : 'seed';
  const bankrupt = last ? last.bankrupt : false;

  let contributed = Math.max(0, config.startAmount);
  for (let year = 1; year <= results.length; year++) {
    contributed += contributionForYear(config, year);
  }

  const sawRecession = results.some((r) => r.event?.id === 'recession');
  const minTotal = results.length ? Math.min(...results.map((r) => r.total)) : total;
  const usedMoonshot = allocations.some((a) => a.moonshot > 0);
  const finalHasAllBuckets = !!last && last.after.safe > 0 && last.after.growth > 0 && last.after.moonshot > 0;

  const unlockedCardIds: string[] = [];
  if (results.length >= 8) unlockedCardIds.push('compounding');
  if (finalHasAllBuckets) unlockedCardIds.push('diversify');
  if (usedMoonshot) unlockedCardIds.push('risk-reward');
  if (sawRecession && !bankrupt) unlockedCardIds.push('bear-bull');
  if (config.frequency === 'weekly' || config.frequency === 'monthly') unlockedCardIds.push('consistency');

  const earnedBadgeIds: string[] = [];
  if (total >= 20000) earnedBadgeIds.push('first-forest');
  if (allocations.length > 0 && allocations.every((a) => maxShare(a) <= 0.5 + 1e-9)) {
    earnedBadgeIds.push('diversified');
  }
  if (minTotal < 500 && total > 5000) earnedBadgeIds.push('comeback-kid');
  if (sawRecession && !bankrupt && total > contributed) earnedBadgeIds.push('steady-hand');

  return {
    score: Math.round(total),
    total,
    stage,
    bankrupt,
    contributed,
    unlockedCardIds,
    earnedBadgeIds,
  };
}
