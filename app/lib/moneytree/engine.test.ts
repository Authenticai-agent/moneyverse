import { describe, it, expect } from 'vitest';
import {
  applyTurn,
  coinsForYear,
  contributionForYear,
  emptyPortfolio,
  normalizeAllocation,
  resolveTurn,
  rollBucketReturn,
  stageOf,
  totalOf,
} from './engine';
import { EVENTS } from './content';
import { createRng } from './rng';
import type { Allocation, GameConfig, MarketEvent, Portfolio } from './types';

const noReturns = { safe: 0, growth: 0, moonshot: 0 };
const ALL_SAFE: Allocation = { safe: 1, growth: 0, moonshot: 0 };
const ALL_MOON: Allocation = { safe: 0, growth: 0, moonshot: 1 };
const event = (id: string): MarketEvent => {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) throw new Error(`no event ${id}`);
  return e;
};

const baseConfig: GameConfig = {
  startAmount: 100,
  contributionAmount: 10,
  frequency: 'yearly',
  years: 12,
  mascot: 'penny',
  seed: 1,
};

describe('stageOf', () => {
  it('maps totals to stages at the right thresholds', () => {
    expect(stageOf(0)).toBe('seed');
    expect(stageOf(999)).toBe('seed');
    expect(stageOf(1000)).toBe('sapling');
    expect(stageOf(4999)).toBe('sapling');
    expect(stageOf(5000)).toBe('tree');
    expect(stageOf(19999)).toBe('tree');
    expect(stageOf(20000)).toBe('forest');
    expect(stageOf(1_000_000)).toBe('forest');
  });
});

describe('contributions', () => {
  it('aggregates each frequency to a yearly amount', () => {
    expect(contributionForYear({ ...baseConfig, frequency: 'weekly', contributionAmount: 10 }, 3)).toBe(520);
    expect(contributionForYear({ ...baseConfig, frequency: 'monthly', contributionAmount: 10 }, 3)).toBe(120);
    expect(contributionForYear({ ...baseConfig, frequency: 'yearly', contributionAmount: 10 }, 3)).toBe(10);
  });

  it('applies a one-time lump sum only in year 1', () => {
    const cfg: GameConfig = { ...baseConfig, frequency: 'once', contributionAmount: 500 };
    expect(contributionForYear(cfg, 1)).toBe(500);
    expect(contributionForYear(cfg, 2)).toBe(0);
    expect(contributionForYear(cfg, 12)).toBe(0);
  });

  it('coinsForYear includes the starting amount only in year 1', () => {
    expect(coinsForYear(baseConfig, 1)).toBe(110); // 100 start + 10 yearly
    expect(coinsForYear(baseConfig, 2)).toBe(10);
  });
});

describe('normalizeAllocation', () => {
  it('normalises weights to sum to 1', () => {
    const w = normalizeAllocation({ safe: 1, growth: 1, moonshot: 2 });
    expect(w.safe + w.growth + w.moonshot).toBeCloseTo(1);
    expect(w.moonshot).toBeCloseTo(0.5);
  });

  it('defaults to all-safe when nothing is allocated', () => {
    expect(normalizeAllocation({ safe: 0, growth: 0, moonshot: 0 })).toEqual({ safe: 1, growth: 0, moonshot: 0 });
  });

  it('clamps negative weights to zero', () => {
    const w = normalizeAllocation({ safe: -5, growth: 1, moonshot: 0 });
    expect(w).toEqual({ safe: 0, growth: 1, moonshot: 0 });
  });
});

describe('rollBucketReturn bounds', () => {
  it('safe stays within [0.02, 0.04] and never negative', () => {
    const rng = createRng(11);
    for (let i = 0; i < 2000; i++) {
      const r = rollBucketReturn('safe', rng);
      expect(r).toBeGreaterThanOrEqual(0.02);
      expect(r).toBeLessThanOrEqual(0.04);
    }
  });

  it('growth stays within [-0.10, 0.20]', () => {
    const rng = createRng(22);
    for (let i = 0; i < 2000; i++) {
      const r = rollBucketReturn('growth', rng);
      expect(r).toBeGreaterThanOrEqual(-0.1);
      expect(r).toBeLessThanOrEqual(0.2);
    }
  });

  it('moonshot stays within [-1, 1.5] and can totally wipe', () => {
    const rng = createRng(33);
    let sawWipe = false;
    for (let i = 0; i < 5000; i++) {
      const r = rollBucketReturn('moonshot', rng);
      expect(r).toBeGreaterThanOrEqual(-1);
      expect(r).toBeLessThanOrEqual(1.5);
      if (r === -1) sawWipe = true;
    }
    expect(sawWipe).toBe(true); // ~4% chance per roll → certain over 5000
  });
});

