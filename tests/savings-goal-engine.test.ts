import { describe, it, expect } from 'vitest';
import {
  MILESTONES,
  WEEKS_PER_MONTH,
  activeBoosts,
  balanceAtWeek,
  buildPlan,
  clampGoal,
  clampMinor,
  displayBalanceAtWeek,
  formatDuration,
  formatMinor,
  formatSignedMinor,
  formatTargetDate,
  formatWeeks,
  milestonesCrossed,
  monthsToGoal,
  neededMinor,
  oneTimeBoostMinor,
  parseDollarsToMinor,
  progressAt,
  recurringWeeklyMinor,
  remainingMinor,
  requiredWeeklyMinor,
  targetDate,
  toggleBoost,
  weeklyBoostMinor,
  weeksToGoal,
} from '@/app/lib/savingsgoal/engine';
import { BOOSTS, BOOST_GROUPS, GOAL_PRESETS } from '@/app/lib/savingsgoal/content';
import type { Boost, Goal } from '@/app/lib/savingsgoal/types';

/** $200 bike, $20 already saved, $10 a week. The canonical worked example. */
const baseGoal: Goal = {
  name: 'A bike',
  targetMinor: 20_000,
  currentMinor: 2_000,
  baseWeeklyMinor: 1_000,
};

/** Look a boost up from real content rather than fabricating one. */
const boost = (id: string): Boost => {
  const b = BOOSTS.find((x) => x.id === id);
  if (!b) throw new Error(`no boost ${id}`);
  return b;
};

const WEEKLY_2 = boost('feed-pets'); // +$2 / week
const WEEKLY_5 = boost('walk-dog'); // +$5 / week
const ONCE_15 = boost('sell-toys'); // +$15 once
const ONCE_20 = boost('birthday-money'); // +$20 once
const WEEKLY_MINUS_3 = boost('save-half'); // -$3 / week
const SPEND_WEEKLY = boost('candy-snacks'); // -$2 / week
const SPEND_ONCE = boost('in-game'); // -$15 once

/** Months corresponding to a whole number of days, for formatDuration edges. */
const monthsForDays = (days: number) => days / 30.44;

describe('clampMinor', () => {
  it('passes whole positive amounts through untouched', () => {
    expect(clampMinor(2_000)).toBe(2_000);
  });

  it('clamps negatives and zero to zero rather than letting them reach the math', () => {
    expect(clampMinor(-1)).toBe(0);
    expect(clampMinor(-99_999)).toBe(0);
    expect(clampMinor(0)).toBe(0);
  });

  it('clamps NaN and Infinity, which an empty or pasted input can produce', () => {
    expect(clampMinor(NaN)).toBe(0);
    expect(clampMinor(Infinity)).toBe(0);
    expect(clampMinor(-Infinity)).toBe(0);
  });

  it('rounds fractional minor units to whole cents', () => {
    expect(clampMinor(10.4)).toBe(10);
    expect(clampMinor(10.6)).toBe(11);
  });
});

describe('clampGoal', () => {
  it('clamps every money field and leaves the name alone', () => {
    const dirty: Goal = { name: '  A bike  ', targetMinor: -5, currentMinor: NaN, baseWeeklyMinor: -100 };
    expect(clampGoal(dirty)).toEqual({
      name: '  A bike  ',
      targetMinor: 0,
      currentMinor: 0,
      baseWeeklyMinor: 0,
    });
  });
});

describe('toggleBoost', () => {
  it('adds an id that is not active', () => {
    expect(toggleBoost([], 'feed-pets')).toEqual(['feed-pets']);
  });

  it('removes an id that is active', () => {
    expect(toggleBoost(['feed-pets', 'walk-dog'], 'feed-pets')).toEqual(['walk-dog']);
  });

  it('is idempotent: toggling the same id twice returns to the original set', () => {
    const start = ['walk-dog', 'sell-toys'];
    const round = toggleBoost(toggleBoost(start, 'feed-pets'), 'feed-pets');
    expect([...round].sort()).toEqual([...start].sort());
  });

  it('never mutates the array it was given', () => {
    const start = ['walk-dog'];
    toggleBoost(start, 'feed-pets');
    expect(start).toEqual(['walk-dog']);
  });

  it('tracks an unknown id without throwing; it simply resolves to no boost', () => {
    const ids = toggleBoost([], 'not-a-real-boost');
    expect(ids).toEqual(['not-a-real-boost']);
    expect(activeBoosts(BOOSTS, ids)).toEqual([]);
  });
});

