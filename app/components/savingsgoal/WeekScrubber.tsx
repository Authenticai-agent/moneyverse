'use client';

/**
 * Goal Jar - the week scrubber
 * -----------------------------
 * A timeline from today out past the goal. Dragging it moves the jar level to
 * that week and swaps the answer to "Week 7 — you would have $92", while a
 * ghost line stays pinned at today's savings.
 *
 * The resting state is deliberately written as an invitation ("Peek ahead -
 * drag to see what any week looks like") rather than as a result. The first
 * version read "Look ahead to week 0 / Right now you have $55", which states
 * two true facts and gives no reason to touch anything - it looked like a
 * broken readout rather than a control.
 *
 * Native range input, so arrows/Home/End work; "Back to today" is the explicit
 * non-drag way to return.
 */

import { displayBalanceAtWeek, formatMinor } from '@/app/lib/savingsgoal/engine';
import { COPY, MAX_SCRUB_WEEKS } from '@/app/lib/savingsgoal/content';
import type { Boost, Goal } from '@/app/lib/savingsgoal/types';
import { CARD, IconReset, TEXT } from './chrome';

interface WeekScrubberProps {
  goal: Goal;
  boosts: readonly Boost[];
  week: number;
  /** Weeks to the goal, used to size the track. `Infinity` falls back to the cap. */
  weeksToGoal: number;
  onScrub: (week: number) => void;
}

export default function WeekScrubber({ goal, boosts, week, weeksToGoal, onScrub }: WeekScrubberProps) {
  // Headroom past the goal so the last week is not jammed against the end stop.
  // Falls back to the cap when the goal is never reached, which keeps the
  // control usable rather than disabling it.
  const max = Number.isFinite(weeksToGoal)
    ? Math.max(4, Math.min(MAX_SCRUB_WEEKS, Math.ceil(weeksToGoal * 1.15)))
    : MAX_SCRUB_WEEKS;

  const clamped = Math.min(week, max);
  const atToday = clamped === 0;
  const balance = displayBalanceAtWeek(goal, boosts, clamped);
  const pct = (clamped / max) * 100;

  return (
    <section style={CARD} className="p-4" aria-labelledby="sgj-scrub-label">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="sgj-scrub-label" className="font-display text-[15px] font-semibold" style={{ color: '#1C1F2E' }}>
          {COPY['jar.scrubber.title']}
          <span className="ml-2 text-[12.5px] font-medium" style={{ color: TEXT.muted }}>
            {COPY['jar.scrubber.restHint']}
          </span>
        </h3>

        <p
          className="font-display text-[15px] font-semibold"
          style={{ color: atToday ? TEXT.body : '#6B4EFF' }}
        >
          {atToday
            ? COPY['jar.scrubber.today']({ amount: formatMinor(balance) })
            : COPY['jar.scrubber.at']({ week: clamped, amount: formatMinor(balance) })}
        </p>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          className="sgj-step"
          onClick={() => onScrub(0)}
          disabled={atToday}
          aria-label={COPY['jar.scrubber.now']}
        >
          <IconReset />
        </button>
        <input
          className="sgj-range sgj-range--slim w-full"
          type="range"
          min={0}
          max={max}
          step={1}
          value={clamped}
          onChange={(e) => onScrub(Number(e.target.value))}
          aria-label={COPY['jar.scrubber.aria']}
          aria-valuetext={
            atToday ? `Today. ${formatMinor(balance)}` : `Week ${clamped}. ${formatMinor(balance)}`
          }
          style={{ '--sgj-pct': `${pct}%` } as React.CSSProperties}
        />
      </div>

      <div className="mt-1 flex justify-between text-[11px]" style={{ color: TEXT.faint }}>
        <span>Today</span>
        <span>Week {max}</span>
      </div>
    </section>
  );
}
