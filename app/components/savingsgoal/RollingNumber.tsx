'use client';

/**
 * Goal Jar - odometer number
 * ---------------------------
 * Rolls digit-by-digit when the value changes: 400ms on the pop curve, one
 * column per digit, each column a stack of 0-9 translated into place.
 *
 * Under `prefers-reduced-motion: reduce` the columns snap to their final
 * position with no transition. The number stays fully legible either way -
 * motion is decoration here, never the thing that carries the value.
 *
 * A non-numeric value (the em dash for "never") renders as plain text.
 */

import { memo } from 'react';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface RollingNumberProps {
  /** The number to show, or a string like "—" to render verbatim. */
  value: number | string;
  /** Pins the roll to its final state. */
  reduced: boolean;
  className?: string;
}

function Column({ digit, reduced, index }: { digit: string; reduced: boolean; index: number }) {
  const n = DIGITS.indexOf(digit);

  // Not a digit (a comma, a minus): render it inline, no column.
  if (n < 0) {
    return <span aria-hidden="true">{digit}</span>;
  }

  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-block', height: '1em', overflow: 'hidden', verticalAlign: 'bottom' }}
    >
      <span
        style={{
          display: 'block',
          transform: `translateY(-${n}em)`,
          transition: reduced ? 'none' : 'transform 400ms cubic-bezier(.2,1.3,.4,1)',
          // Later digits trail slightly, so the roll reads left-to-right.
          transitionDelay: reduced ? '0ms' : `${index * 40}ms`,
        }}
      >
        {DIGITS.map((d) => (
          <span key={d} style={{ display: 'block', height: '1em', lineHeight: '1em' }}>
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function RollingNumberImpl({ value, reduced, className }: RollingNumberProps) {
  const text = typeof value === 'number' ? String(value) : value;
  const rollable = typeof value === 'number' && Number.isFinite(value);

  if (!rollable) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'flex-end' }}>
      {/* The real value, for assistive tech and for copy/paste. */}
      <span
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      {/* Keyed by position, not by digit: the column must persist across a
          change so its transform can transition rather than remount. */}
      {text.split('').map((d, i) => (
        <Column key={i} digit={d} reduced={reduced} index={i} />
      ))}
    </span>
  );
}

export default memo(RollingNumberImpl);