describe('applyTurn — money math', () => {
  it('grows a single bucket by its return', () => {
    const before: Portfolio = { safe: 100, growth: 0, moonshot: 0 };
    const res = applyTurn(before, ALL_SAFE, 0, 1, { ...noReturns, safe: 0.03 }, null);
    expect(res.after.safe).toBeCloseTo(103);
    expect(res.total).toBeCloseTo(103);
  });

  it('places the deposit before applying returns', () => {
    const res = applyTurn(emptyPortfolio(), ALL_SAFE, 100, 1, { ...noReturns, safe: 0.03 }, null);
    expect(res.after.safe).toBeCloseTo(103); // (0 + 100) * 1.03
    expect(res.contribution).toBe(100);
  });

  it('compounds deterministically over many years (v = (v+dep)*1.03)', () => {
    let port = emptyPortfolio();
    let ref = 0;
    for (let year = 1; year <= 10; year++) {
      port = applyTurn(port, ALL_SAFE, 50, year, { ...noReturns, safe: 0.03 }, null).after;
      ref = (ref + 50) * 1.03;
    }
    expect(port.safe).toBeCloseTo(ref, 6);
    expect(port.safe).toBeGreaterThan(500); // 10 * 50 contributed, plus growth
  });

  it('applies event return deltas on top of the raw return', () => {
    const before: Portfolio = { safe: 0, growth: 100, moonshot: 0 };
    // raw growth 0.05, recession delta -0.12 => effective -0.07
    const res = applyTurn(before, { safe: 0, growth: 1, moonshot: 0 }, 0, 5, { ...noReturns, growth: 0.05 }, event('recession'));
    expect(res.returns.growth).toBeCloseTo(-0.07);
    expect(res.after.growth).toBeCloseTo(93);
  });

  it('applies a scam as a bucket multiplier on Moonshot holdings', () => {
    const before: Portfolio = { safe: 0, growth: 0, moonshot: 100 };
    // scam has no return delta; moonshot raw 0 => holdings * 0.6
    const res = applyTurn(before, ALL_MOON, 0, 4, noReturns, event('scam'));
    expect(res.after.moonshot).toBeCloseTo(60);
  });

  it('adds a windfall to safe and drains an expense from safe first', () => {
    const win = applyTurn({ safe: 100, growth: 0, moonshot: 0 }, ALL_SAFE, 0, 1, noReturns, event('windfall'));
    expect(win.after.safe).toBeCloseTo(100 * 1.0 + 150); // safe return 0 here + windfall

    const exp = applyTurn({ safe: 50, growth: 200, moonshot: 0 }, ALL_SAFE, 0, 1, noReturns, event('expense'));
    // expense -120: drains 50 from safe, then 70 from growth
    expect(exp.after.safe).toBeCloseTo(0);
    expect(exp.after.growth).toBeCloseTo(130);
  });

  it('goes bankrupt when an all-in Moonshot bet is wiped out', () => {
    const before: Portfolio = { safe: 0, growth: 0, moonshot: 500 };
    const res = applyTurn(before, ALL_MOON, 0, 6, { ...noReturns, moonshot: -1 }, null);
    expect(res.total).toBeLessThanOrEqual(1);
    expect(res.bankrupt).toBe(true);
  });

  it('never lets a bucket go negative', () => {
    const res = applyTurn({ safe: 100, growth: 0, moonshot: 0 }, ALL_SAFE, 0, 1, { ...noReturns, safe: -2 }, null);
    expect(res.after.safe).toBe(0);
    expect(res.total).toBe(0);
  });
});

describe('resolveTurn — randomness & determinism', () => {
  it('is identical for the same seed', () => {
    const a = resolveTurn(emptyPortfolio(), ALL_SAFE, 110, 1, createRng(777));
    const b = resolveTurn(emptyPortfolio(), ALL_SAFE, 110, 1, createRng(777));
    expect(a).toEqual(b);
  });

  it('only ever attaches a known event or null', () => {
    const ids = new Set(EVENTS.map((e) => e.id));
    const rng = createRng(999);
    let port = emptyPortfolio();
    for (let year = 1; year <= 200; year++) {
      const res = resolveTurn(port, { safe: 1, growth: 1, moonshot: 1 }, 100, year, rng);
      if (res.event) expect(ids.has(res.event.id)).toBe(true);
      port = res.after;
    }
  });

  it('plays a full patient all-safe game that grows and survives', () => {
    const rng = createRng(2024);
    let port = emptyPortfolio();
    for (let year = 1; year <= baseConfig.years; year++) {
      const deposit = coinsForYear(baseConfig, year);
      const res = resolveTurn(port, ALL_SAFE, deposit, year, rng);
      port = res.after;
      expect(Number.isFinite(res.total)).toBe(true);
    }
    const contributed = baseConfig.startAmount + baseConfig.contributionAmount * baseConfig.years;
    expect(totalOf(port)).toBeGreaterThan(contributed); // compounding beat plain saving
  });
});
