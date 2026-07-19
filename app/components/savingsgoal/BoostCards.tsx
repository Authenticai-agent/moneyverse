'use client';

/**
 * Goal Jar - boost cards
 * -----------------------
 * The tradeoff mechanic, in five labelled groups: three tiers of chores, a
 * windfall row, and the spending row.
 *
 * The spending group is not a warning list. It carries no red, no alert icon
 * and no cautionary copy, because the whole point is that the child adds one
 * and reads what it costs in weeks. `copy.md` forbids shaming a child, and a
 * tool that editorialises about what a nine-year-old wants to buy would be
 * doing exactly that. The number does the teaching.
 *
 * Real `<button aria-pressed>` elements, so toggle state is announced and the
 * whole hand is keyboard-reachable. On small screens each group becomes its own
 * horizontal scroll-snap strip.
 */

import { formatSignedMinor } from '@/app/lib/savingsgoal/engine';
import { BOOST_GROUPS, COPY } from '@/app/lib/savingsgoal/content';
import type { Boost } from '@/app/lib/savingsgoal/types';
import { IconCheck, IconPlus, TEXT } from './chrome';

interface BoostCardsProps {
  activeIds: readonly string[];
  onToggle: (id: string) => void;
}

function BoostCard({ boost, on, onToggle }: { boost: Boost; on: boolean; onToggle: (id: string) => void }) {
  const cadence = boost.cadence === 'weekly' ? COPY['jar.boosts.perWeek'] : COPY['jar.boosts.once'];

  return (
    <li className="sgj-hand__item">
      <button
        type="button"
        className={`sgj-boost${on ? ' sgj-boost--on' : ''}`}
        aria-pressed={on}
        onClick={() => onToggle(boost.id)}
        aria-label={`${boost.label}. ${formatSignedMinor(boost.amountMinor)} ${cadence}.`}
      >
        <span className="flex items-start justify-between gap-2">
          <span aria-hidden="true" className="text-[20px] leading-none">
            {boost.emoji}
          </span>
          <span className={`sgj-boost__mark${on ? ' sgj-boost__mark--on' : ''}`} aria-hidden="true">
            {on ? <IconCheck size={13} /> : <IconPlus size={13} />}
          </span>
        </span>

        <span className="mt-1.5 block text-[12.5px] font-semibold leading-[1.3]" style={{ color: '#1C1F2E' }}>
          {boost.label}
        </span>

        <span className="mt-auto block pt-1.5 font-display text-[15px] font-semibold text-mv-primary">
          {formatSignedMinor(boost.amountMinor)}{' '}
          <span className="text-[11px] font-medium" style={{ color: TEXT.muted }}>
            {cadence}
          </span>
        </span>

        {/* The toggle state in words, not only as a colour or a tick. */}
        <span className="mt-0.5 block text-[11px]" style={{ color: on ? TEXT.success : TEXT.faint }}>
          {on ? COPY['jar.boosts.added'] : COPY['jar.boosts.add']}
        </span>
      </button>
    </li>
  );
}

export default function BoostCards({ activeIds, onToggle }: BoostCardsProps) {
  return (
    <section aria-labelledby="sgj-boosts-label">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id="sgj-boosts-label" className="font-display text-[17px] font-semibold" style={{ color: '#1C1F2E' }}>
          {COPY['jar.boosts.title']}
        </h3>
        <p className="text-[12px]" style={{ color: TEXT.muted }}>
          {COPY['jar.boosts.hint']} {COPY['jar.boosts.illustrative']}
        </p>
      </div>

      {BOOST_GROUPS.map((group) => (
        <div key={group.id} className="mt-4">
          <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h4 className="font-display text-[14px] font-semibold" style={{ color: TEXT.strong }}>
              {group.title}
            </h4>
            <p className="text-[12px]" style={{ color: TEXT.muted }}>
              {group.hint}
            </p>
          </div>

          <ul className="sgj-hand">
            {group.boosts.map((boost) => (
              <BoostCard
                key={boost.id}
                boost={boost}
                on={activeIds.includes(boost.id)}
                onToggle={onToggle}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