describe('boost sums', () => {
  it('adds weekly boosts and ignores one-time ones', () => {
    expect(weeklyBoostMinor([WEEKLY_2, WEEKLY_5, ONCE_15])).toBe(700);
  });

  it('adds one-time boosts and ignores weekly ones', () => {
    expect(oneTimeBoostMinor([WEEKLY_2, ONCE_15, ONCE_20])).toBe(3_500);
  });

  it('lets a negative weekly boost pull the total down', () => {
    expect(weeklyBoostMinor([WEEKLY_5, WEEKLY_MINUS_3])).toBe(200);
  });

  it('sums to zero for an empty hand', () => {
    expect(weeklyBoostMinor([])).toBe(0);
    expect(oneTimeBoostMinor([])).toBe(0);
  });
});

describe('remainingMinor', () => {
  it('is target minus current', () => {
    expect(remainingMinor(baseGoal)).toBe(18_000);
  });

  it('floors at zero when the target is below what is already saved', () => {
    expect(remainingMinor({ ...baseGoal, targetMinor: 1_000, currentMinor: 5_000 })).toBe(0);
  });
});

describe('recurringWeeklyMinor', () => {
  it('is the base weekly plus active weekly boosts', () => {
    expect(recurringWeeklyMinor(baseGoal, [WEEKLY_2, WEEKLY_5])).toBe(1_700);
  });

  it('can be driven to zero or below by the slower-plan card', () => {
    const tiny: Goal = { ...baseGoal, baseWeeklyMinor: 200 };
    expect(recurringWeeklyMinor(tiny, [WEEKLY_MINUS_3])).toBe(-100);
  });
});

describe('weeksToGoal', () => {
  it('divides what is needed by the weekly amount and rounds up', () => {
    // $180 needed / $10 a week = 18 weeks exactly
    expect(weeksToGoal(baseGoal, [])).toBe(18);
  });

  it('rounds a partial final week up to a whole week', () => {
    // $180 needed / $7 a week = 25.71 -> 26
    expect(weeksToGoal({ ...baseGoal, baseWeeklyMinor: 700 }, [])).toBe(26);
  });

  it('is Infinity when nothing is being added each week', () => {
    expect(weeksToGoal({ ...baseGoal, baseWeeklyMinor: 0 }, [])).toBe(Infinity);
  });

  it('is Infinity when the weekly amount is driven below zero', () => {
    const tiny: Goal = { ...baseGoal, baseWeeklyMinor: 200 };
    expect(weeksToGoal(tiny, [WEEKLY_MINUS_3])).toBe(Infinity);
  });

  it('is 0 when the goal is already reached, even with no weekly contribution', () => {
    // The literal spec ordering would say Infinity here. Telling a kid who has
    // already saved enough that they will never get there is the wrong answer.
    const done: Goal = { ...baseGoal, currentMinor: 20_000, baseWeeklyMinor: 0 };
    expect(weeksToGoal(done, [])).toBe(0);
  });

  it('is 0 when the target is below what is already saved', () => {
    const over: Goal = { ...baseGoal, targetMinor: 1_000, currentMinor: 5_000, baseWeeklyMinor: 0 };
    expect(weeksToGoal(over, [])).toBe(0);
  });

  it('is 0 when a one-time boost alone covers everything that is left', () => {
    const nearly: Goal = { ...baseGoal, targetMinor: 3_000, currentMinor: 2_000, baseWeeklyMinor: 0 };
    // $10 left, a $15 boost more than covers it
    expect(weeksToGoal(nearly, [ONCE_15])).toBe(0);
  });

  it('drops as boosts are added', () => {
    const none = weeksToGoal(baseGoal, []);
    const some = weeksToGoal(baseGoal, [WEEKLY_5]);
    const more = weeksToGoal(baseGoal, [WEEKLY_5, ONCE_20]);
    expect(some).toBeLessThan(none);
    expect(more).toBeLessThan(some);
  });

  it('rises when the slower-plan card is added, which is the point of that card', () => {
    expect(weeksToGoal(baseGoal, [WEEKLY_MINUS_3])).toBeGreaterThan(weeksToGoal(baseGoal, []));
  });
});

