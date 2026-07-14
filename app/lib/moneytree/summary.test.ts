import { describe, it, expect } from 'vitest';
import { applyTurn, coinsForYear, emptyPortfolio, resolveTurn } from './engine';
import { createRng } from './rng';
import { summarizeGame } from './summary';
import type { Allocation, GameConfig, Portfolio, TurnResult } from './types';

const EVEN: Allocation = { safe: 1, growth: 1, moonshot: 1 };
const ALL_MOON: Allocation = { safe: 0, growth: 0, moonshot: 1 };

function baseConfig(over: Partial<GameConfig> = {}): GameConfig {
  return {
    startAmount: 100,
    contributionAmount: 20,
    frequency: 'yearly',
    years: 12,
    mascot: 'penny',
    seed: 4242,
    ...over,
  };
}

/** Play a whole game headlessly with a fixed allocation, mirroring the hook. */
function playHeadless(config: GameConfig, allocation: Allocation) {
  const rng = createRng(config.seed);
  let port: Portfolio = emptyPortfolio();
  const results: TurnResult[] = [];
  const allocations: Allocation[] = [];
  for (let year = 1; year <= config.years; year++) {
    const deposit = coinsForYear(config, year);
    const res = resolveTurn(port, allocation, deposit, year, rng);
    results.push(res);
    allocations.push(allocation);
    port = res.after;
    if (res.bankrupt) break;
  }
  return { results, allocations };
}

describe('summarizeGame — full headless game', () => {
  it('produces a positive score for a completed 12-year game', () => {
    const config = baseConfig();
    const { results, allocations } = playHeadless(config, EVEN);
    const summary = summarizeGame(config, results, allocations);

    expect(results.length).toBe(12);
    expect(summary.score).toBeGreaterThan(0);
    expect(summary.bankrupt).toBe(false);
    expect(summary.total).toBeCloseTo(results[results.length - 1].total);
  });

  it('counts contributed dollars as start + all yearly contributions', () => {
    const config = baseConfig(); // 100 start + 20 * 12
    const { results, allocations } = playHeadless(config, EVEN);
    const summary = summarizeGame(config, results, allocations);
    expect(summary.contributed).toBe(100 + 20 * 12);
  });

  it('awards the Diversified badge for an always-even split', () => {
    const config = baseConfig();
    const { results, allocations } = playHeadless(config, EVEN);
    const summary = summarizeGame(config, results, allocations);
    expect(summary.earnedBadgeIds).toContain('diversified');
  });

  it('unlocks compounding (8+ years) and risk-reward (used Moonshot) cards', () => {
    const config = baseConfig();
    const { results, allocations } = playHeadless(config, EVEN);
    const summary = summarizeGame(config, results, allocations);
    expect(summary.unlockedCardIds).toContain('compounding');
    expect(summary.unlockedCardIds).toContain('risk-reward');
  });

  it('unlocks the consistency card for weekly/monthly savers', () => {
    const config = baseConfig({ frequency: 'weekly', contributionAmount: 5 });
    const { results, allocations } = playHeadless(config, EVEN);
    const summary = summarizeGame(config, results, allocations);
    expect(summary.unlockedCardIds).toContain('consistency');
  });
});

describe('summarizeGame — bankruptcy', () => {
  it('reports bankruptcy and withholds survival rewards', () => {
    const config = baseConfig({ years: 1 });
    const wiped = applyTurn({ safe: 0, growth: 0, moonshot: 500 }, ALL_MOON, 0, 1, { safe: 0, growth: 0, moonshot: -1 }, null);
    const summary = summarizeGame(config, [wiped], [ALL_MOON]);

    expect(summary.bankrupt).toBe(true);
    expect(summary.score).toBe(0);
    expect(summary.unlockedCardIds).not.toContain('bear-bull');
    expect(summary.earnedBadgeIds).toEqual([]);
  });
});
