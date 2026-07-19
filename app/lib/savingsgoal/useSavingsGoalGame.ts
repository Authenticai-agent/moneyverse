'use client';

/**
 * Goal Jar - phase and state
 * ---------------------------
 * A `useReducer` over the whole tool. Every derived number comes from
 * `engine.ts`; nothing computed is stored, so the answer can never drift out of
 * sync with the inputs that produced it.
 *
 * ## What the jar is showing
 * The jar level is the projected balance at `displayWeek`, and the scrubber
 * starts at week 0 - "what I have right now". Dragging it forward fills the jar
 * and swaps the answer to "on week 7 you will have $92", while a ghost outline
 * stays pinned at week 0 so the kid can see where they are versus where they
 * are heading. Milestones fire on those crossings.
 *
 * The dial does not move the level (week 0 is week 0 however much you add each
 * week) - it moves the *answer*. Coins raining in while dragging are feedback
 * for that change, not a level change.
 */

import { useCallback, useEffect, useMemo, useReducer } from 'react';
import {
  activeBoosts,
  balanceAtWeek,
  buildPlan,
  clampMinor,
  displayBalanceAtWeek,
  milestonesCrossed,
  progressAt,
  targetDate,
  toggleBoost as toggleBoostId,
  weeksToGoal,
} from './engine';
import { BOOSTS, DEFAULT_WEEKLY_MINOR, GOAL_PRESETS, MAX_SCRUB_WEEKS } from './content';
import type { Goal, GoalPreset, Milestone, Phase, Plan } from './types';

/** How long the previous plan's ghost figure stays visible after a change. */
const GHOST_MS = 3_000;

interface State {
  phase: Phase;
  goal: Goal;
  /** Ids of the boost cards currently switched on. */
  activeBoostIds: string[];
  /** Which preset tile is selected, or `custom`, or null before a choice. */
  presetId: string | null;
  /** Week the scrubber sits on. 0 is "now". */
  scrubWeek: number;
  /** Previous week count, held briefly so an improvement is legible. */
  ghostWeeks: number | null;
  /** Milestone badge currently on screen, if any. */
  milestone: Milestone | null;
  /** Sound starts off, always. The player opts in. */
  soundOn: boolean;
}

type Action =
  | { type: 'pickPreset'; preset: GoalPreset }
  | { type: 'startCustom' }
  | { type: 'setName'; name: string }
  | { type: 'setTargetMinor'; minor: number }
  | { type: 'setCurrentMinor'; minor: number }
  | { type: 'setWeeklyMinor'; minor: number }
  | { type: 'toggleBoost'; id: string }
  | { type: 'scrubTo'; week: number }
  | { type: 'goto'; phase: Phase }
  | { type: 'reset' }
  | { type: 'clearGhost' }
  | { type: 'dismissMilestone' }
  | { type: 'setSound'; on: boolean };

const CUSTOM = 'custom';

function initialState(phase: Phase = 'intro'): State {
  return {
    phase,
    goal: { name: '', targetMinor: 0, currentMinor: 0, baseWeeklyMinor: DEFAULT_WEEKLY_MINOR },
    activeBoostIds: [],
    presetId: null,
    scrubWeek: 0,
    ghostWeeks: null,
    milestone: null,
    soundOn: false,
  };
}

