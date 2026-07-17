import { describe, it, expect } from 'vitest';
import {
  applyTurn,
  coinsForYear,
  contributionForYear,
  emptyPortfolio,
  normalizeAllocation,
  replayWithoutWithdrawals,
  resolveTurn,
  rollBucketReturn,
  rollReturns,
  sellFromBucket,
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
  mascot: 'wizard',
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

describe('applyTurn - money math', () => {
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

  it('a recession keeps Moonshot in the red even when the market rolled way up', () => {
    const before: Portfolio = { safe: 0, growth: 0, moonshot: 100 };
    // market rolled +150%, delta -35% would still net +115% — the cap must win
    const res = applyTurn(before, ALL_MOON, 0, 7, { ...noReturns, moonshot: 1.5 }, event('recession'));
    expect(res.returns.moonshot).toBeLessThan(0);
    expect(res.returns.moonshot).toBeCloseTo(-0.05); // capped
    expect(res.after.moonshot).toBeLessThan(100);
  });

  it('a recession never lets Growth or Moonshot post a gain, whatever the roll', () => {
    const rng = createRng(4242);
    for (let i = 0; i < 500; i++) {
      const res = applyTurn(
        { safe: 0, growth: 100, moonshot: 100 },
        { safe: 0, growth: 1, moonshot: 1 },
        0,
        1,
        rollReturns(rng),
        event('recession')
      );
      expect(res.returns.growth).toBeLessThanOrEqual(-0.02);
      expect(res.returns.moonshot).toBeLessThanOrEqual(-0.05);
    }
  });

  it('a boom never lets Growth or Moonshot post a loss, whatever the roll', () => {
    const rng = createRng(2424);
    for (let i = 0; i < 500; i++) {
      const res = applyTurn(
        { safe: 0, growth: 100, moonshot: 100 },
        { safe: 0, growth: 1, moonshot: 1 },
        0,
        1,
        rollReturns(rng),
        event('boom')
      );
      expect(res.returns.growth).toBeGreaterThanOrEqual(0.02);
      expect(res.returns.moonshot).toBeGreaterThanOrEqual(0.05);
    }
  });

  it('a scam forces Moonshot to a loss even when the market rolled way up', () => {
    const before: Portfolio = { safe: 0, growth: 0, moonshot: 100 };
    // market rolled +140%, but the scam override must win → -50% shown & applied
    const res = applyTurn(before, ALL_MOON, 0, 4, { ...noReturns, moonshot: 1.4 }, event('scam'));
    expect(res.returns.moonshot).toBeCloseTo(-0.5);
    expect(res.after.moonshot).toBeCloseTo(50);
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

describe('resolveTurn - randomness & determinism', () => {
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

describe('sellFromBucket', () => {
  it('moves the sold fraction out of the bucket and returns matching proceeds', () => {
    const portfolio: Portfolio = { safe: 200, growth: 300, moonshot: 100 };
    const { portfolio: after, proceeds } = sellFromBucket(portfolio, 'growth', 0.5);
    expect(proceeds).toBeCloseTo(150);
    expect(after.growth).toBeCloseTo(150);
    expect(after.safe).toBe(200); // other buckets untouched
    expect(after.moonshot).toBe(100);
  });

  it('selling 100% empties the bucket', () => {
    const portfolio: Portfolio = { safe: 0, growth: 0, moonshot: 400 };
    const { portfolio: after, proceeds } = sellFromBucket(portfolio, 'moonshot', 1);
    expect(after.moonshot).toBeCloseTo(0);
    expect(proceeds).toBeCloseTo(400);
  });

  it('clamps fractions outside [0, 1]', () => {
    const portfolio: Portfolio = { safe: 100, growth: 0, moonshot: 0 };
    expect(sellFromBucket(portfolio, 'safe', 1.5).proceeds).toBeCloseTo(100);
    expect(sellFromBucket(portfolio, 'safe', -1).proceeds).toBeCloseTo(0);
  });

  it('selling from an empty bucket is a harmless no-op', () => {
    const portfolio: Portfolio = { safe: 0, growth: 50, moonshot: 0 };
    const { portfolio: after, proceeds } = sellFromBucket(portfolio, 'safe', 1);
    expect(proceeds).toBe(0);
    expect(after).toEqual(portfolio);
  });

  it('does not mutate the input portfolio', () => {
    const portfolio: Portfolio = { safe: 100, growth: 0, moonshot: 0 };
    sellFromBucket(portfolio, 'safe', 0.5);
    expect(portfolio.safe).toBe(100);
  });
});

describe('replayWithoutWithdrawals', () => {
  it('matches the real total when nothing was ever sold', () => {
    const rng = createRng(55);
    let port = emptyPortfolio();
    const results = [];
    for (let year = 1; year <= 6; year++) {
      const res = resolveTurn(port, { safe: 1, growth: 1, moonshot: 1 }, 100, year, rng);
      results.push(res);
      port = res.after; // no selling - real trajectory == shadow trajectory
    }
    expect(replayWithoutWithdrawals(results)).toBeCloseTo(totalOf(port), 6);
  });

  it('is higher than the real total once money has been sold and stopped compounding', () => {
    const rng = createRng(77);
    let port = emptyPortfolio();
    const results = [];
    for (let year = 1; year <= 8; year++) {
      const res = resolveTurn(port, { safe: 1, growth: 1, moonshot: 1 }, 100, year, rng);
      results.push(res);
      port = res.after;
      if (year === 3) {
        // cash out everything in growth after year 3 - it stops growing from here on
        const sold = sellFromBucket(port, 'growth', 1);
        port = sold.portfolio;
      }
    }
    const shadow = replayWithoutWithdrawals(results);
    expect(shadow).toBeGreaterThan(totalOf(port));
  });

  it('returns 0 for an empty results list', () => {
    expect(replayWithoutWithdrawals([])).toBe(0);
  });
});
