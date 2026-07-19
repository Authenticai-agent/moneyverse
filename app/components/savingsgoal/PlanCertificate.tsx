'use client';

/**
 * Goal Jar - the plan certificate
 * --------------------------------
 * The thing that leaves the screen.
 *
 * A savings plan a child reads once and closes has done nothing. This is built
 * to be printed, signed, and stuck on a fridge, so it is designed around one
 * idea: **the paper has a job to do all week**. The tracker is a row of empty
 * circles the child colours in with a real pen every time they save, and the
 * number under each one is what they will have by then. That is the whole
 * mechanism - a plan you touch beats a plan you read.
 *
 * The signatures make it a promise between two people rather than a printout.
 * Both name fields are optional and can be left blank to sign by hand.
 *
 * ## Privacy
 *
 * The names typed here are the only free text a child enters that appears on a
 * shareable artefact. They never leave the browser, are never sent anywhere,
 * and are never included in the share text (ADR-007 - the share card describes
 * the tool, never the child).
 *
 * They ARE held in `sessionStorage` so a refresh before printing does not wipe
 * a half-signed contract. That is a deliberate, logged exception to the "no
 * persistence of child input" rule in the build spec - see
 * `docs/project/open-questions.md`. The scope is kept as small as it can be:
 * session storage rather than local, so it dies with the tab; three short
 * strings and nothing else; length-capped; and every read is defensive, because
 * storage can be disabled, full, or hold junk from another origin's bug.
 */

import { useEffect, useState } from 'react';
import { displayBalanceAtWeek, formatMinor, formatSignedMinor, formatTargetDate, formatWeeks } from '@/app/lib/savingsgoal/engine';
import { COPY } from '@/app/lib/savingsgoal/content';
import type { Boost, Goal, Plan } from '@/app/lib/savingsgoal/types';
import { IconPrint } from './chrome';

/**
 * Most circles we will print before thinning them out.
 *
 * Held at 30 rather than 40 for height: on A4 the tracker fits about 16 circles
 * per row, so 40 is three rows where 30 is two. The extra row was part of what
 * pushed a fully-loaded sheet onto a second page, and a tracker striding every
 * 7 weeks instead of every 5 loses nothing a child will notice.
 */
const MAX_DOTS = 30;

/** Tab-scoped, so a shared family computer does not keep a child's name. */
const SIGN_KEY = 'moneyverse:savingsgoal:signatures';

/** Bounds what a stray paste can put into storage, and keeps the line legible. */
const NAME_MAX = 40;

interface Signatures {
  kid: string;
  adult: string;
  date: string;
}

const EMPTY_SIGNATURES: Signatures = { kid: '', adult: '', date: '' };

/** Coerce anything out of storage into a short string. Never trusts the value. */
function safeString(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, NAME_MAX) : '';
}

/**
 * Read the saved signatures.
 *
 * Everything here can fail in the wild - storage disabled in private mode,
 * quota exceeded, or a malformed blob left by an older build - and none of it
 * is worth breaking a savings plan over, so every failure returns empty.
 */
function readSignatures(): Signatures {
  if (typeof window === 'undefined') return EMPTY_SIGNATURES;
  try {
    const raw = window.sessionStorage.getItem(SIGN_KEY);
    if (!raw) return EMPTY_SIGNATURES;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return EMPTY_SIGNATURES;
    const rec = parsed as Record<string, unknown>;
    return { kid: safeString(rec.kid), adult: safeString(rec.adult), date: safeString(rec.date) };
  } catch {
    return EMPTY_SIGNATURES;
  }
}

function writeSignatures(signatures: Signatures): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SIGN_KEY, JSON.stringify(signatures));
  } catch {
    /* storage unavailable or full - the contract still works, it just forgets */
  }
}

interface PlanCertificateProps {
  goal: Goal;
  boosts: readonly Boost[];
  plan: Plan;
  goalDate: Date | null;
  /** Decorative art for the goal, from the preset that was picked. */
  emoji: string;
}