describe('neededMinor', () => {
  it('subtracts one-time money from what is remaining', () => {
    expect(neededMinor(baseGoal, [ONCE_20])).toBe(16_000);
  });

  it('floors at zero when a one-time boost exceeds what is remaining', () => {
    const nearly: Goal = { ...baseGoal, targetMinor: 3_000, currentMinor: 2_000 };
    expect(neededMinor(nearly, [ONCE_15, ONCE_20])).toBe(0);
  });
});

describe('balanceAtWeek', () => {
  it('credits one-time money immediately, so week 0 is current plus one-time', () => {
    expect(balanceAtWeek(baseGoal, [ONCE_20], 0)).toBe(baseGoal.currentMinor + 2_000);
  });

  it('is exactly the current savings at week 0 with no boosts', () => {
    expect(balanceAtWeek(baseGoal, [], 0)).toBe(baseGoal.currentMinor);
  });

  it('adds the recurring amount once per week', () => {
    // $20 start + 7 weeks x $10
    expect(balanceAtWeek(baseGoal, [], 7)).toBe(9_000);
  });

  it('counts weekly boosts in the per-week amount', () => {
    // $20 start + $20 birthday + 7 weeks x ($10 + $5)
    expect(balanceAtWeek(baseGoal, [WEEKLY_5, ONCE_20], 7)).toBe(2_000 + 2_000 + 7 * 1_500);
  });

  it('overshoots past the target rather than capping the arithmetic', () => {
    expect(balanceAtWeek(baseGoal, [], 100)).toBeGreaterThan(baseGoal.targetMinor);
  });

  it('treats a negative or non-finite week as week 0', () => {
    expect(balanceAtWeek(baseGoal, [], -5)).toBe(baseGoal.currentMinor);
    expect(balanceAtWeek(baseGoal, [], NaN)).toBe(baseGoal.currentMinor);
  });

  it('reaches the target on the week that weeksToGoal reports', () => {
    const weeks = weeksToGoal(baseGoal, []);
    expect(balanceAtWeek(baseGoal, [], weeks)).toBeGreaterThanOrEqual(baseGoal.targetMinor);
    expect(balanceAtWeek(baseGoal, [], weeks - 1)).toBeLessThan(baseGoal.targetMinor);
  });
});

describe('requiredWeeklyMinor', () => {
  it('spreads what is needed across the timeline', () => {
    // $180 over 20 weeks = $9 a week
    expect(requiredWeeklyMinor(baseGoal, [], 20)).toBe(900);
  });

  it('is zero for a zero or negative timeline rather than dividing by it', () => {
    expect(requiredWeeklyMinor(baseGoal, [], 0)).toBe(0);
    expect(requiredWeeklyMinor(baseGoal, [], -4)).toBe(0);
  });

  it('is zero once one-time money covers everything', () => {
    const nearly: Goal = { ...baseGoal, targetMinor: 3_000, currentMinor: 2_000 };
    expect(requiredWeeklyMinor(nearly, [ONCE_20], 10)).toBe(0);
  });
});

describe('monthsToGoal', () => {
  it('derives months from weeks at 4.33 weeks per month', () => {
    expect(monthsToGoal(baseGoal, [])).toBeCloseTo(18 / WEEKS_PER_MONTH, 10);
  });

  it('is Infinity whenever weeks are Infinity', () => {
    expect(monthsToGoal({ ...baseGoal, baseWeeklyMinor: 0 }, [])).toBe(Infinity);
  });

  it('never writes back to weeks: a round-trip through months does not lose money', () => {
    // The old implementation assigned weekly <-> monthly through 4.33 and lost
    // money each way. Months are derived here, so weeks are unchanged.
    const weeksBefore = weeksToGoal(baseGoal, []);
    const months = monthsToGoal(baseGoal, []);
    expect(Math.round(months * WEEKS_PER_MONTH)).toBe(weeksBefore);
    expect(weeksToGoal(baseGoal, [])).toBe(weeksBefore);
  });
});

