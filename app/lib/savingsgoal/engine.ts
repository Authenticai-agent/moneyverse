/**
 * Goal Jar - savings math
 * ------------------------
 * Every calculation for `/tools/savings-goal-calculator` lives here as a pure
 * function. No React, no DOM, no randomness: given the same inputs these always
 * return the same answer, so all of it is unit-testable.
 *
 * ## Money
 * Amounts are **integer minor units** (cents). Dollars appear only in
 * `formatMinor` and `parseDollarsToMinor`, at the display edge.
 *
 * ## What this tool deliberately does NOT do
 * No interest, no compounding, no growth. This is arithmetic and it says so on
 * the page. Growth is the Money Tree's job; conflating the two would teach a
 * nine-year-old that a piggy bank earns a return.
 *
 * ## Weekly is the single source of truth
 * `monthsToGoal` is derived from weeks for display only, at `WEEKS_PER_MONTH`.
 * Nothing writes back from months to weeks. The previous implementation let the
 * two inputs assign to each other through 4.33 and silently lost money on every
 * round-trip; that is the bug this rule exists to prevent.
 */

import type { Boost, Goal, Milestone, Plan } from './types';

/** Display-only conversion factor. Weeks are authoritative; months are derived. */
export const WEEKS_PER_MONTH = 4.33;

/** Average days per month, used by `formatDuration` to describe short spans. */
const DAYS_PER_MONTH = 30.44;

/** Fill levels that earn a badge, ascending. */
export const MILESTONES: readonly Milestone[] = [25, 50, 75, 100] as const;

/* --------------------------------- clamps -------------------------------- */

/**
 * Coerce anything into a non-negative whole number of minor units.
 *
 * Clamping happens here, at the engine boundary, and not in the inputs - a
 * typed `-5`, a pasted `"abc"`, or a `NaN` from an empty field all resolve to a
 * sane value before any arithmetic sees them.
 */
export function clampMinor(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
}

/** Clamp a whole `Goal`, so callers can pass raw input straight through. */
export function clampGoal(goal: Goal): Goal {
  return {
    name: goal.name,
    targetMinor: clampMinor(goal.targetMinor),
    currentMinor: clampMinor(goal.currentMinor),
    baseWeeklyMinor: clampMinor(goal.baseWeeklyMinor),
  };
}

/* ---------------------------------- boosts -------------------------------- */

/**
 * Toggle a boost id in the active set.
 *
 * Idempotent by construction: toggling the same id twice returns a set equal to
 * the original, and an id that is not a known boost is still tracked (the caller
 * resolves ids against content, so an unknown id simply contributes nothing).
 */
export function toggleBoost(activeIds: readonly string[], id: string): string[] {
  return activeIds.includes(id) ? activeIds.filter((x) => x !== id) : [...activeIds, id];
}

/** Resolve active ids against the available boosts, preserving content order. */
export function activeBoosts(all: readonly Boost[], activeIds: readonly string[]): Boost[] {
  return all.filter((b) => activeIds.includes(b.id));
}

/** Sum of every active boost paying out every week. May be negative. */
export function weeklyBoostMinor(boosts: readonly Boost[]): number {
  return boosts.reduce((sum, b) => (b.cadence === 'weekly' ? sum + b.amountMinor : sum), 0);
}

/** Sum of every active boost paying out once. May be negative. */
export function oneTimeBoostMinor(boosts: readonly Boost[]): number {
  return boosts.reduce((sum, b) => (b.cadence === 'once' ? sum + b.amountMinor : sum), 0);
}

/* ----------------------------------- math --------------------------------- */

/** What is still missing before any boosts are counted. */
export function remainingMinor(goal: Goal): number {
  return Math.max(0, clampMinor(goal.targetMinor) - clampMinor(goal.currentMinor));
}

/** Base weekly plus every active weekly boost. Not clamped: it may go <= 0. */
export function recurringWeeklyMinor(goal: Goal, boosts: readonly Boost[]): number {
  return clampMinor(goal.baseWeeklyMinor) + weeklyBoostMinor(boosts);
}

