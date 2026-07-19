'use client';

/**
 * Goal Jar - report
 * ------------------
 * A headline, then the poster.
 *
 * This screen used to restate the plan three times: a stats strip, a list of
 * every boost picked, a week-by-week table, and then the certificate carrying
 * all of it again. The certificate is the artefact people actually keep, so the
 * duplicates are gone and what remains is the answer at a glance plus the sheet
 * itself.
 *
 * Only the certificate prints. Everything else here is screen furniture and is
 * marked `print:hidden`; the print control lives inside the certificate,
 * because the certificate is the thing being printed.
 *
 * The parent email field is carried over as-is, unwired, pending the decision
 * logged in `docs/project/open-questions.md`.
 */

import { useState } from 'react';
import { formatMinor, formatTargetDate, formatWeeks } from '@/app/lib/savingsgoal/engine';
import { COPY, GOAL_PRESETS } from '@/app/lib/savingsgoal/content';
import PlanCertificate from './PlanCertificate';
import type { Boost, Goal, Plan } from '@/app/lib/savingsgoal/types';
import { CARD, IconBack, TEXT } from './chrome';
import SavingsGoalShareCard from './SavingsGoalShareCard';

interface ReportScreenProps {
  goal: Goal;
  boosts: readonly Boost[];
  plan: Plan;
  goalDate: Date | null;
  /** Which preset was chosen, for the certificate's goal art. */
  presetId: string | null;
  onBack: () => void;
}

export default function ReportScreen({ goal, boosts, plan, goalDate, presetId, onBack }: ReportScreenProps) {
  const [email, setEmail] = useState('');
  const goalEmoji = GOAL_PRESETS.find((p) => p.id === presetId)?.emoji ?? '✨';

  const weeks = plan.weeksToGoal;
  const reachable = Number.isFinite(weeks);

  return (
    <div className="w-full max-w-3xl">
      <button type="button" className="sgj-ghost-btn mb-4 print:hidden" onClick={onBack}>
        <IconBack />
        {COPY['report.back']}
      </button>

      <h2
        className="font-display text-[30px] font-semibold leading-tight print:hidden sm:text-[36px]"
        style={{ color: '#1C1F2E' }}
      >
        {COPY['report.title']}
      </h2>
      <p className="mt-1 text-[15px] print:hidden" style={{ color: TEXT.body }}>
        {goal.name || 'My savings goal'} · {formatMinor(goal.targetMinor)}
      </p>

      {/* The answer at a glance, straight under the title - it is what someone
          opening this screen is looking for, so it should not sit below a
          poster they have to scroll past. */}
      <div style={CARD} className="mt-4 grid gap-3 p-5 print:hidden sm:grid-cols-3">
        <div>
          <p className="text-[12px]" style={{ color: TEXT.muted }}>
            Time to go
          </p>
          <p className="font-display text-[26px] font-semibold text-mv-primary">{formatWeeks(weeks)}</p>
        </div>
        <div>
          <p className="text-[12px]" style={{ color: TEXT.muted }}>
            Around
          </p>
          <p className="font-display text-[26px] font-semibold" style={{ color: '#1C1F2E' }}>
            {formatTargetDate(goalDate)}
          </p>
        </div>
        <div>
          <p className="text-[12px]" style={{ color: TEXT.muted }}>
            Each week
          </p>
          <p className="font-display text-[26px] font-semibold" style={{ color: '#1C1F2E' }}>
            {formatMinor(plan.recurringWeeklyMinor)}
          </p>
        </div>
      </div>

      {!reachable && (
        <p className="mt-3 text-[14px] print:hidden" style={{ color: TEXT.body }}>
          {COPY['jar.answer.noPlan']}
        </p>
      )}

      {/* The poster. The only thing that prints, and the only place the plan is
          stated in full - the boost list and the week table that used to follow
          it were the same data a third time. */}
      <div className="mt-5">
        <PlanCertificate goal={goal} boosts={boosts} plan={plan} goalDate={goalDate} emoji={goalEmoji} />
      </div>

      {/* -------------------------- parent email (as-is) --------------------- */}

      <div style={CARD} className="mt-4 p-5 print:hidden">
        <label htmlFor="sgj-email" className="block text-[13px] font-semibold" style={{ color: TEXT.strong }}>
          Parent email (optional)
        </label>
        <input
          id="sgj-email"
          type="email"
          className="sgj-input mt-1 w-full"
          value={email}
          placeholder="parent@example.com"
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="mt-1 text-[12px]" style={{ color: TEXT.muted }}>
          An email to send a printable savings plan to a grown-up.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <SavingsGoalShareCard weeks={formatWeeks(weeks)} />
      </div>
    </div>
  );
}