describe('progressAt', () => {
  it('is the balance over the target', () => {
    expect(progressAt(baseGoal, 5_000)).toBeCloseTo(0.25, 10);
  });

  it('clamps to 1 when the balance overshoots', () => {
    expect(progressAt(baseGoal, 999_999)).toBe(1);
  });

  it('clamps to 0 for a negative balance', () => {
    expect(progressAt(baseGoal, -100)).toBe(0);
  });

  it('is 1 for a zero target rather than dividing by zero', () => {
    expect(progressAt({ ...baseGoal, targetMinor: 0 }, 0)).toBe(1);
  });
});

describe('milestonesCrossed', () => {
  it('reports each ring the projection passes between two weeks', () => {
    // $20 start, $10 a week, $200 target: week 0 is 10%, week 9 is 55%
    expect(milestonesCrossed(baseGoal, [], 0, 9)).toEqual([25, 50]);
  });

  it('reports nothing when the position does not move forward', () => {
    expect(milestonesCrossed(baseGoal, [], 9, 9)).toEqual([]);
    expect(milestonesCrossed(baseGoal, [], 9, 2)).toEqual([]);
  });

  it('reports the lid at 100% when the jar fills', () => {
    expect(milestonesCrossed(baseGoal, [], 17, 18)).toContain(100);
  });

  it('does not re-report a ring already behind the starting position', () => {
    expect(milestonesCrossed(baseGoal, [], 9, 10)).toEqual([]);
  });

  it('only ever reports known milestones', () => {
    const all = milestonesCrossed(baseGoal, [], 0, 52);
    expect(all.every((m) => MILESTONES.includes(m))).toBe(true);
  });
});

describe('buildPlan', () => {
  it('assembles the whole answer for the worked example', () => {
    const plan = buildPlan(baseGoal, [], 20);
    expect(plan.remainingMinor).toBe(18_000);
    expect(plan.recurringWeeklyMinor).toBe(1_000);
    expect(plan.oneTimeMinor).toBe(0);
    expect(plan.neededMinor).toBe(18_000);
    expect(plan.weeksToGoal).toBe(18);
    expect(plan.requiredWeeklyMinor).toBe(900);
    expect(plan.reached).toBe(false);
  });

  it('marks a goal already met as reached, with zero weeks', () => {
    const plan = buildPlan({ ...baseGoal, currentMinor: 25_000, baseWeeklyMinor: 0 }, []);
    expect(plan.reached).toBe(true);
    expect(plan.weeksToGoal).toBe(0);
    expect(plan.progress).toBe(1);
  });

  it('agrees with the standalone functions it composes', () => {
    const boosts = [WEEKLY_5, ONCE_20];
    const plan = buildPlan(baseGoal, boosts, 12);
    expect(plan.weeksToGoal).toBe(weeksToGoal(baseGoal, boosts));
    expect(plan.neededMinor).toBe(neededMinor(baseGoal, boosts));
    expect(plan.requiredWeeklyMinor).toBe(requiredWeeklyMinor(baseGoal, boosts, 12));
  });

  it('survives an all-zero goal without producing NaN anywhere', () => {
    const plan = buildPlan({ name: '', targetMinor: 0, currentMinor: 0, baseWeeklyMinor: 0 }, []);
    for (const value of Object.values(plan)) {
      if (typeof value === 'number') expect(Number.isNaN(value)).toBe(false);
    }
  });
});

describe('formatDuration', () => {
  it('renders an em dash for Infinity and negatives, never "Infinity" or "NaN"', () => {
    expect(formatDuration(Infinity)).toBe('—');
    expect(formatDuration(NaN)).toBe('—');
    expect(formatDuration(-1)).toBe('—');
  });

  it('renders zero as "0 days"', () => {
    expect(formatDuration(0)).toBe('0 days');
  });

  it('renders days below 30', () => {
    expect(formatDuration(monthsForDays(29))).toBe('29 days');
    expect(formatDuration(monthsForDays(1))).toBe('1 day');
  });

  it('switches from days to months at exactly 30 days', () => {
    expect(formatDuration(monthsForDays(30))).toBe('1 month');
    expect(formatDuration(monthsForDays(31))).toBe('1 month');
  });

  it('renders whole months below 12', () => {
    expect(formatDuration(11)).toBe('11 months');
  });

  it('switches from months to years at exactly 12', () => {
    expect(formatDuration(12)).toBe('1 year');
  });

  it('renders years and leftover months past 12', () => {
    expect(formatDuration(13)).toBe('1 year and 1 month');
    expect(formatDuration(25)).toBe('2 years and 1 month');
  });

  it('omits the month part when it divides evenly into years', () => {
    expect(formatDuration(24)).toBe('2 years');
  });
});

