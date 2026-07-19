'use client';

/**
 * Goal Jar - milestone badge
 * ---------------------------
 * Pops near the ring when the projection crosses 25/50/75/100%. 700ms in,
 * dismissible, never a modal, never blocking - the player can keep dragging
 * straight through it.
 *
 * Celebration is short by design (`design.md`: "keep celebrations short and
 * dismissible"), and it is text plus motion, never motion alone.
 */

import { useEffect } from 'react';
import { COPY } from '@/app/lib/savingsgoal/content';
import type { Milestone } from '@/app/lib/savingsgoal/types';
import { IconClose } from './chrome';

/** How long a badge sits before retiring itself. */
const DWELL_MS = 2_600;

interface MilestoneBadgeProps {
  milestone: Milestone | null;
  reduced: boolean;
  onDismiss: () => void;
}

export default function MilestoneBadge({ milestone, reduced, onDismiss }: MilestoneBadgeProps) {
  useEffect(() => {
    if (milestone === null) return;
    const t = setTimeout(onDismiss, DWELL_MS);
    return () => clearTimeout(t);
  }, [milestone, onDismiss]);

  if (milestone === null) return null;

  const label = COPY[`milestone.${milestone}` as const];

  return (
    <div
      className={`sgj-milestone${reduced ? '' : ' sgj-milestone--pop'}`}
      // Not a live region: the answer's own aria-live already announces the
      // numbers, and two regions competing during a drag is worse than one.
      role="status"
    >
      <span aria-hidden="true">🎉</span>
      <span className="font-display text-[13px] font-semibold">{label}</span>
      <button type="button" className="sgj-milestone__close" onClick={onDismiss} aria-label="Dismiss">
        <IconClose size={14} />
      </button>
    </div>
  );
}
