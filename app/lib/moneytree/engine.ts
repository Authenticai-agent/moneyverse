/**
 * Money Tree - core engine (pure)
 * -------------------------------
 * Turn resolution and the supporting math. No React, no randomness of its own:
 * all randomness comes from an injected `Rng`, so every function is
 * deterministic and unit-testable.
 */

import {
  BANKRUPT_THRESHOLD,
  BUCKET_PROFILES,
  EVENTS,
  EVENT_CHANCE,
  STAGE_THRESHOLDS,
} from './content';
import type { Rng } from './rng';
import {
  BUCKETS,
  type Allocation,
  type Bucket,
  type GameConfig,
  type MarketEvent,
  type Portfolio,
  type Stage,
  type TurnResult,
} from './types';

/** A portfolio with nothing in any bucket. */
export function emptyPortfolio(): Portfolio {
  return { safe: 0, growth: 0, moonshot: 0 };
}

/** Sum the value across all buckets. */
export function totalOf(p: Portfolio): number {
  return p.safe + p.growth + p.moonshot;
}

/** The growth stage for a given total value. */
export function stageOf(total: number): Stage {
  let stage: Stage = 'seed';
  for (const t of STAGE_THRESHOLDS) {
    if (total >= t.min) stage = t.stage;
  }
  return stage;
}

/** Dollars contributed in a given (1-based) year, from the chosen frequency. */
export function contributionForYear(config: GameConfig, year: number): number {
  const amt = Math.max(0, config.contributionAmount);
  switch (config.frequency) {
    case 'weekly':
      return amt * 52;
    case 'monthly':
      return amt * 12;
    case 'yearly':
      return amt;
    case 'once':
      return year === 1 ? amt : 0;
  }
}

/** Total coins the player places in a given year (start money lands in year 1). */
export function coinsForYear(config: GameConfig, year: number): number {
  const start = year === 1 ? Math.max(0, config.startAmount) : 0;
  return start + contributionForYear(config, year);
}

/** Normalise an allocation into weights that sum to 1 (defaults to all-safe). */
export function normalizeAllocation(a: Allocation): Record<Bucket, number> {
  const safe = Math.max(0, a.safe);
  const growth = Math.max(0, a.growth);
  const moonshot = Math.max(0, a.moonshot);
  const sum = safe + growth + moonshot;
  if (sum <= 0) return { safe: 1, growth: 0, moonshot: 0 };
  return { safe: safe / sum, growth: growth / sum, moonshot: moonshot / sum };
}

/** Roll a single bucket's market return for the year (fraction, e.g. 0.07). */
export function rollBucketReturn(bucket: Bucket, rng: Rng): number {
  const p = BUCKET_PROFILES[bucket];
  const base = rng.range(p.minReturn, p.maxReturn);
  if (p.wipeChance > 0 && rng.chance(p.wipeChance)) return -1; // total wipe
  return base;
}

/** Maybe draw an economic event for the year (weighted), else null. */
export function drawEvent(rng: Rng): MarketEvent | null {
  if (!rng.chance(EVENT_CHANCE)) return null;
  const totalWeight = EVENTS.reduce((s, e) => s + e.weight, 0);
  let r = rng.range(0, totalWeight);
  for (const e of EVENTS) {
    if (r < e.weight) return e;
    r -= e.weight;
  }
  return EVENTS[EVENTS.length - 1];
}

/** Apply a flat dollar change: gains land in safe; losses drain safe→growth→moonshot. */
export function applyCashDelta(p: Portfolio, delta: number): void {
  if (delta >= 0) {
    p.safe += delta;
    return;
  }
  let need = -delta;
  for (const b of BUCKETS) {
    const take = Math.min(p[b], need);
    p[b] -= take;
    need -= take;
    if (need <= 0) break;
  }
}

/** Roll the raw (pre-event) market return for every bucket. */
export function rollReturns(rng: Rng): Record<Bucket, number> {
  return {
    safe: rollBucketReturn('safe', rng),
    growth: rollBucketReturn('growth', rng),
    moonshot: rollBucketReturn('moonshot', rng),
  };
}