describe('formatWeeks', () => {
  it('renders an em dash for Infinity, never "Infinity" or "NaN"', () => {
    expect(formatWeeks(Infinity)).toBe('—');
    expect(formatWeeks(NaN)).toBe('—');
  });

  it('singularises one week', () => {
    expect(formatWeeks(1)).toBe('1 week');
    expect(formatWeeks(12)).toBe('12 weeks');
    expect(formatWeeks(0)).toBe('0 weeks');
  });
});

describe('money formatting', () => {
  it('renders minor units as whole dollars', () => {
    expect(formatMinor(20_000)).toBe('$200');
    expect(formatMinor(0)).toBe('$0');
  });

  it('groups thousands', () => {
    expect(formatMinor(500_000)).toBe('$5,000');
  });

  it('signs boost amounts, using a minus sign for the slower-plan card', () => {
    expect(formatSignedMinor(200)).toBe('+$2');
    expect(formatSignedMinor(-300)).toBe('−$3');
  });

  it('round-trips dollars through minor units', () => {
    expect(parseDollarsToMinor(200)).toBe(20_000);
    expect(formatMinor(parseDollarsToMinor(200))).toBe('$200');
  });

  it('clamps negative and non-finite dollar input to zero', () => {
    expect(parseDollarsToMinor(-5)).toBe(0);
    expect(parseDollarsToMinor(NaN)).toBe(0);
  });
});

describe('targetDate', () => {
  const from = new Date('2026-01-01T12:00:00Z');

  it('adds seven days per week', () => {
    const d = targetDate(2, from);
    expect(d?.toISOString().slice(0, 10)).toBe('2026-01-15');
  });

  it('returns null for Infinity, so the caller shows a dash and not a fake date', () => {
    expect(targetDate(Infinity, from)).toBeNull();
    expect(formatTargetDate(targetDate(Infinity, from))).toBe('—');
  });

  it('does not mutate the date it was given', () => {
    const before = from.getTime();
    targetDate(10, from);
    expect(from.getTime()).toBe(before);
  });

  it('formats as a soft month and day', () => {
    expect(formatTargetDate(new Date('2026-03-04T12:00:00Z'))).toMatch(/March 4/);
  });
});