/** A rosette seal. Hand-drawn SVG - no icon package, and it prints cleanly. */
function Seal({ emoji }: { emoji: string }) {
  const points = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `${50 + Math.cos(a) * 46},${50 + Math.sin(a) * 46}`;
  }).join(' ');

  return (
    <div className="sgj-cert__seal" aria-hidden="true">
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <polygon points={points} fill="#FFD84D" />
        <circle cx="50" cy="50" r="38" fill="#FFF3CF" stroke="#6B4EFF" strokeWidth="2.5" />
      </svg>
      <span className="sgj-cert__seal-emoji">{emoji}</span>
    </div>
  );
}

export default function PlanCertificate({ goal, boosts, plan, goalDate, emoji }: PlanCertificateProps) {
  /*
   * Starts empty rather than reading storage in the initialiser: the server
   * renders this too, and `sessionStorage` does not exist there, so seeding
   * from it would desynchronise hydration.
   */
  const [signatures, setSignatures] = useState<Signatures>(EMPTY_SIGNATURES);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    setSignatures(readSignatures());
    setRestored(true);
  }, []);

  /*
   * `restored` is load-bearing, not a formality.
   *
   * Both effects run on mount, in source order, before either state update has
   * been applied. Without the guard this one would fire while `signatures` was
   * still the empty initial value and write that over whatever was saved -
   * wiping the names it exists to protect, every single mount.
   */
  useEffect(() => {
    if (!restored) return;
    writeSignatures(signatures);
  }, [restored, signatures]);

  const setField = (field: keyof Signatures) => (value: string) =>
    setSignatures((prev) => ({ ...prev, [field]: value.slice(0, NAME_MAX) }));

  const weeks = plan.weeksToGoal;
  const reachable = Number.isFinite(weeks) && weeks > 0;

  /**
   * How many columns the jobs list runs in.
   *
   * A player who ticks every card has 26 jobs, and one per line is roughly
   * 520px of list on its own - which is what pushes the sheet onto a second
   * page. Thresholds rather than a fixed count, because a two-job plan split
   * across three columns reads as a mistake.
   *
   * Applied as a data attribute rather than an inline `columnCount`, because an
   * inline style would beat the print stylesheet and leave no way to re-flow it
   * for paper.
   */
  const jobColumns = boosts.length > 14 ? 3 : boosts.length > 6 ? 2 : 1;

  // Thin the circles out for a long plan so they stay big enough to colour in.
  const stride = reachable ? Math.max(1, Math.ceil(weeks / MAX_DOTS)) : 1;
  const dots: number[] = [];
  if (reachable) {
    for (let w = stride; w < weeks; w += stride) dots.push(w);
    dots.push(weeks);
  }

  return (
    <section className="sgj-cert" aria-labelledby="sgj-cert-title">
      <div className="sgj-cert__inner">
        <Seal emoji={emoji} />

        <p className="sgj-cert__eyebrow">{COPY['cert.eyebrow']}</p>
        <h3 id="sgj-cert-title" className="sgj-cert__title">
          {COPY['cert.title']}
        </h3>

        <p className="sgj-cert__savingfor">{COPY['cert.savingFor']}</p>
        <p className="sgj-cert__goal">
          {goal.name || 'my goal'} <span className="sgj-cert__goal-amt">{formatMinor(goal.targetMinor)}</span>
        </p>

        {/* ------------------------------ the stats ------------------------------ */}

        <div className="sgj-cert__stats">
          <div>
            <span className="sgj-cert__stat-label">{COPY['cert.statWeekly']}</span>
            <span className="sgj-cert__stat-value">{formatMinor(plan.recurringWeeklyMinor)}</span>
          </div>
          <div>
            <span className="sgj-cert__stat-label">{COPY['cert.statWeeks']}</span>
            <span className="sgj-cert__stat-value">{formatWeeks(weeks)}</span>
          </div>
          <div>
            <span className="sgj-cert__stat-label">{COPY['cert.statDate']}</span>
            <span className="sgj-cert__stat-value">{formatTargetDate(goalDate)}</span>
          </div>
        </div>

        {/* ------------------------------ the tracker ---------------------------- */}

        <div className="sgj-cert__block">
          <h4 className="sgj-cert__h4">{COPY['cert.tracker.title']}</h4>
          {reachable ? (
            <>
              <ol className="sgj-cert__dots">
                {dots.map((w) => (
                  <li key={w} className="sgj-cert__dot">
                    <span className="sgj-cert__dot-ring" aria-hidden="true">
                      {w}
                    </span>
                    <span className="sgj-cert__dot-amt">
                      {formatMinor(displayBalanceAtWeek(goal, boosts, w))}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="sgj-cert__note">
                {COPY['cert.tracker.hint']} {stride > 1 && COPY['cert.tracker.every']({ stride })}
              </p>
            </>
          ) : (
            <p className="sgj-cert__note">{COPY['cert.tracker.none']}</p>
          )}
        </div>

        {/* -------------------------------- my jobs ------------------------------ */}

        <div className="sgj-cert__block">
          <h4 className="sgj-cert__h4">{COPY['cert.jobs.title']}</h4>
          {boosts.length === 0 ? (
            <p className="sgj-cert__note">{COPY['cert.jobs.none']}</p>
          ) : (
            <ul className="sgj-cert__jobs" data-cols={jobColumns}>
              {boosts.map((b) => (
                <li key={b.id}>
                  <span className="sgj-cert__tick" aria-hidden="true" />
                  <span className="sgj-cert__job-label">
                    <span aria-hidden="true" className="sgj-cert__job-emoji">
                      {b.emoji}
                    </span>
                    {b.label}
                  </span>
                  <span className="sgj-cert__job-amt">{formatSignedMinor(b.amountMinor)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ------------------------------- promises ------------------------------ */}

        <div className="sgj-cert__promises">
          <div>
            <h4 className="sgj-cert__h4">{COPY['cert.promiseMine']}</h4>
            <ul className="sgj-cert__promise-list">
              {COPY['cert.promiseMineItems'].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="sgj-cert__h4">{COPY['cert.promiseTheirs']}</h4>
            <ul className="sgj-cert__promise-list">
              {COPY['cert.promiseTheirsItems'].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* ------------------------------ signatures ----------------------------- */}

        <div className="sgj-cert__signs">
          <div className="sgj-cert__sign">
            <input
              className="sgj-cert__sign-input"
              value={signatures.kid}
              onChange={(e) => setField('kid')(e.target.value)}
              placeholder={COPY['cert.namePlaceholder']}
              aria-label={COPY['cert.signKid']}
              autoComplete="off"
              maxLength={NAME_MAX}
            />
            <span className="sgj-cert__sign-label">{COPY['cert.signKid']}</span>
          </div>
          <div className="sgj-cert__sign">
            <input
              className="sgj-cert__sign-input"
              value={signatures.adult}
              onChange={(e) => setField('adult')(e.target.value)}
              placeholder={COPY['cert.adultPlaceholder']}
              aria-label={COPY['cert.signAdult']}
              autoComplete="off"
              maxLength={NAME_MAX}
            />
            <span className="sgj-cert__sign-label">{COPY['cert.signAdult']}</span>
          </div>
          <div className="sgj-cert__sign sgj-cert__sign--date">
            <input
              className="sgj-cert__sign-input"
              value={signatures.date}
              onChange={(e) => setField('date')(e.target.value)}
              placeholder={COPY['cert.datePlaceholder']}
              aria-label={COPY['cert.signDate']}
              autoComplete="off"
              maxLength={NAME_MAX}
            />
            <span className="sgj-cert__sign-label">{COPY['cert.signDate']}</span>
          </div>
        </div>

        <p className="sgj-cert__hint">{COPY['cert.signHint']}</p>

        {/* The honest small print. It travels with the sheet, because the sheet
            is the only thing that prints and a contract should carry its own
            caveat rather than leave it behind on a screen. */}
        <p className="sgj-cert__fineprint">{COPY['report.disclaimer']}</p>

        <p className="sgj-cert__footer" aria-hidden="true">
          ✂ {COPY['cert.footer']}
        </p>
      </div>

      {/* The print control belongs to the poster, not to a toolbar somewhere
          else on the page - this is the one thing on the screen that is meant
          to become paper. Sits outside the framed sheet and is itself dropped
          from the printout. */}
      <div className="sgj-cert__actions print:hidden">
        <button type="button" className="sgj-cta" onClick={() => window.print()}>
          <IconPrint />
          {COPY['report.print']}
        </button>
      </div>
    </section>
  );
}
