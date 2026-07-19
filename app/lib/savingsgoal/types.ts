/**
 * Goal Jar (Savings Goal Calculator) - shared types
 * -------------------------------------------------
 * Pure domain types for the savings goal simulator. No React, no DOM.
 *
 * Money is held in **integer minor units** (cents) everywhere in this domain,
 * per decision D-003 and windsurfrules.md #12. Formatting to dollars happens
 * only at the display edge, via `formatMinor` in `engine.ts`.
 */

/**
 * Which screen the player is on. Lives in the hook, never in URL state.
 *
 * `intro` is the short welcome clip that plays once on arrival. It is always
 * skippable, is bypassed entirely under reduced-motion, and `reset` returns to
 * `setup` rather than replaying it.
 */
export type Phase = 'intro' | 'setup' | 'jar' | 'report';

/**
 * How often a boost pays out.
 * - `weekly` adds to the recurring contribution, every week, forever.
 * - `once`  is a single lump sum, credited immediately at week 0.
 */
export type BoostCadence = 'weekly' | 'once';

/**
 * A tradeoff card the player can toggle on and off.
 *
 * `amountMinor` may be **negative** - that is the point of the mechanic. A card
 * that slows the plan down is a legitimate, non-shameful choice, and watching
 * the week count rise is the lesson. See `copy.md`'s prohibited-language list:
 * no card is ever framed as a mistake.
 */
export interface Boost {
  /** Stable kebab-case key. Never renamed - it is the toggle identity. */
  id: string;
  /** Short kid-facing label, e.g. "Skip one snack". */
  label: string;
  /** Signed amount in minor units, applied per `cadence`. */
  amountMinor: number;
  cadence: BoostCadence;
  /** Decorative only. Always rendered `aria-hidden` beside the text label. */
  emoji: string;
}

/** A tappable starting point on the setup screen. Illustrative defaults. */
export interface GoalPreset {
  id: string;
  /** Pre-fills `Goal.name`. */
  name: string;
  /** Pre-fills `Goal.targetMinor`. */
  targetMinor: number;
  /** Decorative only. Always rendered `aria-hidden` beside the text label. */
  emoji: string;
}

/** Everything the player has chosen about what they are saving for. */
export interface Goal {
  /** Free text, kid-supplied. Never leaves the browser. */
  name: string;
  /** What the thing costs, in minor units (clamped >= 0). */
  targetMinor: number;
  /** What they have already, in minor units (clamped >= 0). */
  currentMinor: number;
  /** Base weekly contribution before boosts, in minor units (clamped >= 0). */
  baseWeeklyMinor: number;
}

/**
 * The fully-derived answer to "when do I get it?".
 *
 * Everything here is a pure function of `(Goal, active boosts, timelineWeeks)`.
 * Nothing in this shape is stored; `buildPlan` recomputes it on every change.
 */
export interface Plan {
  /** `max(0, target - current)` - what is left to find. */
  remainingMinor: number;
  /** Base weekly plus every active weekly boost. May be <= 0. */
  recurringWeeklyMinor: number;
  /** Sum of every active one-time boost. May be negative. */
  oneTimeMinor: number;
  /** `max(0, remaining - oneTime)` - what the weekly contributions must cover. */
  neededMinor: number;
  /** Whole weeks until the goal is met. `Infinity` when it never is. */
  weeksToGoal: number;
  /** Derived from weeks for display only, at 4.33 weeks/month. `Infinity` likewise. */
  monthsToGoal: number;
  /** What they would need each week to hit `timelineWeeks`. 0 when no timeline. */
  requiredWeeklyMinor: number;
  /** Progress toward the target right now, clamped to 0..1. */
  progress: number;
  /** True when the goal is already met and nothing more is needed. */
  reached: boolean;
}

/** The four fill levels that pop a milestone badge on the jar. */
export type Milestone = 25 | 50 | 75 | 100;