describe('content integrity', () => {
  it('has unique preset ids', () => {
    const ids = GOAL_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique boost ids', () => {
    const ids = BOOSTS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every preset a positive target and a label', () => {
    for (const p of GOAL_PRESETS) {
      expect(p.targetMinor).toBeGreaterThan(0);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.emoji.length).toBeGreaterThan(0);
    }
  });

  it('gives every boost a non-zero amount, a label, and a known cadence', () => {
    for (const b of BOOSTS) {
      expect(b.amountMinor).not.toBe(0);
      expect(b.label.length).toBeGreaterThan(0);
      expect(['weekly', 'once']).toContain(b.cadence);
    }
  });

  it('ships cards that slow the plan down, so the tradeoff is visible in both directions', () => {
    expect(BOOSTS.filter((b) => b.amountMinor < 0).length).toBeGreaterThan(0);
    expect(BOOSTS.filter((b) => b.amountMinor > 0).length).toBeGreaterThan(0);
  });

  it('flattens the groups in order, with no card lost or duplicated', () => {
    const fromGroups = BOOST_GROUPS.flatMap((g) => g.boosts.map((b) => b.id));
    expect(BOOSTS.map((b) => b.id)).toEqual(fromGroups);
  });

  it('has unique group ids and gives every group a title and a hint', () => {
    const ids = BOOST_GROUPS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of BOOST_GROUPS) {
      expect(g.title.length).toBeGreaterThan(0);
      expect(g.hint.length).toBeGreaterThan(0);
      expect(g.boosts.length).toBeGreaterThan(0);
    }
  });

  it('keeps sign and group aligned: everything in "spend" costs, everything else earns', () => {
    for (const g of BOOST_GROUPS) {
      for (const b of g.boosts) {
        if (g.id === 'spend') expect(b.amountMinor).toBeLessThan(0);
        else expect(b.amountMinor).toBeGreaterThan(0);
      }
    }
  });

  it('offers both a weekly and a one-off way to spend, since they cost differently', () => {
    const spend = BOOST_GROUPS.find((g) => g.id === 'spend');
    expect(spend?.boosts.some((b) => b.cadence === 'weekly')).toBe(true);
    expect(spend?.boosts.some((b) => b.cadence === 'once')).toBe(true);
  });

  it('carries no shaming or judging language on any card', () => {
    // copy.md forbids shaming a child. These cards describe things a kid might
    // buy; the lesson is the week count moving, never a verdict on the choice.
    const banned = /waste|wasted|stupid|dumb|bad idea|gambling|junk|pointless|greedy|silly|should not|shouldn't|don't buy|fail/i;
    for (const g of BOOST_GROUPS) {
      expect(g.title).not.toMatch(banned);
      expect(g.hint).not.toMatch(banned);
      for (const b of g.boosts) expect(b.label).not.toMatch(banned);
    }
  });

  it('spending cards make the plan take longer, and come back off cleanly', () => {
    const before = weeksToGoal(baseGoal, []);
    expect(weeksToGoal(baseGoal, [SPEND_WEEKLY])).toBeGreaterThan(before);
    expect(weeksToGoal(baseGoal, [SPEND_ONCE])).toBeGreaterThan(before);
    // Removing them restores the original plan exactly - nothing is sticky.
    const ids = toggleBoost(toggleBoost([], 'candy-snacks'), 'candy-snacks');
    expect(weeksToGoal(baseGoal, activeBoosts(BOOSTS, ids))).toBe(before);
  });

  it('lets an earning card cancel a spending card of the same size', () => {
    // candy-snacks is -$2/week and feed-pets is +$2/week.
    expect(weeklyBoostMinor([SPEND_WEEKLY, WEEKLY_2])).toBe(0);
  });

  it('keeps every amount in whole minor units', () => {
    for (const b of BOOSTS) expect(Number.isInteger(b.amountMinor)).toBe(true);
    for (const p of GOAL_PRESETS) expect(Number.isInteger(p.targetMinor)).toBe(true);
  });

  it('resolves active ids in content order, not tap order', () => {
    const resolved = activeBoosts(BOOSTS, ['birthday-money', 'feed-pets']);
    expect(resolved.map((b) => b.id)).toEqual(['feed-pets', 'birthday-money']);
  });
});

describe('no growth is ever applied', () => {
  it('is strictly linear: doubling the weeks doubles what was contributed', () => {
    const atTen = balanceAtWeek(baseGoal, [], 10) - baseGoal.currentMinor;
    const atTwenty = balanceAtWeek(baseGoal, [], 20) - baseGoal.currentMinor;
    expect(atTwenty).toBe(atTen * 2);
  });

  it('never exceeds what was actually put in', () => {
    const weeks = 30;
    const contributed = baseGoal.currentMinor + baseGoal.baseWeeklyMinor * weeks;
    expect(balanceAtWeek(baseGoal, [], weeks)).toBe(contributed);
  });
});

/* -------------------------------------------------------------------------
 * Property sweep
 *
 * Exhaustive rather than illustrative: every combination below is checked for
 * the invariants the UI depends on. Added after a report screen shipped two
 * numbers that disagreed with each other.
 * ---------------------------------------------------------------------- */