/** Weeks under the current plan, used to snapshot a ghost before a change. */
function currentWeeks(state: State): number {
  return weeksToGoal(state.goal, activeBoosts(BOOSTS, state.activeBoostIds));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    /* ------------------------------- setup ------------------------------- */

    case 'pickPreset':
      // Tapping a preset fills the goal and moves straight to the jar. No
      // submit button: the tap is the commitment.
      return {
        ...state,
        phase: 'jar',
        presetId: action.preset.id,
        goal: { ...state.goal, name: action.preset.name, targetMinor: action.preset.targetMinor },
      };

    case 'startCustom':
      // Reveals the name + amount fields, but stays on setup - there is nothing
      // to show in the jar until an amount exists.
      return { ...state, presetId: CUSTOM };

    case 'setName':
      return { ...state, goal: { ...state.goal, name: action.name } };

    case 'setTargetMinor':
      return { ...state, goal: { ...state.goal, targetMinor: clampMinor(action.minor) } };

    case 'setCurrentMinor':
      return { ...state, goal: { ...state.goal, currentMinor: clampMinor(action.minor) } };

    /* -------------------------------- jar -------------------------------- */

    case 'setWeeklyMinor':
      // No ghost here: the dial changes continuously while dragging, and a
      // ghost that re-snapshots every frame is noise rather than signal.
      return { ...state, goal: { ...state.goal, baseWeeklyMinor: clampMinor(action.minor) } };

    case 'toggleBoost': {
      const before = currentWeeks(state);
      return {
        ...state,
        activeBoostIds: toggleBoostId(state.activeBoostIds, action.id),
        ghostWeeks: Number.isFinite(before) ? before : null,
      };
    }

    case 'scrubTo': {
      const week = Math.max(0, Math.min(MAX_SCRUB_WEEKS, Math.round(action.week)));
      const boosts = activeBoosts(BOOSTS, state.activeBoostIds);
      const crossed = milestonesCrossed(state.goal, boosts, state.scrubWeek, week);
      return {
        ...state,
        scrubWeek: week,
        // Highest ring crossed in this move wins, so a fast drag past two rings
        // celebrates the further one rather than queueing badges.
        milestone: crossed.length > 0 ? crossed[crossed.length - 1] : state.milestone,
      };
    }

    case 'clearGhost':
      return { ...state, ghostWeeks: null };

    case 'dismissMilestone':
      return { ...state, milestone: null };

    case 'setSound':
      return { ...state, soundOn: action.on };

    /* ------------------------------ navigation ---------------------------- */

    case 'goto':
      return { ...state, phase: action.phase };

    case 'reset':
      // Back to picking a goal, not back to the welcome clip. "Pick something
      // else" is a step inside the tool; replaying the intro there would be a
      // five-second wall in front of an ordinary action.
      return initialState('setup');

    default:
      return state;
  }
}

export interface SavingsGoalGame {
  /* state */
  phase: Phase;
  goal: Goal;
  presetId: string | null;
  activeBoostIds: string[];
  boosts: ReturnType<typeof activeBoosts>;
  scrubWeek: number;
  ghostWeeks: number | null;
  milestone: Milestone | null;
  soundOn: boolean;

  /* derived */
  plan: Plan;
  /** Balance at the scrubbed week - what the jar is filled to. */
  displayBalanceMinor: number;
  /** Fill fraction at the scrubbed week, 0..1. */
  displayProgress: number;
  /** Fill fraction right now, drawn as the ghost line while scrubbing. */
  nowProgress: number;
  /** True once the scrubber has moved off "now". */
  isScrubbing: boolean;
  /** Calendar date the goal is met, or null when it never is. */
  goalDate: Date | null;
  /** Whether the setup screen has enough to open the jar. */
  canOpenJar: boolean;

  /* actions */
  pickPreset: (preset: GoalPreset) => void;
  startCustom: () => void;
  setName: (name: string) => void;
  setTargetMinor: (minor: number) => void;
  setCurrentMinor: (minor: number) => void;
  setWeeklyMinor: (minor: number) => void;
  toggleBoost: (id: string) => void;
  scrubTo: (week: number) => void;
  finishIntro: () => void;
  openJar: () => void;
  openReport: () => void;
  backToJar: () => void;
  reset: () => void;
  dismissMilestone: () => void;
  setSound: (on: boolean) => void;
}

/**
 * `now` is injected so the projected date is deterministic in tests and stable
 * across re-renders. Callers pass a value that changes at most once per mount.
 */
