/**
 * Money Tree - end-of-game summary (pure)
 * ---------------------------------------
 * Grades a finished game: final score, which Money Cards were unlocked, and
 * which badges were earned. Kept pure and separate from the React hook so it is
 * easy to test headlessly.
 *
 * Selling shares mid-game moves money OUT of the tree into cash - it doesn't
 * vanish, so a player's true outcome is treeValue + cashOut ("combined
 * wealth"), not the tree alone. Score, stage, and bankruptcy are all judged on
 * combined wealth, so cashing out on purpose is never mistaken for going
 * bankrupt.
 */

import { contributionForYear, normalizeAllocation, replayWithoutWithdrawals, stageOf, totalOf } from './engine';
import { BANKRUPT_THRESHOLD } from './content';
import type { Allocation, GameConfig, Stage, TurnResult, Withdrawal } from './types';

export interface GameSummary {
  /** Combined wealth: still-invested tree value + cash already taken out. The headline number. */
  total: number;
  score: number;
  stage: Stage;
  bankrupt: boolean;
  /** Value still sitting in the tree (what the in-game HUD shows). */
  treeValue: number;
  /** Total dollars cashed out during the game (no longer invested). */
  cashOut: number;
  /** What the tree would be worth today if nothing had ever been sold. */
  shadowTotal: number;
  /** True if the player sold anything at all this game. */
  soldAnything: boolean;
  withdrawals: Withdrawal[];
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
 * @param withdrawals every sale the player made during the game, in order
 */
export function summarizeGame(
  config: GameConfig,
  results: TurnResult[],
  allocations: Allocation[],
  withdrawals: Withdrawal[] = []
): GameSummary {
  const last = results[results.length - 1];
  const treeValue = last ? last.total : Math.max(0, config.startAmount);
  const cashOut = withdrawals.reduce((s, w) => s + w.proceeds, 0);
  const total = treeValue + cashOut;
  const stage = stageOf(total);
  const bankrupt = total <= BANKRUPT_THRESHOLD;
  const shadowTotal = results.length ? replayWithoutWithdrawals(results) : treeValue;

  let contributed = Math.max(0, config.startAmount);
  for (let year = 1; year <= results.length; year++) {
    contributed += contributionForYear(config, year);
  }

  const sawRecession = results.some((r) => r.event?.id === 'recession');
  const minTotal = results.length ? Math.min(...results.map((r) => r.total)) : treeValue;
  const sawDownYear = results.some((r) => r.total < totalOf(r.before) + r.contribution);
  const usedMoonshot = allocations.some((a) => a.moonshot > 0);
  const finalHasAllBuckets = !!last && last.after.safe > 0 && last.after.growth > 0 && last.after.moonshot > 0;

  const unlockedCardIds: string[] = [];
  if (results.length >= 8) unlockedCardIds.push('compounding');
  if (finalHasAllBuckets) unlockedCardIds.push('diversify');
  if (usedMoonshot) unlockedCardIds.push('risk-reward');
  if (sawRecession && !bankrupt) unlockedCardIds.push('bear-bull');
  if (config.frequency === 'weekly' || config.frequency === 'monthly') unlockedCardIds.push('consistency');
  if (withdrawals.length > 0) unlockedCardIds.push('opportunity-cost');

  const earnedBadgeIds: string[] = [];
  if (total >= 20000) earnedBadgeIds.push('first-forest');
  if (allocations.length > 0 && allocations.every((a) => maxShare(a) <= 0.5 + 1e-9)) {
    earnedBadgeIds.push('diversified');
  }
  if (minTotal < 500 && total > 5000) earnedBadgeIds.push('comeback-kid');
  if (sawRecession && !bankrupt && total > contributed) earnedBadgeIds.push('steady-hand');
  if (sawDownYear && !bankrupt && withdrawals.length === 0 && total > contributed) earnedBadgeIds.push('diamond-hands');

  return {
    total,
    score: Math.round(total),
    stage,
    bankrupt,
    treeValue,
    cashOut,
    shadowTotal,
    soldAnything: withdrawals.length > 0,
    withdrawals,
    contributed,
    unlockedCardIds,
    earnedBadgeIds,
  };
}
