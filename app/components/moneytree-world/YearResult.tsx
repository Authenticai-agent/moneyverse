'use client';

/**
 * YearResult - the end-of-year education popup for the garden world.
 *
 * When the player grows the year, the store captures the frozen engine's full
 * TurnResult. This overlay presents it with the SAME proven EventCard the
 * original 2D game used - the real per-bucket returns, the year's insight
 * (event copy or a calm-year explanation), the selected coach's in-character
 * reaction and advice-for-next-year, and a rotating Money Lesson. All of that
 * copy comes straight from the frozen lib (yearInsight / eventReactionLine /
 * coachAdviceLine / moneyLessonLine); this component only decides when to show
 * it and which coach voice to use. Dismissing it just clears the pending
 * result - the year has already advanced in the store.
 *
 * This is a self-contained endless demo loop, so there is no fixed final year;
 * `isFinal` is always false ("Next year ▶").
 */

import EventCard from '@/app/components/moneytree/EventCard';
import { mascotById } from '@/app/lib/moneytree/mascots';
import { useWorldStore } from './useWorldStore';

export function YearResult() {
  const result = useWorldStore((s) => s.lastResult);
  const coachId = useWorldStore((s) => s.selectedCoachId);
  const dismissResult = useWorldStore((s) => s.dismissResult);

  if (!result) return null;

  // EventCard fills its nearest positioned ancestor with a z-[9] backdrop, but
  // the GardenControls bar sits at z-index 15 - so wrap the card in a higher
  // stacking context to guarantee the whole modal (including the "Next year"
  // button) paints above the control bar.
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
      <EventCard result={result} onContinue={dismissResult} isFinal={false} mascot={mascotById(coachId)} />
    </div>
  );
}
