import { describe, it, expect } from 'vitest';
import {
  allocationCoachLine,
  cashOutGreetingLine,
  cashOutSuggestionLine,
  educationalTipLine,
  eventReactionLine,
  introLine,
  playingPhaseLine,
  reportLine,
  sellReactionLine,
  sendOffLine,
} from './coach';
import { MASCOTS } from './mascots';
import type { Portfolio, TurnResult } from './types';

const EVEN = { safe: 0.34, growth: 0.33, moonshot: 0.33 };

function fakeResult(over: Partial<TurnResult> = {}): TurnResult {
  const before: Portfolio = { safe: 100, growth: 100, moonshot: 100 };
  return {
    year: 3,
    before,
    after: before,
    contribution: 0,
    allocationWeights: { safe: 0.34, growth: 0.33, moonshot: 0.33 },
    returns: { safe: 0.03, growth: 0.05, moonshot: 0.1 },
    event: null,
    total: 340,
    stage: 'seed',
    bankrupt: false,
    ...over,
  };
}

describe('introLine', () => {
  it('gives every mascot a non-empty, distinct intro', () => {
    const lines = MASCOTS.map((m) => introLine(m));
    expect(lines.every((l) => l.length > 20)).toBe(true);
    expect(new Set(lines).size).toBe(MASCOTS.length); // all distinct
  });

  it('mentions the mascot name', () => {
    for (const m of MASCOTS) {
      expect(introLine(m)).toContain(m.name);
    }
  });
});

describe('allocationCoachLine - persona risk thresholds', () => {
  it('the bold coach only warns at a much higher Moonshot share than the cautious coach', () => {
    const bold = MASCOTS.find((m) => m.persona === 'bold')!;
    const cautious = MASCOTS.find((m) => m.persona === 'cautious')!;

    const mild = { safe: 0.4, growth: 0.3, moonshot: 0.3 };
    expect(allocationCoachLine(cautious, mild)).not.toBeNull(); // 30% is already too much for cautious
    expect(allocationCoachLine(bold, mild)).toBeNull(); // fine for bold

    const extreme = { safe: 0, growth: 0.1, moonshot: 0.9 };
    expect(allocationCoachLine(bold, extreme)).not.toBeNull(); // even bold draws a line
    expect(allocationCoachLine(cautious, extreme)).not.toBeNull();
  });

  it('returns null for a balanced coach on an even split', () => {
    const balanced = MASCOTS.find((m) => m.persona === 'balanced')!;
    expect(allocationCoachLine(balanced, EVEN)).toBeNull();
  });

  it('the bold coach gently nudges when playing completely safe', () => {
    const bold = MASCOTS.find((m) => m.persona === 'bold')!;
    const allSafe = { safe: 1, growth: 0, moonshot: 0 };
    expect(allocationCoachLine(bold, allSafe)).not.toBeNull();
  });
});

describe('eventReactionLine', () => {
  it('is deterministic for the same mascot, result and year', () => {
    const mascot = MASCOTS[0];
    const result = fakeResult();
    expect(eventReactionLine(mascot, result)).toBe(eventReactionLine(mascot, result));
  });

  it('differs between a good year and a bad year for the same persona', () => {
    const mascot = MASCOTS.find((m) => m.persona === 'cautious')!;
    const good = fakeResult({ total: 500, contribution: 0 }); // total > before(300)+contribution(0)
    const bad = fakeResult({ total: 200, contribution: 0 }); // total < before
    expect(eventReactionLine(mascot, good)).not.toBe(eventReactionLine(mascot, bad));
  });

  it('every mascot returns a non-empty reaction across good/bad/flat outcomes', () => {
    const before: Portfolio = { safe: 100, growth: 100, moonshot: 100 };
    const outcomes = [
      fakeResult({ before, total: 400, contribution: 0 }), // good (400 > 300)
      fakeResult({ before, total: 200, contribution: 0 }), // bad (200 < 300)
      fakeResult({ before, total: 300, contribution: 0 }), // flat (300 == 300)
    ];
    for (const mascot of MASCOTS) {
      for (const result of outcomes) {
        expect(eventReactionLine(mascot, result).length).toBeGreaterThan(5);
      }
    }
  });
});