/**
 * Deterministic core of a turn: given the raw market returns and event already
 * decided, produce the turn result. Split out from `resolveTurn` so the money
 * math can be unit-tested with exact inputs (no RNG).
 *
 * Order of operations:
 *  1. place this year's `deposit` across buckets by allocation weight
 *  2. apply each bucket's return (raw return + any event return delta)
 *  3. apply event bucket multipliers (e.g. a scam draining Moonshot)
 *  4. apply event cash delta (windfall / surprise expense)
 */
export function applyTurn(
  before: Portfolio,
  allocation: Allocation,
  deposit: number,
  year: number,
  rawReturns: Record<Bucket, number>,
  event: MarketEvent | null
): TurnResult {
  const weights = normalizeAllocation(allocation);
  const after: Portfolio = { ...before };

  // 1. place the deposit
  const dep = Math.max(0, deposit);
  for (const b of BUCKETS) after[b] += dep * weights[b];

  // 2. returns: an override wins over the roll+delta, so the displayed return
  //    always reflects the event (e.g. a scam forcing Moonshot down).
  const returns = { safe: 0, growth: 0, moonshot: 0 } as Record<Bucket, number>;
  for (const b of BUCKETS) {
    const override = event?.effects.returnOverrides?.[b];
    const r = override != null ? override : rawReturns[b] + (event?.effects.returnDeltas?.[b] ?? 0);
    returns[b] = r;
    after[b] = after[b] * (1 + r);
  }

  // 3. cash delta (windfall / surprise expense)
  if (event?.effects.cashDelta) applyCashDelta(after, event.effects.cashDelta);

  // clamp and finish
  for (const b of BUCKETS) after[b] = Math.max(0, after[b]);
  const total = totalOf(after);

  return {
    year,
    before,
    after,
    contribution: dep,
    allocationWeights: weights,
    returns,
    event,
    total,
    stage: stageOf(total),
    bankrupt: total <= BANKRUPT_THRESHOLD,
  };
}

/**
 * Resolve one yearly turn with randomness.
 * Draws the event first, then rolls returns, then applies them - a fixed order
 * so a given seed always produces the same game.
 */
export function resolveTurn(
  before: Portfolio,
  allocation: Allocation,
  deposit: number,
  year: number,
  rng: Rng
): TurnResult {
  const event = drawEvent(rng);
  const rawReturns = rollReturns(rng);
  return applyTurn(before, allocation, deposit, year, rawReturns, event);
}

/**
 * Cash out a fraction of one bucket. Proceeds leave the portfolio entirely -
 * they become plain cash the player holds, no longer invested and no longer
 * growing. Fraction is clamped to [0, 1]; selling from an empty bucket is a
 * no-op with zero proceeds.
 */
export function sellFromBucket(
  portfolio: Portfolio,
  bucket: Bucket,
  fraction: number
): { portfolio: Portfolio; proceeds: number } {
  const f = Math.min(1, Math.max(0, fraction));
  const proceeds = portfolio[bucket] * f;
  return { portfolio: { ...portfolio, [bucket]: portfolio[bucket] - proceeds }, proceeds };
}

/**
 * The honest counterfactual: what the tree would be worth today if the player
 * had never cashed anything out. Replays the SAME sequence of contributions,
 * allocation choices, market returns, and events recorded in `results` - the
 * only thing that changes is that nothing is ever withdrawn along the way, so
 * every dollar keeps compounding. Used to show the true cost of selling early.
 */
export function replayWithoutWithdrawals(results: TurnResult[]): number {
  let shadow = emptyPortfolio();
  for (const r of results) {
    for (const b of BUCKETS) shadow[b] += r.contribution * r.allocationWeights[b];
    for (const b of BUCKETS) shadow[b] = shadow[b] * (1 + r.returns[b]);
    if (r.event?.effects.cashDelta) applyCashDelta(shadow, r.event.effects.cashDelta);
    for (const b of BUCKETS) shadow[b] = Math.max(0, shadow[b]);
  }
  return totalOf(shadow);
}