export function useSavingsGoalGame(now: Date = new Date()): SavingsGoalGame {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const boosts = useMemo(() => activeBoosts(BOOSTS, state.activeBoostIds), [state.activeBoostIds]);

  /**
   * `timelineWeeks` is 0 on purpose.
   *
   * The Goal Jar has no deadline: the player says how much they can put in, and
   * the tool answers with how long that takes. `requiredWeekly` only means
   * something when a target date exists. This previously passed `scrubWeek`,
   * which made the printable plan report "you would need to save $33 per week"
   * beside a weekly contribution of $34 - two numbers that disagreed because
   * one of them was derived from wherever the preview slider happened to be
   * parked. With no timeline, `requiredWeekly` is 0 and is not shown.
   */
  const plan = useMemo(() => buildPlan(state.goal, boosts, 0), [state.goal, boosts]);

  const displayBalanceMinor = useMemo(
    () => displayBalanceAtWeek(state.goal, boosts, state.scrubWeek),
    [state.goal, boosts, state.scrubWeek],
  );

  const displayProgress = useMemo(
    () => progressAt(state.goal, displayBalanceMinor),
    [state.goal, displayBalanceMinor],
  );

  const nowProgress = useMemo(
    () => progressAt(state.goal, balanceAtWeek(state.goal, boosts, 0)),
    [state.goal, boosts],
  );

  const goalDate = useMemo(() => targetDate(plan.weeksToGoal, now), [plan.weeksToGoal, now]);

  // The ghost is a three-second window, not a permanent comparison.
  useEffect(() => {
    if (state.ghostWeeks === null) return;
    const t = setTimeout(() => dispatch({ type: 'clearGhost' }), GHOST_MS);
    return () => clearTimeout(t);
  }, [state.ghostWeeks]);

  const pickPreset = useCallback((preset: GoalPreset) => dispatch({ type: 'pickPreset', preset }), []);
  const startCustom = useCallback(() => dispatch({ type: 'startCustom' }), []);
  const setName = useCallback((name: string) => dispatch({ type: 'setName', name }), []);
  const setTargetMinor = useCallback((minor: number) => dispatch({ type: 'setTargetMinor', minor }), []);
  const setCurrentMinor = useCallback((minor: number) => dispatch({ type: 'setCurrentMinor', minor }), []);
  const setWeeklyMinor = useCallback((minor: number) => dispatch({ type: 'setWeeklyMinor', minor }), []);
  const toggleBoost = useCallback((id: string) => dispatch({ type: 'toggleBoost', id }), []);
  const scrubTo = useCallback((week: number) => dispatch({ type: 'scrubTo', week }), []);
  const finishIntro = useCallback(() => dispatch({ type: 'goto', phase: 'setup' }), []);
  const openJar = useCallback(() => dispatch({ type: 'goto', phase: 'jar' }), []);
  const openReport = useCallback(() => dispatch({ type: 'goto', phase: 'report' }), []);
  const backToJar = useCallback(() => dispatch({ type: 'goto', phase: 'jar' }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);
  const dismissMilestone = useCallback(() => dispatch({ type: 'dismissMilestone' }), []);
  const setSound = useCallback((on: boolean) => dispatch({ type: 'setSound', on }), []);

  return {
    phase: state.phase,
    goal: state.goal,
    presetId: state.presetId,
    activeBoostIds: state.activeBoostIds,
    boosts,
    scrubWeek: state.scrubWeek,
    ghostWeeks: state.ghostWeeks,
    milestone: state.milestone,
    soundOn: state.soundOn,

    plan,
    displayBalanceMinor,
    displayProgress,
    nowProgress,
    isScrubbing: state.scrubWeek > 0,
    goalDate,
    canOpenJar: state.goal.targetMinor > 0,

    finishIntro,
    pickPreset,
    startCustom,
    setName,
    setTargetMinor,
    setCurrentMinor,
    setWeeklyMinor,
    toggleBoost,
    scrubTo,
    openJar,
    openReport,
    backToJar,
    reset,
    dismissMilestone,
    setSound,
  };
}

export { CUSTOM as CUSTOM_PRESET, GOAL_PRESETS };