describe('invariants across the whole input space', () => {
  const targets = [0, 100, 6_000, 7_000, 20_000, 100_000];
  const currents = [0, 500, 2_000, 25_000];
  const weeklies = [0, 100, 1_000, 3_400, 5_000];
  const hands: Boost[][] = [
    [],
    [WEEKLY_5],
    [ONCE_15, ONCE_20],
    [WEEKLY_5, ONCE_20],
    [SPEND_WEEKLY],
    [SPEND_ONCE],
    [SPEND_WEEKLY, SPEND_ONCE],
    [WEEKLY_MINUS_3, SPEND_WEEKLY],
    [WEEKLY_5, SPEND_ONCE, ONCE_20],
  ];

  const every = (fn: (goal: Goal, boosts: Boost[]) => void) => {
    for (const targetMinor of targets)
      for (const currentMinor of currents)
        for (const baseWeeklyMinor of weeklies)
          for (const boosts of hands)
            fn({ name: 'x', targetMinor, currentMinor, baseWeeklyMinor }, boosts);
  };

  it('never produces NaN in any derived value', () => {
    every((goal, boosts) => {
      const plan = buildPlan(goal, boosts);
      for (const [key, value] of Object.entries(plan)) {
        if (typeof value === 'number') {
          expect(Number.isNaN(value), `${key} was NaN`).toBe(false);
        }
      }
      for (const w of [0, 1, 7, 52]) {
        expect(Number.isNaN(balanceAtWeek(goal, boosts, w))).toBe(false);
      }
    });
  });

  it('reaches the target on the week it reports, and not before', () => {
    every((goal, boosts) => {
      const weeks = weeksToGoal(goal, boosts);
      if (!Number.isFinite(weeks) || weeks === 0) return;
      const at = balanceAtWeek(goal, boosts, weeks);
      const before = balanceAtWeek(goal, boosts, weeks - 1);
      const ctx = `goal=${JSON.stringify(goal)} boosts=${JSON.stringify(
        boosts.map((b) => b.id),
      )} weeks=${weeks} needed=${neededMinor(goal, boosts)} oneTime=${oneTimeBoostMinor(boosts)}`;
      expect(at, ctx).toBeGreaterThanOrEqual(goal.targetMinor);
      expect(before, ctx).toBeLessThan(goal.targetMinor);
    });
  });

  it('keeps progress inside 0..1 however the boosts are stacked', () => {
    every((goal, boosts) => {
      for (const w of [0, 1, 12, 104]) {
        const p = progressAt(goal, balanceAtWeek(goal, boosts, w));
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    });
  });

  it('agrees between weeks and months at the display factor', () => {
    every((goal, boosts) => {
      const weeks = weeksToGoal(goal, boosts);
      const months = monthsToGoal(goal, boosts);
      if (!Number.isFinite(weeks)) {
        expect(months).toBe(Infinity);
        return;
      }
      expect(months * WEEKS_PER_MONTH).toBeCloseTo(weeks, 6);
    });
  });

  it('marks reached exactly when nothing more is needed', () => {
    every((goal, boosts) => {
      const plan = buildPlan(goal, boosts);
      expect(plan.reached).toBe(plan.neededMinor === 0);
      if (plan.reached) expect(plan.weeksToGoal).toBe(0);
    });
  });

  it('spreads what is needed over a timeline, to within a rounding cent', () => {
    every((goal, boosts) => {
      for (const timeline of [1, 4, 12, 52]) {
        const req = requiredWeeklyMinor(goal, boosts, timeline);
        const needed = neededMinor(goal, boosts);
        expect(Math.abs(req * timeline - needed)).toBeLessThanOrEqual(timeline);
      }
    });
  });

  it('never claims growth: the balance is exactly what was put in', () => {
    every((goal, boosts) => {
      for (const w of [0, 3, 26]) {
        const expected =
          goal.currentMinor + oneTimeBoostMinor(boosts) + recurringWeeklyMinor(goal, boosts) * w;
        expect(balanceAtWeek(goal, boosts, w)).toBe(expected);
      }
    });
  });
});

describe('regressions from the printed plan', () => {
  it('does not invent a need when there is no goal to save for', () => {
    // A spending card against a zero target used to read as "you need $15",
    // because remainingMinor floors at zero and the spend was then subtracted
    // from that floor.
    const noGoal: Goal = { name: '', targetMinor: 0, currentMinor: 0, baseWeeklyMinor: 1_000 };
    expect(neededMinor(noGoal, [SPEND_ONCE])).toBe(0);
    expect(weeksToGoal(noGoal, [SPEND_ONCE])).toBe(0);
    expect(buildPlan(noGoal, [SPEND_ONCE]).reached).toBe(true);
  });

  it('still counts a spend against a real goal already met', () => {
    // The guard above must not swallow the genuine case: $60 saved for a $60
    // goal, then $15 spent, leaves $15 to find again.
    const met: Goal = { name: '', targetMinor: 6_000, currentMinor: 6_000, baseWeeklyMinor: 1_000 };
    expect(neededMinor(met, [SPEND_ONCE])).toBe(1_500);
    expect(weeksToGoal(met, [SPEND_ONCE])).toBe(2);
  });

  it('reports no required weekly when there is no timeline to hit', () => {
    // The printable plan showed "you would need to save $33 per week" beside a
    // $34 weekly contribution, because the preview slider position was being
    // passed in as if it were a deadline.
    expect(buildPlan(baseGoal, []).requiredWeeklyMinor).toBe(0);
    expect(buildPlan(baseGoal, [], 0).requiredWeeklyMinor).toBe(0);
  });

  it('reconciles the four printed numbers once one-time money is shown', () => {
    // target $200, nothing saved, $34 a week, $35 of one-time money.
    const goal: Goal = { name: 'A bike', targetMinor: 20_000, currentMinor: 0, baseWeeklyMinor: 3_400 };
    const hand = [ONCE_15, ONCE_20];
    const plan = buildPlan(goal, hand);
    expect(plan.oneTimeMinor).toBe(3_500);
    expect(plan.weeksToGoal).toBe(5);
    // What a parent checks: start + one-time + weeks x weekly >= target.
    const totalIn = goal.currentMinor + plan.oneTimeMinor + plan.recurringWeeklyMinor * plan.weeksToGoal;
    expect(totalIn).toBeGreaterThanOrEqual(goal.targetMinor);
  });

  it('never shows a negative balance to the player', () => {
    const broke: Goal = { name: '', targetMinor: 20_000, currentMinor: 0, baseWeeklyMinor: 3_400 };
    expect(balanceAtWeek(broke, [SPEND_ONCE], 0)).toBe(-1_500); // engine truth
    expect(displayBalanceAtWeek(broke, [SPEND_ONCE], 0)).toBe(0); // what a child sees
  });
});

describe('surplus absorbs a one-time cost instead of being discarded', () => {
  // $1 goal, $5 saved, $1 a week, then a $15 purchase.
  const tiny: Goal = { name: '', targetMinor: 100, currentMinor: 500, baseWeeklyMinor: 100 };

  it('counts the money already over the target against the cost', () => {
    // $5 - $15 = -$10, so $11 is needed to get back to a $1 goal - not $15.
    expect(neededMinor(tiny, [SPEND_ONCE])).toBe(1_100);
    expect(weeksToGoal(tiny, [SPEND_ONCE])).toBe(11);
  });

  it('lands on the target the week it says, not four weeks late', () => {
    const weeks = weeksToGoal(tiny, [SPEND_ONCE]);
    expect(balanceAtWeek(tiny, [SPEND_ONCE], weeks)).toBeGreaterThanOrEqual(tiny.targetMinor);
    expect(balanceAtWeek(tiny, [SPEND_ONCE], weeks - 1)).toBeLessThan(tiny.targetMinor);
  });
});

describe('injected stylesheet integrity', () => {
  // The scoped CSS lives in a template literal. A backtick anywhere inside it -
  // easily typed into a CSS comment while explaining a rule - terminates the
  // literal and takes the whole route down with a syntax error. This has
  // happened twice; the build catches it, but only after a broken page.
  it('has no stray backtick inside the injected CSS block', async () => {
    const { readFileSync } = await import('fs');
    const src = readFileSync('app/components/SavingsGoalCalculator.tsx', 'utf8');
    const open = src.indexOf('const STYLES = `');
    expect(open, 'STYLES literal not found').toBeGreaterThan(-1);
    const body = src.slice(open + 'const STYLES = `'.length);
    const close = body.indexOf('`');
    expect(close, 'STYLES literal is unterminated').toBeGreaterThan(-1);
    const css = body.slice(0, close);
    expect(css).not.toContain('`');
    // Sanity: we actually captured the stylesheet, not an empty string.
    expect(css).toContain('.sgj-cert');
    expect(css.length).toBeGreaterThan(2000);
  });
});
