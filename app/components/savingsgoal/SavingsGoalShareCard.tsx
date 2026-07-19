'use client';

/**
 * Goal Jar - share
 * -----------------
 * Text and clipboard only. No canvas export, no image, no profile.
 *
 * ADR-007 (no public child profiles) means the shared text describes **the
 * tool**, never the kid: no name, no goal name, no amount tied to a person.
 * The only variable that leaves is a duration, which identifies nobody.
 *
 * Follows the Money Tree `ReportScreen` share rather than
 * `ScamShieldShareCard`'s `alert()` - inline button feedback, SSR-guarded
 * `window`, single try/catch.
 */

import { useState } from 'react';
import { COPY } from '@/app/lib/savingsgoal/content';
import { IconCheck, IconShare } from './chrome';

interface SavingsGoalShareCardProps {
  /** Already formatted, e.g. "12 weeks". Never a raw amount. */
  weeks: string;
}

export default function SavingsGoalShareCard({ weeks }: SavingsGoalShareCardProps) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const text = COPY['share.text']({ weeks });
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'My savings plan', text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* dismissed or unavailable */
    }
  };

  return (
    <button type="button" className="sgj-ghost-btn" onClick={share}>
      {copied ? <IconCheck /> : <IconShare />}
      {copied ? COPY['share.copied'] : COPY['share.button']}
    </button>
  );
}
