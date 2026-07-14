import { describe, it, expect } from 'vitest';
import { EVENTS } from './content';
import { calmYearInsight, yearInsight } from './insights';
import type { Portfolio, TurnResult } from './types';

const RETURNS = { safe: 0.03, growth: 0.07, moonshot: -0.15 };

function fakeResult(over: Partial<TurnResult> = {}): TurnResult {
  const before: Portfolio = { safe: 100, growth: 100, moonshot: 100 };
  return {
    year: 1,
    before,
    after: before,
    contribution: 0,
    allocationWeights: { safe: 0.34, growth: 0.33, moonshot: 0.33 },
    returns: RETURNS,
    event: null,
    total: 300,
    stage: 'seed',
    bankrupt: false,
    ...over,
  };
}

describe('calmYearInsight', () => {
  it('never returns empty explanation text, across many years and return shapes', () => {
    const variants: Array<Record<'safe' | 'growth' | 'moonshot', number>> = [
      { safe: 0.03, growth: 0.07, moonshot: -0.15 },
      { safe: 0.02, growth: -0.1, moonshot: 1.5 },
      { safe: 0.04, growth: 0.2, moonshot: 0 },
      { safe: 0, growth: 0, moonshot: 0 },
    ];
    for (let year = 0; year < 20; year++) {
      for (const returns of variants) {
        const insight = calmYearInsight(returns, year);
        expect(insight.whatHappened.length).toBeGreaterThan(10);
        expect(insight.smartMove.length).toBeGreaterThan(10);
        expect(insight.title.length).toBeGreaterThan(0);
        expect(insight.emoji.length).toBeGreaterThan(0);
      }
    }
  });

  it('is deterministic for the same year and returns', () => {
    const a = calmYearInsight(RETURNS, 4);
    const b = calmYearInsight(RETURNS, 4);
    expect(a).toEqual(b);
  });

  it('rotates through more than one template across years', () => {
    const titles = new Set(Array.from({ length: 10 }, (_, y) => calmYearInsight(RETURNS, y).title));
    expect(titles.size).toBeGreaterThan(1);
  });

  it('handles negative year numbers without crashing (defensive)', () => {
    expect(() => calmYearInsight(RETURNS, -3)).not.toThrow();
  });
});

describe('yearInsight', () => {
  it('uses the event copy when an event struck', () => {
    const recession = EVENTS.find((e) => e.id === 'recession')!;
    const result = fakeResult({ event: recession });
    const insight = yearInsight(result);
    expect(insight.whatHappened).toBe(recession.copy.whatHappened);
    expect(insight.smartMove).toBe(recession.copy.smartMove);
    expect(insight.tone).toBe(recession.tone);
  });

  it('falls back to a calm-year explanation when there is no event', () => {
    const result = fakeResult({ event: null, year: 2 });
    const insight = yearInsight(result);
    expect(insight).toEqual(calmYearInsight(result.returns, 2));
    expect(insight.whatHappened.length).toBeGreaterThan(0);
    expect(insight.smartMove.length).toBeGreaterThan(0);
  });
});