describe('reportLine', () => {
  const opts = { bankrupt: false, years: 10, contributed: 1000, grew: 500, growthPct: 0.5 };

  it('gives every mascot a distinct, non-empty summary for a successful game', () => {
    const lines = MASCOTS.map((m) => reportLine(m, opts));
    expect(lines.every((l) => l.length > 30)).toBe(true);
    expect(new Set(lines).size).toBe(MASCOTS.length);
  });

  it('handles the bankrupt case for every persona without crashing', () => {
    for (const m of MASCOTS) {
      const line = reportLine(m, { ...opts, bankrupt: true, grew: -1000, growthPct: -1 });
      expect(line.length).toBeGreaterThan(20);
    }
  });

  it('handles the "kept everything safe, no growth" case for every persona', () => {
    for (const m of MASCOTS) {
      const line = reportLine(m, { ...opts, grew: 0, growthPct: 0 });
      expect(line.length).toBeGreaterThan(20);
    }
  });

  it('mentions the actual planted and grew dollar amounts in a successful game', () => {
    const sage = MASCOTS.find((m) => m.persona === 'balanced')!;
    const line = reportLine(sage, opts);
    expect(line).toContain('$1,000');
    expect(line).toContain('$500');
  });
});

describe('educationalTipLine', () => {
  it('gives every mascot a non-empty tip for a range of years, deterministically', () => {
    for (const m of MASCOTS) {
      for (let year = 1; year <= 10; year++) {
        const tip = educationalTipLine(m, year);
        expect(tip.length).toBeGreaterThan(20);
        expect(educationalTipLine(m, year)).toBe(tip); // deterministic
      }
    }
  });

  it('varies across years for the same mascot (not one repeated line)', () => {
    const mascot = MASCOTS[0];
    const tips = new Set(Array.from({ length: 5 }, (_, i) => educationalTipLine(mascot, i + 1)));
    expect(tips.size).toBeGreaterThan(1);
  });
});

describe('cashOutSuggestionLine', () => {
  const portfolio: Portfolio = { safe: 100, growth: 500, moonshot: 50 };

  it('mentions the largest bucket by dollar value, not just the first one', () => {
    for (const m of MASCOTS) {
      const line = cashOutSuggestionLine(m, portfolio, 3);
      expect(line).toContain('Growth Tree');
      expect(line).toContain('$500');
    }
  });

  it('produces a non-empty line for every persona', () => {
    for (const m of MASCOTS) {
      expect(cashOutSuggestionLine(m, portfolio, 3).length).toBeGreaterThan(20);
    }
  });
});

describe('playingPhaseLine', () => {
  const portfolio: Portfolio = { safe: 100, growth: 500, moonshot: 50 };

  it('surfaces a cash-out suggestion every 3rd year from year 3', () => {
    const mascot = MASCOTS[0];
    const line = playingPhaseLine(mascot, { year: 3, portfolio });
    expect(line).toBe(cashOutSuggestionLine(mascot, portfolio, 3));
  });

  it('falls back to an educational tip on other years', () => {
    const mascot = MASCOTS[0];
    const line = playingPhaseLine(mascot, { year: 2, portfolio });
    expect(line).toBe(educationalTipLine(mascot, 2));
  });
});

describe('sendOffLine', () => {
  it('gives every mascot a non-empty, deterministic hype line', () => {
    for (const m of MASCOTS) {
      const line = sendOffLine(m, 4);
      expect(line.length).toBeGreaterThan(5);
      expect(sendOffLine(m, 4)).toBe(line);
    }
  });
});

describe('cashOutGreetingLine', () => {
  it('gives every mascot a non-empty greeting', () => {
    for (const m of MASCOTS) {
      expect(cashOutGreetingLine(m, 2).length).toBeGreaterThan(10);
    }
  });
});

describe('sellReactionLine', () => {
  const partial = { bucket: 'growth' as const, amount: 250, soldAll: false, yearsRemaining: 4 };
  const full = { bucket: 'moonshot' as const, amount: 900, soldAll: true, yearsRemaining: 1 };

  it('gives every mascot a distinct, non-empty reaction for a partial sale', () => {
    const lines = MASCOTS.map((m) => sellReactionLine(m, partial));
    expect(lines.every((l) => l.length > 30)).toBe(true);
    expect(new Set(lines).size).toBe(MASCOTS.length);
  });

  it('mentions the dollar amount and bucket name', () => {
    const mascot = MASCOTS[0];
    const line = sellReactionLine(mascot, partial);
    expect(line).toContain('$250');
    expect(line).toContain('Growth Tree');
  });

  it('has a distinct message when the whole bucket was sold vs a partial sale', () => {
    const mascot = MASCOTS.find((m) => m.persona === 'cautious')!;
    const partialLine = sellReactionLine(mascot, { ...partial, bucket: 'moonshot' });
    const fullLine = sellReactionLine(mascot, full);
    expect(partialLine).not.toBe(fullLine);
  });

  it('handles a 1-year vs multi-year remaining horizon without crashing', () => {
    for (const m of MASCOTS) {
      expect(sellReactionLine(m, full).length).toBeGreaterThan(20);
      expect(sellReactionLine(m, { ...partial, yearsRemaining: 10 }).length).toBeGreaterThan(20);
    }
  });
});
