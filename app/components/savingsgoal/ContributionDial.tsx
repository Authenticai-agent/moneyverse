'use client';

/**
 * Goal Jar - the contribution dial
 * ---------------------------------
 * One control: "Each week I add $___". A fat range slider, plus a stepper that
 * duplicates it exactly, so the drag is never the only way in. The range input
 * is a native control, so arrow keys, Home/End, and screen-reader value
 * announcements all work without being reimplemented.
 *
 * Every button is 44x44 minimum with 8px between, per the child-facing rules in
 * `design.md`.
 */

import { formatMinor } from '@/app/lib/savingsgoal/engine';
import { COPY, WEEKLY_MAX_MINOR, WEEKLY_MIN_MINOR, WEEKLY_STEP_MINOR } from '@/app/lib/savingsgoal/content';
import { CARD, IconMinus, IconPlus, TEXT } from './chrome';

interface ContributionDialProps {
  valueMinor: number;
  onChange: (minor: number) => void;
}

export default function ContributionDial({ valueMinor, onChange }: ContributionDialProps) {
  const clamp = (v: number) => Math.max(WEEKLY_MIN_MINOR, Math.min(WEEKLY_MAX_MINOR, v));
  const pct = ((valueMinor - WEEKLY_MIN_MINOR) / (WEEKLY_MAX_MINOR - WEEKLY_MIN_MINOR)) * 100;

  return (
    <section style={CARD} className="p-4" aria-labelledby="sgj-dial-label">
      <h3 id="sgj-dial-label" className="font-display text-[15px] font-semibold" style={{ color: '#1C1F2E' }}>
        {COPY['jar.dial.label']}
      </h3>

      <p className="font-display mt-1 text-[34px] font-semibold leading-none text-mv-primary">
        {formatMinor(valueMinor)}
      </p>

      <input
        id="sgj-weekly"
        className="sgj-range mt-3 w-full"
        type="range"
        min={WEEKLY_MIN_MINOR}
        max={WEEKLY_MAX_MINOR}
        step={WEEKLY_STEP_MINOR}
        value={valueMinor}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-label={COPY['jar.dial.label']}
        aria-valuetext={`${formatMinor(valueMinor)} each week`}
        style={{ '--sgj-pct': `${pct}%` } as React.CSSProperties}
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="sgj-step"
          onClick={() => onChange(clamp(valueMinor - WEEKLY_STEP_MINOR))}
          disabled={valueMinor <= WEEKLY_MIN_MINOR}
          aria-label={`Add one dollar less each week. Currently ${formatMinor(valueMinor)}.`}
        >
          <IconMinus />
        </button>
        <button
          type="button"
          className="sgj-step"
          onClick={() => onChange(clamp(valueMinor + WEEKLY_STEP_MINOR))}
          disabled={valueMinor >= WEEKLY_MAX_MINOR}
          aria-label={`Add one dollar more each week. Currently ${formatMinor(valueMinor)}.`}
        >
          <IconPlus />
        </button>
        <p className="ml-1 text-[12px]" style={{ color: TEXT.muted }}>
          {COPY['jar.dial.hint']}
        </p>
      </div>
    </section>
  );
}