/**
 * What the weekly contributions must cover, once one-time money has landed.
 *
 * ## Deviation from the written contract
 *
 * The spec gives this as `max(0, remaining - oneTime)` with
 * `remaining = max(0, target - current)`. That is algebraically wrong whenever
 * `current > target`, because the inner floor throws away the surplus that
 * should absorb a one-time cost.
 *
 * Worked example: a $1 goal, $5 already saved, and a $15 purchase. The floored
 * form computes `remaining = 0`, then `needed = 0 - (-1500) = $15`, and reports
 * 15 weeks at $1/week. The true position is `$5 - $15 = -$10`, so $11 is needed
 * and the goal is met in 11 weeks. The spec form invented four weeks of work
 * out of a floor.
 *
 * Measuring the shortfall in one step against the actual week-0 balance is
 * equivalent for every case the spec enumerates, and correct for the ones it
 * does not. It also makes the engine's central invariant true by construction:
 * `balanceAtWeek(weeksToGoal) >= target` and `balanceAtWeek(weeksToGoal - 1) <
 * target`.
 *
 * The zero-target guard stays separate: with no goal set, a spending card would
 * otherwise report that a child needs money towards nothing.
 */
export function neededMinor(goal: Goal, boosts: readonly Boost[]): number {
  const target = clampMinor(goal.targetMinor);
  if (target <= 0) return 0;
  const atStart = clampMinor(goal.currentMinor) + oneTimeBoostMinor(boosts);
  return Math.max(0, target - atStart);
}

/**
 * Balance projected at the end of week `w`.
 *
 * One-time boosts are credited immediately, so `balanceAtWeek(0)` is
 * `current + oneTime`. Uncapped on purpose - a plan that overshoots the target
 * should read as overshooting; the jar caps the *fill*, not the arithmetic.
 */
export function balanceAtWeek(goal: Goal, boosts: readonly Boost[], week: number): number {
  const w = Number.isFinite(week) ? Math.max(0, Math.floor(week)) : 0;
  return clampMinor(goal.currentMinor) + oneTimeBoostMinor(boosts) + recurringWeeklyMinor(goal, boosts) * w;
}

/**
 * Whole weeks until the goal is met, or `Infinity` when it never is.
 *
 * Deviation from the literal spec formula, deliberate: when `needed` is already
 * zero the answer is **0 weeks**, even if the weekly contribution is zero. The
 * literal `recurringWeekly <= 0 ? Infinity` ordering would tell a kid who has
 * already saved enough that they will never get there. Reaching the goal is
 * checked first.
 */
export function weeksToGoal(goal: Goal, boosts: readonly Boost[]): number {
  const needed = neededMinor(goal, boosts);
  if (needed <= 0) return 0;
  const weekly = recurringWeeklyMinor(goal, boosts);
  if (weekly <= 0) return Infinity;
  return Math.ceil(needed / weekly);
}

/**
 * Months until the goal, derived from weeks for display only.
 * Never an input, never written back. See the file header.
 */
export function monthsToGoal(goal: Goal, boosts: readonly Boost[]): number {
  const weeks = weeksToGoal(goal, boosts);
  if (!Number.isFinite(weeks)) return Infinity;
  return weeks / WEEKS_PER_MONTH;
}

/**
 * What they would have to put in each week to finish inside `timelineWeeks`.
 * Returns 0 for a non-positive timeline - there is nothing meaningful to divide.
 *
 * Rounded to whole minor units because money is integral here; the fractional
 * remainder is at most one cent per week and rounding up would misreport a plan
 * as unaffordable.
 */
export function requiredWeeklyMinor(goal: Goal, boosts: readonly Boost[], timelineWeeks: number): number {
  if (!Number.isFinite(timelineWeeks) || timelineWeeks <= 0) return 0;
  return Math.round(neededMinor(goal, boosts) / timelineWeeks);
}

/**
 * Balance as shown to a player, floored at zero.
 *
 * `balanceAtWeek` is the engine's honest arithmetic and can go negative: an
 * active spending card is credited at week 0, so a child who has saved nothing
 * and taps a $15 purchase is mathematically at -$15. A jar cannot hold less
 * than nothing, and "Today you have -$15" is not a sentence to show a
 * nine-year-old, so every display path uses this instead.
 */
export function displayBalanceAtWeek(goal: Goal, boosts: readonly Boost[], week: number): number {
  return Math.max(0, balanceAtWeek(goal, boosts, week));
}

/** Progress toward the target right now, clamped to 0..1. */
export function progressAt(goal: Goal, balance: number): number {
  const target = clampMinor(goal.targetMinor);
  if (target <= 0) return 1;
  return Math.min(1, Math.max(0, balance / target));
}

/** Build the whole derived answer in one pass. This is what the UI renders. */
export function buildPlan(goal: Goal, boosts: readonly Boost[], timelineWeeks = 0): Plan {
  const needed = neededMinor(goal, boosts);
  return {
    remainingMinor: remainingMinor(goal),
    recurringWeeklyMinor: recurringWeeklyMinor(goal, boosts),
    oneTimeMinor: oneTimeBoostMinor(boosts),
    neededMinor: needed,
    weeksToGoal: weeksToGoal(goal, boosts),
    monthsToGoal: monthsToGoal(goal, boosts),
    requiredWeeklyMinor: requiredWeeklyMinor(goal, boosts, timelineWeeks),
    progress: progressAt(goal, balanceAtWeek(goal, boosts, 0)),
    reached: needed <= 0,
  };
}

/**
 * Which milestones the projection crosses between two week positions.
 *
 * Used to fire a badge exactly once per crossing while the player drags, rather
 * than re-firing on every animation frame that sits above the line.
 */
export function milestonesCrossed(
  goal: Goal,
  boosts: readonly Boost[],
  fromWeek: number,
  toWeek: number,
): Milestone[] {
  if (toWeek <= fromWeek) return [];
  const before = progressAt(goal, balanceAtWeek(goal, boosts, fromWeek)) * 100;
  const after = progressAt(goal, balanceAtWeek(goal, boosts, toWeek)) * 100;
  return MILESTONES.filter((m) => before < m && after >= m);
}

/* -------------------------------- formatting ------------------------------ */

/** Whole dollars with a leading $ and thousands separators, from minor units. */
export function formatMinor(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  return sign + '$' + Math.round(Math.abs(minor) / 100).toLocaleString();
}

/** Signed dollars, for boost amounts: `+$2`, `-$3`. */
export function formatSignedMinor(minor: number): string {
  return (minor >= 0 ? '+' : '−') + '$' + Math.round(Math.abs(minor) / 100).toLocaleString();
}

/** Dollars (possibly fractional user input) into whole minor units. */
export function parseDollarsToMinor(dollars: number): number {
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return Math.round(dollars * 100);
}

/**
 * Weeks for display. `Infinity` becomes an em dash - never "Infinity", never
 * "NaN". The caller pairs the dash with a prompt to add a weekly amount.
 */
export function formatWeeks(weeks: number): string {
  if (!Number.isFinite(weeks)) return '—';
  const w = Math.max(0, Math.round(weeks));
  return `${w} week${w === 1 ? '' : 's'}`;
}

/**
 * Human duration from a month count.
 *
 * Behaviour is preserved exactly from the previous implementation in
 * `SavingsGoalCalculator.tsx`: days under 30, whole months under 12, then years
 * and months. It shipped recently; the tests pin 29/30/31 days and 11/12/13
 * months so it cannot regress.
 */
export function formatDuration(months: number): string {
  if (!isFinite(months) || months < 0) return '—';
  const days = Math.round(months * DAYS_PER_MONTH);
  if (days <= 0) return '0 days';
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
  const wholeMonths = Math.round(months);
  if (wholeMonths < 12) return `${wholeMonths} month${wholeMonths === 1 ? '' : 's'}`;
  const years = Math.floor(wholeMonths / 12);
  const leftoverMonths = wholeMonths % 12;
  if (leftoverMonths === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} and ${leftoverMonths} month${leftoverMonths === 1 ? '' : 's'}`;
}

/**
 * The calendar date `weeks` from `from`. Returns null when the goal is never
 * reached, so the caller renders the em dash instead of a fake date.
 *
 * `from` is injected rather than read from the clock, so this stays pure and
 * the tests stay deterministic.
 */
export function targetDate(weeks: number, from: Date): Date | null {
  if (!Number.isFinite(weeks)) return null;
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + Math.max(0, Math.round(weeks)) * 7);
  return d;
}

/** "around March 4" - the soft, non-committal phrasing the answer panel uses. */
export function formatTargetDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}
