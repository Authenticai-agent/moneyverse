'use client';

/**
 * Goal Jar - orchestrator
 * ------------------------
 * A kid picks something they want, a jar appears, and every choice they make
 * changes the answer to "when do I get it?" in front of them. The whole tool is
 * one question with a live answer.
 *
 * Thin by design, the way `MoneyTreeGame` is thin: all the math is in
 * `app/lib/savingsgoal/engine.ts`, all the copy is in `content.ts`, all the
 * state is in `useSavingsGoalGame`. This file composes screens, owns the
 * scoped stylesheet, and owns the two things that cannot live in a leaf -
 * reduced-motion detection and the single `aria-live` region.
 *
 * The jar is `PlaceholderJar`, an SVG. A WebGL version was built and then
 * removed - see `docs/project/open-questions.md`. The short version: this app
 * already opens WebGL contexts in three other components, browsers cap how many
 * exist at once, and the jar's kept being taken away - so it spent most of its
 * life rendering this same SVG, having pulled in 2.7MB of libraries to do it.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSavingsGoalGame } from '@/app/lib/savingsgoal/useSavingsGoalGame';
import { formatMinor, formatTargetDate, formatWeeks } from '@/app/lib/savingsgoal/engine';
import { COPY, CUSTOM_PRESET_ID } from '@/app/lib/savingsgoal/content';
import { setMuted, sfx } from '@/app/lib/moneytree/sound';
import BoostCards from './savingsgoal/BoostCards';
import ContributionDial from './savingsgoal/ContributionDial';
import IntroVideo from './savingsgoal/IntroVideo';
import MilestoneBadge from './savingsgoal/MilestoneBadge';
import PlaceholderJar from './savingsgoal/PlaceholderJar';
import ReportScreen from './savingsgoal/ReportScreen';
import RollingNumber from './savingsgoal/RollingNumber';
import SetupScreen from './savingsgoal/SetupScreen';
import WeekScrubber from './savingsgoal/WeekScrubber';
import { CARD, IconBack, IconSoundOff, IconSoundOn, TEXT, VisuallyHidden } from './savingsgoal/chrome';

/** Debounce on the live region, so a drag does not flood a screen reader. */
const ANNOUNCE_MS = 400;

/**
 * Mount-time only, matching the Money Tree pattern: SSR-safe, no listener, and
 * no re-render storm if the user flips the setting mid-session.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function SavingsGoalCalculator() {
  const [reduced, setReduced] = useState(false);
  /**
   * Whether the reduced-motion query has actually been answered yet.
   *
   * `reduced` resolves in an effect, so it is `false` for the first render.
   * Without this flag the intro would mount and begin fetching the clip before
   * the preference was known, and only then be torn down - which is precisely
   * the download and the frame that reduced-motion is meant to avoid. The
   * server renders the same unresolved state, so hydration matches.
   */
  const [motionResolved, setMotionResolved] = useState(false);
  useEffect(() => {
    setReduced(prefersReducedMotion());
    setMotionResolved(true);
  }, []);

  // Fixed at mount so the projected date does not drift between renders.
  const now = useMemo(() => new Date(), []);
  const game = useSavingsGoalGame(now);

  const {
    phase,
    goal,
    presetId,
    plan,
    boosts,
    activeBoostIds,
    scrubWeek,
    isScrubbing,
    displayBalanceMinor,
    displayProgress,
    nowProgress,
    goalDate,
    ghostWeeks,
    milestone,
    soundOn,
  } = game;

  const reachable = Number.isFinite(plan.weeksToGoal);

  /* ------------------------------ live region ------------------------------ */

  const [announcement, setAnnouncement] = useState('');
  const announceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answerWeeks = formatWeeks(plan.weeksToGoal);
  const answerDate = formatTargetDate(goalDate);
  const answerAmount = formatMinor(goal.targetMinor);

  const isReached = plan.reached;
  const goalPhrase = inlineGoalName(goal.name);

  useEffect(() => {
    if (phase !== 'jar') return;
    if (announceRef.current) clearTimeout(announceRef.current);
    announceRef.current = setTimeout(() => {
      setAnnouncement(
        isReached
          ? COPY['a11y.announceReached']({ goal: goalPhrase, amount: answerAmount })
          : reachable
            ? COPY['a11y.announce']({ weeks: answerWeeks, date: answerDate, amount: answerAmount })
            : COPY['a11y.announceNoPlan'],
      );
    }, ANNOUNCE_MS);
    return () => {
      if (announceRef.current) clearTimeout(announceRef.current);
    };
  }, [phase, isReached, goalPhrase, reachable, answerWeeks, answerDate, answerAmount]);

  /* ---------------------------------- sound --------------------------------- */

  /*
   * Reuses the Money Tree's Web Audio kit - no files, no new dependency.
   *
   * Two flags are in play and they are not the same thing. `soundOn` is this
   * tool's own state and starts false, because the brief requires the jar to
   * open silently however the rest of the site is set. The kit's primitives
   * additionally veto themselves against a shared `moneytree:muted` flag in
   * localStorage, so turning sound on here has to clear that too or every call
   * would be silently swallowed. The upshot is one site-wide sound preference
   * that the player controls, with a guaranteed-quiet start.
   */
  const toggleSound = () => {
    const next = !soundOn;
    game.setSound(next);
    setMuted(!next);
    // Play something immediately: a toggle that produces silence reads as broken.
    if (next) sfx.click();
  };

  /* Milestones are the one sound the brief asks for by name. */
  useEffect(() => {
    if (!soundOn || milestone === null) return;
    if (milestone === 100) sfx.newBest();
    else sfx.stageUp();
  }, [milestone, soundOn]);

  /*
   * One neutral click for every card, in both directions.
   *
   * Deliberately not a bright sound for a chore and a sad one for a purchase.
   * Scoring a child's spending choice in audio is the same judgement `copy.md`
   * forbids in words, and it would be harder to notice in review.
   */
  const toggleBoostWithSound = (id: string) => {
    game.toggleBoost(id);
    if (soundOn) sfx.click();
  };

  /* -------------------------------- screens -------------------------------- */

  /*
   * Hold the intro until the motion preference is known. One tick, and it is
   * what makes the reduced-motion branch below genuinely free: the clip is
   * never mounted and never requested.
   */
  if (phase === 'intro' && !motionResolved) {
    return <Shell reduced={false}>{null}</Shell>;
  }

  /* Reduced motion goes straight to the calculator, without ever fetching. */
  if (phase === 'intro' && reduced) {
    return (
      <Shell reduced={reduced}>
        <IntroSkipper onSkip={game.finishIntro} />
      </Shell>
    );
  }

  if (phase === 'intro') {
    return (
      <Shell reduced={reduced}>
        <IntroVideo onDone={game.finishIntro} />
      </Shell>
    );
  }

  if (phase === 'setup') {
    return (
      <Shell reduced={reduced}>
        <SetupScreen
          currentMinor={goal.currentMinor}
          customName={goal.name}
          customTargetMinor={goal.targetMinor}
          isCustom={presetId === CUSTOM_PRESET_ID || presetId === 'custom'}
          onPickPreset={game.pickPreset}
          onStartCustom={game.startCustom}
          onSetName={game.setName}
          onSetTargetMinor={game.setTargetMinor}
          onSetCurrentMinor={game.setCurrentMinor}
          onOpenJar={game.openJar}
        />
      </Shell>
    );
  }

  if (phase === 'report') {
    return (
      <Shell reduced={reduced}>
        <ReportScreen
          goal={goal}
          boosts={boosts}
          plan={plan}
          goalDate={goalDate}
          presetId={presetId}
          onBack={game.backToJar}
        />
      </Shell>
    );
  }

  /* ---------------------------------- jar ---------------------------------- */

  const jarLabel = isScrubbing
    ? `${COPY['a11y.canvasAlt']} On week ${scrubWeek} you will have ${formatMinor(displayBalanceMinor)}.`
    : `${COPY['a11y.canvasAlt']} Right now you have ${formatMinor(displayBalanceMinor)}.`;

  return (
    <Shell reduced={reduced}>
      {/* ------------------------------- header ------------------------------ */}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="sgj-ghost-btn" onClick={game.reset}>
          <IconBack />
          Pick something else
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="sgj-step"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? COPY['jar.unmute'] : COPY['jar.mute']}
          >
            {soundOn ? <IconSoundOn /> : <IconSoundOff />}
          </button>
          {/* No second "see my plan" here: the committing CTA at the foot of
              the page is where the player actually ends up after the cards, and
              two buttons doing the same thing only split attention. */}
        </div>
      </div>

      <h2 className="font-display text-[24px] font-semibold sm:text-[28px]" style={{ color: '#1C1F2E' }}>
        Saving for {goal.name || 'my goal'}
        <span className="ml-2 text-mv-primary">{formatMinor(goal.targetMinor)}</span>
      </h2>

      {/* -------------------------- dial · jar · answer ---------------------- */}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,280px)] lg:items-start">
        {/* The jar is first in the DOM so the small-screen order reads
            jar -> answer -> dial: the toy, then the payoff, then the control. */}
        <div className="relative lg:col-start-2 lg:row-start-1">
          {/*
            The jar is SVG, deliberately.

            A WebGL version was built and removed. It worked, but this app
            already creates canvases in three other places and browsers cap live
            WebGL contexts - so the jar's context was routinely taken away and
            the scene spent most of its life on this fallback anyway, having
            cost 656kB of three and 2.1MB of rapier to get there. Drawing the
            jar directly is smaller, steadier, and looks the same.

            See docs/project/open-questions.md for the full reasoning.
          */}
          <PlaceholderJar
            progress={displayProgress}
            nowProgress={nowProgress}
            showGhost={isScrubbing}
            reduced={reduced}
            label={jarLabel}
          />

          {/* The fill level in words. Rendered here rather than inside either
              jar so it exists once, in both modes - motion is never the only
              indicator of state. */}
          <p className="mt-1 text-center text-[13px] font-semibold" style={{ color: TEXT.body }}>
            {Math.round(displayProgress * 100)}% full
          </p>

          <MilestoneBadge milestone={milestone} reduced={reduced} onDismiss={game.dismissMilestone} />
          <p className="mt-1 text-center text-[12.5px]" style={{ color: TEXT.muted }}>
            {COPY['jar.caption']}
          </p>
        </div>

        <section style={CARD} className="p-5 lg:col-start-3 lg:row-start-1" aria-labelledby="sgj-answer">
          <h3 id="sgj-answer" className="text-[13px] font-semibold" style={{ color: TEXT.muted }}>
            {isScrubbing
              ? `On week ${scrubWeek} you will have`
              : plan.reached
                ? COPY['jar.answer.reachedEyebrow']
                : COPY['jar.answer.eyebrow']}
          </h3>

          {isScrubbing ? (
            <p className="font-display mt-1 text-[44px] font-semibold leading-none text-mv-primary">
              {formatMinor(displayBalanceMinor)}
            </p>
          ) : plan.reached ? (
            <>
              <p
                className="font-display mt-1 text-[34px] font-semibold leading-[1.1]"
                style={{ color: TEXT.success }}
              >
                {COPY['jar.answer.reachedHeadline']}
              </p>
              <p className="mt-1 text-[15px]" style={{ color: TEXT.body }}>
                {COPY['jar.answer.reached']}
              </p>
            </>
          ) : reachable ? (
            <>
              <p className="font-display mt-1 flex items-end gap-2 text-[44px] font-semibold leading-none text-mv-primary">
                <RollingNumber value={plan.weeksToGoal} reduced={reduced} />
                <span className="text-[22px]">{plan.weeksToGoal === 1 ? 'week' : 'weeks'}</span>
              </p>
              <p className="mt-1 text-[15px]" style={{ color: TEXT.body }}>
                {COPY['jar.answer.around']} {answerDate}
              </p>
            </>
          ) : (
            <>
              <p className="font-display mt-1 text-[44px] font-semibold leading-none" style={{ color: TEXT.faint }}>
                —
              </p>
              <p className="mt-1 text-[15px]" style={{ color: TEXT.body }}>
                {COPY['jar.answer.noPlan']}
              </p>
            </>
          )}

          {/* The previous plan, held for three seconds so a change is legible. */}
          {ghostWeeks !== null && ghostWeeks !== plan.weeksToGoal && (
            <p className="mt-2 text-[13px]" style={{ color: TEXT.faint }}>
              was {formatWeeks(ghostWeeks)}
            </p>
          )}

          {/* Says what the big number means. Hidden while scrubbing, when the
              panel is showing a balance rather than a countdown. */}
          {!isScrubbing && !plan.reached && reachable && (
            <p className="mt-3 border-t pt-2 text-[12.5px]" style={{ color: TEXT.muted, borderColor: '#F1EEF9' }}>
              {COPY['jar.answer.hint']}
            </p>
          )}
        </section>

        <div className="lg:col-start-1 lg:row-start-1">
          <ContributionDial valueMinor={goal.baseWeeklyMinor} onChange={game.setWeeklyMinor} />
        </div>
      </div>

      {/* ------------------------------ scrubber ----------------------------- */}

      <div className="mt-4">
        <WeekScrubber
          goal={goal}
          boosts={boosts}
          week={scrubWeek}
          weeksToGoal={plan.weeksToGoal}
          onScrub={game.scrubTo}
        />
      </div>

      {/* ------------------------------- boosts ------------------------------ */}

      <div className="mt-5">
        <BoostCards activeIds={activeBoostIds} onToggle={toggleBoostWithSound} />
      </div>

      {/* ------------------------------- finish ------------------------------ */}

      <FinishPanel
        goalName={goal.name}
        weeks={answerWeeks}
        date={answerDate}
        reachable={reachable}
        reached={plan.reached}
        onOpenReport={game.openReport}
      />

      {/* One region, polite, debounced. Announces the settled answer only. */}
      <div aria-live="polite" aria-atomic="true">
        <VisuallyHidden>{announcement}</VisuallyHidden>
      </div>
    </Shell>
  );
}

/* --------------------------------- intro ----------------------------------- */

/**
 * Reduced-motion path. Advances on mount, so the clip is skipped without ever
 * being requested. Renders nothing rather than a flash of empty frame.
 */
function IntroSkipper({ onSkip }: { onSkip: () => void }) {
  useEffect(() => {
    onSkip();
  }, [onSkip]);
  return null;
}

/* ------------------------------ finish panel ------------------------------- */

/**
 * Reads the goal name mid-sentence.
 *
 * The presets are written as "A bike" / "A video game", which reads wrong
 * inside "enough for A bike". Only an opening article is lowered - a custom
 * goal a child typed ("Nintendo Switch") is left exactly as they wrote it.
 */
function inlineGoalName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'your goal';
  return /^(a|an|the)\s/i.test(trimmed) ? trimmed[0].toLowerCase() + trimmed.slice(1) : trimmed;
}

function FinishPanel({
  goalName,
  weeks,
  date,
  reachable,
  reached,
  onOpenReport,
}: {
  goalName: string;
  weeks: string;
  date: string;
  reachable: boolean;
  reached: boolean;
  onOpenReport: () => void;
}) {
  const goal = inlineGoalName(goalName);

  const { title, body, cta } = reached
    ? {
        title: COPY['jar.finish.reachedTitle'],
        body: COPY['jar.finish.reachedBody']({ goal }),
        cta: COPY['jar.finish.reachedCta'],
      }
    : reachable
      ? {
          title: COPY['jar.finish.title'],
          body: COPY['jar.finish.body']({ goal, weeks, date }),
          cta: COPY['jar.finish.cta'],
        }
      : {
          title: COPY['jar.finish.emptyTitle'],
          body: COPY['jar.finish.emptyBody'],
          cta: COPY['jar.finish.emptyCta'],
        };

  return (
    <section className="sgj-finish mt-6" aria-labelledby="sgj-finish-title">
      <div className="min-w-0">
        <h3 id="sgj-finish-title" className="font-display text-[20px] font-semibold" style={{ color: '#1C1F2E' }}>
          {title}
        </h3>
        <p className="mt-1 text-[14.5px] leading-[1.45]" style={{ color: TEXT.body }}>
          {body}
        </p>
        <p className="mt-1 text-[12.5px]" style={{ color: TEXT.muted }}>
          {COPY['jar.finish.print']}
        </p>
      </div>

      <button type="button" className="sgj-cta sgj-cta--lg shrink-0" onClick={onOpenReport}>
        {cta}
      </button>
    </section>
  );
}

/* ------------------------------- page shell -------------------------------- */

function Shell({ reduced, children }: { reduced: boolean; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <style>{STYLES}</style>
      <div className={reduced ? 'sgj-reduced' : undefined}>
        {/*
          The h1 and its description are the page's SEO surface and are carried
          over verbatim from the previous implementation. They stay mounted on
          every phase; each screen's own heading is an h2 beneath this one.
        */}
        {/*
          `print:hidden` is not optional here. This block is the page's SEO
          surface and it sits above every phase, so without it the eyebrow, the
          h1 and both descriptions print on top of the certificate - 128px of
          heading that pushes the fridge sheet onto a second page.

          Anything added to this shell in future needs the same treatment: the
          only thing that should ever reach paper is the certificate.
        */}
        <header className="mb-5 print:hidden">
          {/*
            Way back to the tool index.

            Lives in the shell rather than on one screen, so it is reachable
            from the intro, the goal picker, the jar and the plan alike - a
            child who wants a different game should never have to work out which
            step of this one they are on first. `prefetch={false}` matches how
            every card on `/tools` links out.
          */}
          <Link href="/tools" prefetch={false} className="sgj-backlink">
            <IconBack size={18} />
            {COPY['nav.allTools']}
          </Link>

          <p className="sgj-eyebrow mt-3">🎯 Free · no sign-up needed</p>
          <h1 className="font-display mt-2 text-[26px] font-semibold leading-tight sm:text-[30px]" style={{ color: '#1C1F2E' }}>
            Savings Goal <span className="text-mv-primary">Calculator</span>
          </h1>
          <p className="mt-1 text-[15px]" style={{ color: TEXT.body }}>
            Plan how long it will take to save for something special.
          </p>
          {/* The same idea again in words a nine-year-old uses. The line above
              is the SEO description and is carried over verbatim. */}
          <p className="mt-1 font-display text-[15px] font-semibold" style={{ color: '#5A3EE6' }}>
            {COPY['how.lede']}
          </p>
        </header>
        {children}
      </div>
    </div>
  );
}

/**
 * Scoped stylesheet, prefix `sgj-`.
 *
 * There is no global animation CSS in this repo - `globals.css` has no
 * keyframes - so the established pattern is a per-component style block with
 * its own prefix. Curves come from the 3a handoff: rise 600ms, pop 500ms,
 * hover 250ms.
 *
 * Every animated property is pinned to its end state in the reduced-motion
 * block below. An `animation: none` on its own would leave anything that starts
 * at `opacity: 0` permanently invisible.
 */
const STYLES = `
@keyframes sgjRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes sgjPop  { from { opacity: 0; transform: translateX(-50%) scale(.86); } to { opacity: 1; transform: translateX(-50%) scale(1); } }

.sgj-rise { animation: sgjRise .6s cubic-bezier(.2,.9,.3,1) both; }

/* ---- the jar shrinks on small screens so the answer stays near the fold ---- */
.sgj-jar-wrap { max-width: 260px; }
@media (max-width: 639px) { .sgj-jar-wrap { max-width: 170px; } }

/* ---- back to the tool index ----
   An anchor, not a button, because it is a navigation: middle-click, open in a
   new tab and "copy link" all have to keep working. Sized to the same 44px
   target as every real control. */
.sgj-backlink {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 44px; margin-left: -10px; padding: 0 10px;
  border-radius: 14px; text-decoration: none;
  color: #5A3EE6; font-weight: 600; font-size: 14px;
  transition: background .25s ease;
}
.sgj-backlink:focus-visible { outline: 2px solid #6B4EFF; outline-offset: 3px; }
@media (hover: hover) { .sgj-backlink:hover { background: #F1EEF9; } }

/* ---- eyebrow pill, 3a header treatment ---- */
.sgj-eyebrow {
  display: inline-block; padding: 5px 12px; border-radius: 999px;
  background: #EDE6FF; color: #5A3EE6; font-size: 13px; font-weight: 600;
}

/* ---- focus: 2px #6B4EFF, 3px offset, per the 3a spec ---- */
.sgj-preset:focus-visible,
.sgj-boost:focus-visible,
.sgj-step:focus-visible,
.sgj-cta:focus-visible,
.sgj-ghost-btn:focus-visible,
.sgj-input:focus-visible,
.sgj-range:focus-visible,
.sgj-milestone__close:focus-visible {
  outline: 2px solid #6B4EFF;
  outline-offset: 3px;
}

/* ---- preset cards (emoji, name, editable price, action) ---- */
.sgj-preset-card {
  display: flex; flex-direction: column;
  width: 100%; height: 100%; padding: 14px 12px; text-align: left;
}
.sgj-preset-card .sgj-cta--sm { margin-top: auto; }
.sgj-input--price { width: 100%; min-width: 0; min-height: 40px; padding: 0 8px; font-size: 15px; }
.sgj-cta--sm { min-height: 40px; padding: 0 12px; font-size: 13.5px; }

/* ---- "Something else" tile, still a plain button ---- */
.sgj-preset {
  width: 100%; min-height: 128px; padding: 16px 12px; text-align: left; cursor: pointer;
  transition: transform .25s ease, box-shadow .25s ease;
}
.sgj-preset:active { transform: scale(.96); }
.sgj-preset--on { border-color: #6B4EFF !important; box-shadow: 0 0 0 2px rgba(107,78,255,.18), 0 18px 40px -24px rgba(80,60,150,.35) !important; }
@media (hover: hover) {
  .sgj-preset:hover { transform: translateY(-6px); box-shadow: 0 32px 60px -26px rgba(80,60,150,.55); }
}

/* ---- boost hand ----
   auto-fill rather than a fixed column count: the groups hold 2, 5, 6 and 7
   cards, and a fixed 5-up grid left ragged half-rows on most of them. */
.sgj-hand {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(152px, 1fr));
  gap: 10px; list-style: none; padding: 0; margin: 0;
}
.sgj-hand__item { min-width: 0; }
.sgj-boost {
  display: flex; flex-direction: column; /* so the amount can sit at the base */
  width: 100%; height: 100%; min-height: 124px; padding: 11px; text-align: left; cursor: pointer;
  background: rgba(255,255,255,.94); border: 1px solid #ECE7FB; border-radius: 18px;
  box-shadow: 0 18px 40px -24px rgba(80,60,150,.35), inset 0 2px 0 rgba(255,255,255,.9);
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease, background .25s ease;
}
.sgj-boost:active { transform: scale(.92); }
.sgj-boost--on { border-color: #6B4EFF; background: #F6F3FF; box-shadow: 0 0 0 2px rgba(107,78,255,.18), 0 18px 40px -24px rgba(80,60,150,.35); }
@media (hover: hover) { .sgj-boost:hover { transform: translateY(-4px); box-shadow: 0 32px 60px -26px rgba(80,60,150,.55); } }
.sgj-boost__mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 999px; color: #8B7FC0; background: #F1EEF9;
}
.sgj-boost__mark--on { color: #fff; background: #6B4EFF; }

/* Small screens: two columns, not a horizontal strip.

   This deliberately drops the scroll-snap row the original spec asked for. That
   spec was written for a hand of five cards; with 26 across five groups it
   produced five stacked horizontal scrollers, which is a trap rather than a
   feature - a vertical swipe to read the page gets captured by whichever strip
   is under the thumb, mandatory snapping bounces short drags back so the
   control feels dead, more than half the cards are hidden with no affordance
   that they exist, and on a desktop browser it needs shift+wheel. Two columns
   shows every card, scrolls the way the rest of the page scrolls, and works
   with touch, wheel, and keyboard alike. */
@media (max-width: 719px) {
  .sgj-hand { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .sgj-boost { min-height: 0; padding: 10px; }
}

/* Below ~360px two columns would leave ~150px of card, so the labels stop
   fitting. One column reads better than two cramped ones. */
@media (max-width: 359px) {
  .sgj-hand { grid-template-columns: 1fr; }
}

/* ---- steppers and buttons: 44x44 minimum, 8px apart ---- */
.sgj-step {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; flex: 0 0 44px; cursor: pointer;
  border-radius: 14px; border: 1px solid #ECE7FB; background: #fff; color: #4A4560;
  transition: transform .25s ease, background .25s ease, color .25s ease;
}
.sgj-step:active:not(:disabled) { transform: scale(.92); }
.sgj-step:disabled { opacity: .4; cursor: not-allowed; }
@media (hover: hover) { .sgj-step:hover:not(:disabled) { background: #F6F3FF; color: #6B4EFF; } }

.sgj-cta {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 0 20px; cursor: pointer;
  border-radius: 14px; background: #6B4EFF; color: #fff; font-weight: 600; font-size: 15px;
  box-shadow: 0 12px 24px -14px rgba(107,78,255,.9);
  transition: transform .25s ease, background .25s ease;
}
.sgj-cta:active:not(:disabled) { transform: scale(.96); }
.sgj-cta:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
@media (hover: hover) { .sgj-cta:hover:not(:disabled) { background: #5A3EE6; } }

/* ============================ plan certificate ============================
   The artefact that ends up on a fridge. Two constraints shape all of it:
   it has to look like a prize to a nine-year-old, and it has to survive a
   home printer in black and white. So the structure is carried by borders,
   weight and shape rather than by fills, and every colour has a legible
   greyscale equivalent. */

.sgj-cert {
  position: relative;
  border-radius: 26px;
  padding: 6px;
  /* The outer ribbon. A gradient rather than a flat fill so the frame reads
     as an object even at a glance. */
  background: linear-gradient(135deg, #6B4EFF 0%, #8B74FF 45%, #5CE1E6 100%);
  box-shadow: 0 22px 50px -26px rgba(80,60,150,.6);
}
.sgj-cert__inner {
  position: relative;
  border-radius: 21px;
  background: #FFFDF7;                 /* warm paper, not screen white */
  border: 2px dashed #D9CFFF;          /* the certificate tell */
  padding: 26px 22px 20px;
}

.sgj-cert__seal { position: absolute; top: 14px; right: 16px; width: 74px; height: 74px; }
.sgj-cert__seal-emoji {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 30px; line-height: 1;
}

.sgj-cert__eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
  color: #5A3EE6;
}
.sgj-cert__title {
  font-family: var(--font-fredoka), system-ui, sans-serif;
  font-size: 34px; font-weight: 600; line-height: 1.05; color: #1C1F2E; margin-top: 2px;
}
.sgj-cert__savingfor { margin-top: 12px; font-size: 12.5px; color: #6E6A85; }
.sgj-cert__goal {
  font-family: var(--font-fredoka), system-ui, sans-serif;
  font-size: 25px; font-weight: 600; color: #1C1F2E; line-height: 1.15;
  padding-right: 84px;                 /* clear of the seal */
}
.sgj-cert__goal-amt { color: #6B4EFF; }

.sgj-cert__stats {
  display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px;
  margin-top: 16px; padding: 12px; border-radius: 14px;
  background: #F6F3FF; border: 1px solid #E4DCFB;
}
.sgj-cert__stats > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.sgj-cert__stat-label { font-size: 10.5px; color: #6E6A85; }
.sgj-cert__stat-value {
  font-family: var(--font-fredoka), system-ui, sans-serif;
  font-size: 19px; font-weight: 600; color: #1C1F2E; line-height: 1.1;
}

.sgj-cert__block { margin-top: 16px; }
.sgj-cert__h4 {
  font-family: var(--font-fredoka), system-ui, sans-serif;
  font-size: 14.5px; font-weight: 600; color: #1C1F2E; margin-bottom: 7px;
}
.sgj-cert__note { font-size: 11.5px; color: #6E6A85; margin-top: 7px; }

/* ---- the tracker: the reason this sheet earns its place on a fridge ---- */
.sgj-cert__dots {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 7px; list-style: none; padding: 0; margin: 0;
}
.sgj-cert__dot { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.sgj-cert__dot-ring {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 999px;
  border: 2px solid #6B4EFF; background: #fff;
  font-size: 11.5px; font-weight: 700; color: #5A3EE6;
}
.sgj-cert__dot-amt { font-size: 9.5px; font-weight: 600; color: #6E6A85; }

/* ---- jobs ----
   Multi-column rather than a single stack: every card ticked is 26 jobs, and
   one per line is what tips the sheet onto a second page. */
.sgj-cert__jobs { list-style: none; padding: 0; margin: 0; column-gap: 18px; }
.sgj-cert__jobs[data-cols='2'] { column-count: 2; }
.sgj-cert__jobs[data-cols='3'] { column-count: 3; }
.sgj-cert__jobs[data-cols='4'] { column-count: 4; column-gap: 12px; }
.sgj-cert__jobs li {
  display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #413B5A;
  margin-bottom: 5px;
  break-inside: avoid;         /* never split a job across a column or a page */
  -webkit-column-break-inside: avoid;
}
.sgj-cert__tick {
  flex: 0 0 15px; width: 15px; height: 15px; border-radius: 4px;
  border: 2px solid #6B4EFF; background: #fff;   /* an empty box to tick by hand */
}
.sgj-cert__job-label { flex: 1 1 auto; min-width: 0; display: flex; align-items: center; gap: 6px; }
.sgj-cert__job-emoji { flex: 0 0 auto; }
.sgj-cert__job-amt { font-weight: 700; color: #5A3EE6; white-space: nowrap; }

/* ---- promises ---- */
.sgj-cert__promises {
  display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; margin-top: 16px;
  padding-top: 14px; border-top: 2px dotted #D9CFFF;
}
.sgj-cert__promise-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
.sgj-cert__promise-list li {
  position: relative; padding-left: 15px; font-size: 12px; line-height: 1.4; color: #413B5A;
}
.sgj-cert__promise-list li::before {
  content: '★'; position: absolute; left: 0; top: 0; color: #FFC400; font-size: 10px;
}

/* ---- signatures ---- */
.sgj-cert__signs {
  display: grid; grid-template-columns: 1fr 1fr .7fr; gap: 14px; margin-top: 18px;
}
.sgj-cert__sign { display: flex; flex-direction: column; }
.sgj-cert__sign-input {
  width: 100%; min-width: 0; background: transparent;
  border: 0; border-bottom: 2px solid #1C1F2E; border-radius: 0;
  padding: 4px 2px; min-height: 44px;   /* a real tap target, not just a line */
  font-family: var(--font-fredoka), system-ui, sans-serif;
  font-size: 17px; color: #1C1F2E;
}
.sgj-cert__sign-input::placeholder { color: #C9BFE8; font-size: 14px; }
.sgj-cert__sign-input:focus-visible { outline: 2px solid #6B4EFF; outline-offset: 3px; }
.sgj-cert__sign-label { margin-top: 4px; font-size: 10.5px; color: #6E6A85; }

.sgj-cert__hint { margin-top: 12px; font-size: 11px; color: #6E6A85; }
/* Small print, but not unreadable print: #8B7FC0 at 9.5px measured 3.5:1 on
   the paper background. Fine print is still text a parent has to be able to
   read, so it uses the same passing muted tone as everything else. */
.sgj-cert__fineprint { margin-top: 6px; font-size: 10.5px; line-height: 1.45; color: #6E6A85; }
.sgj-cert__footer {
  margin-top: 12px; padding-top: 10px; border-top: 2px dashed #D9CFFF;
  text-align: center; font-size: 11.5px; font-weight: 700; color: #5A3EE6;
}

.sgj-cert__actions { display: flex; justify-content: center; margin-top: 14px; }

@media (max-width: 639px) {
  .sgj-cert__inner { padding: 20px 14px 16px; }
  .sgj-cert__title { font-size: 27px; }
  .sgj-cert__goal { font-size: 20px; padding-right: 66px; }
  .sgj-cert__seal { width: 58px; height: 58px; }
  .sgj-cert__seal-emoji { font-size: 23px; }
  .sgj-cert__stats { grid-template-columns: 1fr; gap: 10px; }
  .sgj-cert__promises { grid-template-columns: 1fr; }
  .sgj-cert__signs { grid-template-columns: 1fr; gap: 18px; }
  /* Three columns inside a 327px sheet is ~100px each, which breaks every job
     label onto four lines. Columns are a paper optimisation; on a phone the
     page just scrolls. */
  .sgj-cert__jobs[data-cols] { column-count: 1; }
}
@media (min-width: 640px) and (max-width: 767px) {
  .sgj-cert__jobs[data-cols='3'] { column-count: 2; }
}

/* ---- on paper ----
   The sheet is the deliverable, so it gets real print rules: no shadows to
   smear, no page break through the middle of the tracker, and colours forced
   on so the rings and the seal survive a browser's ink-saving default. */
@media print {
  /* Narrow margins buy back roughly 20mm of height, which is most of what a
     fully-loaded jobs list costs. */
  @page { size: A4 portrait; margin: 10mm; }

  /* Collapse the page around the sheet.

     Every sibling of the certificate is already display:none via print:hidden,
     but the boxes they sat in still contribute height: main carries 48px of
     vertical padding and a full-viewport min-height, and body is min-h-screen.
     Left alone those push the document past one page and produce a trailing
     blank sheet even when the certificate itself fits. This stylesheet only
     mounts on this route, so targeting main here is safe. */
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    min-height: 0 !important;
    height: auto !important;
    background: #fff !important;
  }
  main {
    min-height: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  /* The certificate is wrapped in a spacing div on screen; on paper that
     margin is just a gap at the top of the sheet. Ignored harmlessly by any
     engine without :has(). */
  *:has(> .sgj-cert) { margin: 0 !important; padding: 0 !important; }

  .sgj-cert {
    box-shadow: none;
    background: #fff;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    break-inside: avoid;
  }
  .sgj-cert__inner { border: 2px solid #6B4EFF; background: #fff; padding: 14px; }
  .sgj-cert__stats { background: #fff; border: 1.5px solid #6B4EFF; padding: 9px; }
  .sgj-cert__block, .sgj-cert__promises, .sgj-cert__signs { break-inside: avoid; }
  .sgj-cert__dots { break-inside: avoid; }
  .sgj-cert__sign-input { border-bottom: 2px solid #000; }
  .sgj-cert__sign-input::placeholder { color: transparent; } /* blank line to sign */

  /* ---- one page, even with all 26 jobs ticked ----
     Everything below is height, not decoration. The type stays above the size
     a parent can read; what shrinks is padding, circle diameter and leading. */
  /* Measured, not guessed: with all 26 jobs ticked and the tracker at its full
     30 circles, the sheet comes to ~800px against the 1047px A4 allows. The
     sizes below are therefore set for legibility on paper rather than squeezed
     to the minimum - there is no need to print a parent 8px small print. */
  .sgj-cert__title { font-size: 26px; }
  .sgj-cert__goal { font-size: 19px; padding-right: 68px; }
  .sgj-cert__savingfor { margin-top: 8px; }
  .sgj-cert__seal { width: 56px; height: 56px; top: 12px; right: 14px; }
  .sgj-cert__seal-emoji { font-size: 22px; }
  .sgj-cert__stats { margin-top: 12px; }
  .sgj-cert__stat-value { font-size: 17px; }
  .sgj-cert__block { margin-top: 12px; }
  .sgj-cert__h4 { font-size: 13.5px; margin-bottom: 5px; }
  .sgj-cert__note { font-size: 10.5px; margin-top: 5px; }

  .sgj-cert__dots { grid-template-columns: repeat(auto-fill, minmax(46px, 1fr)); gap: 5px; }
  .sgj-cert__dot-ring { width: 29px; height: 29px; font-size: 11px; }
  .sgj-cert__dot-amt { font-size: 9px; }

  .sgj-cert__jobs li { font-size: 11px; gap: 6px; margin-bottom: 3px; }
  .sgj-cert__tick { flex-basis: 13px; width: 13px; height: 13px; }

  .sgj-cert__promises { margin-top: 12px; padding-top: 10px; }
  .sgj-cert__promise-list li { font-size: 11px; line-height: 1.35; }
  .sgj-cert__signs { margin-top: 14px; }
  .sgj-cert__sign-input { min-height: 32px; font-size: 16px; }
  .sgj-cert__hint { margin-top: 8px; font-size: 10.5px; }
  .sgj-cert__fineprint { margin-top: 5px; font-size: 10px; }
  .sgj-cert__footer { margin-top: 9px; padding-top: 8px; }
}

/* ---- intro clip ---- */
.sgj-intro__frame {
  position: relative; overflow: hidden;
  border-radius: 22px; border: 1px solid #ECE7FB; background: #1C1F2E;
  box-shadow: 0 18px 40px -24px rgba(80,60,150,.35);
  aspect-ratio: 16 / 9;
}
.sgj-intro__video { display: block; width: 100%; height: 100%; object-fit: cover; }
.sgj-intro__controls {
  position: absolute; right: 12px; bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.sgj-intro__icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; border-radius: 999px; cursor: pointer;
  background: rgba(28,31,46,.72); color: #fff; border: 1px solid rgba(255,255,255,.25);
}
.sgj-intro__skip {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 44px; padding: 0 16px; border-radius: 999px; cursor: pointer;
  background: #fff; color: #1C1F2E; font-weight: 600; font-size: 14px;
  border: 1px solid #ECE7FB; box-shadow: 0 8px 20px -10px rgba(0,0,0,.5);
}
.sgj-intro__icon:focus-visible, .sgj-intro__skip:focus-visible {
  outline: 2px solid #6B4EFF; outline-offset: 3px;
}
/* Shown only when the browser refused unmuted autoplay. Deliberately large:
   the clip is five seconds, so a corner icon would be missed. */
.sgj-intro__soundcta {
  position: absolute; inset: 0; z-index: 2; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  background: rgba(28,31,46,.42);
  color: #fff; font-family: inherit; font-weight: 700; font-size: 16px;
  border: 0; width: 100%;
}
.sgj-intro__soundcta-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 64px; height: 64px; border-radius: 999px;
  background: #6B4EFF; box-shadow: 0 10px 30px -8px rgba(0,0,0,.6);
}
.sgj-intro__soundcta:focus-visible { outline: 2px solid #fff; outline-offset: -6px; }
@media (hover: hover) { .sgj-intro__soundcta:hover { background: rgba(28,31,46,.55); } }

.sgj-intro__caption { margin-top: 10px; text-align: center; font-size: 13px; color: #6E6A85; }
@media (hover: hover) {
  .sgj-intro__skip:hover { background: #F6F3FF; }
  .sgj-intro__icon:hover { background: rgba(28,31,46,.9); }
}

/* ---- how-it-works steps, setup screen only ---- */
.sgj-steps {
  display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px;
  list-style: none; padding: 0; margin: 0;
}
.sgj-steps__item {
  display: flex; align-items: flex-start; gap: 10px; min-width: 0;
  padding: 12px 14px; border-radius: 16px;
  background: rgba(255,255,255,.7); border: 1px solid #ECE7FB;
}
.sgj-steps__num {
  display: inline-flex; align-items: center; justify-content: center; flex: 0 0 26px;
  width: 26px; height: 26px; border-radius: 999px;
  background: #6B4EFF; color: #fff; font-weight: 700; font-size: 13px;
}
@media (max-width: 639px) { .sgj-steps { grid-template-columns: 1fr; } }

/* ---- finish panel: the one place on the page that raises its voice ---- */
.sgj-finish {
  display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
  padding: 20px 22px; border-radius: 22px;
  background: linear-gradient(180deg, #F6F3FF 0%, #EFEAFF 100%);
  border: 1px solid #DCD3FA;
  box-shadow: 0 18px 40px -24px rgba(80,60,150,.35);
}
.sgj-cta--lg { min-height: 52px; padding: 0 26px; font-size: 16px; }

.sgj-ghost-btn {
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 44px; padding: 0 14px; cursor: pointer;
  border-radius: 14px; border: 1px solid #ECE7FB; background: #fff;
  color: #6B4EFF; font-weight: 600; font-size: 14px;
  transition: background .25s ease;
}
@media (hover: hover) { .sgj-ghost-btn:hover { background: #F6F3FF; } }

/* ---- inputs ---- */
.sgj-input {
  min-height: 44px; padding: 0 12px;
  border-radius: 14px; border: 1px solid #ECE7FB; background: #fff;
  color: #1C1F2E; font-size: 16px; /* 16px: stops iOS zooming the page on focus */
}
.sgj-input--num { width: 92px; }

/* ---- range: fat thumb, 44px hit area ---- */
.sgj-range { -webkit-appearance: none; appearance: none; height: 44px; background: transparent; cursor: pointer; }
.sgj-range::-webkit-slider-runnable-track {
  height: 14px; border-radius: 999px;
  background: linear-gradient(90deg, #6B4EFF 0 var(--sgj-pct,0%), #EDE7F8 var(--sgj-pct,0%) 100%);
}
.sgj-range::-moz-range-track { height: 14px; border-radius: 999px; background: #EDE7F8; }
.sgj-range::-moz-range-progress { height: 14px; border-radius: 999px; background: #6B4EFF; }
.sgj-range::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none;
  width: 32px; height: 32px; margin-top: -9px; border-radius: 999px;
  background: #fff; border: 3px solid #6B4EFF;
  box-shadow: 0 6px 14px -6px rgba(80,60,150,.6);
}
.sgj-range::-moz-range-thumb {
  width: 32px; height: 32px; border-radius: 999px;
  background: #fff; border: 3px solid #6B4EFF;
  box-shadow: 0 6px 14px -6px rgba(80,60,150,.6);
}
.sgj-range--slim::-webkit-slider-runnable-track { height: 10px; }
.sgj-range--slim::-webkit-slider-thumb { margin-top: -11px; }

/* ---- milestone badge ---- */
/* Sits clear of the glass rather than over it - on the jar body the white
   pill washed out against the fill and the sheen gradient. */
.sgj-milestone {
  position: absolute; left: 50%; top: -10px; transform: translateX(-50%);
  display: inline-flex; align-items: center; gap: 8px; white-space: nowrap;
  padding: 8px 10px 8px 12px; border-radius: 999px;
  background: #fff; border: 1.5px solid #6B4EFF; color: #1C1F2E;
  box-shadow: 0 12px 28px -12px rgba(80,60,150,.7);
  z-index: 3;
}
.sgj-milestone--pop { animation: sgjPop .7s cubic-bezier(.2,1.3,.4,1) both; }
.sgj-milestone__close {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; border-radius: 999px; color: #8B7FC0; cursor: pointer;
}

/* ---- reduced motion: pin every animated property to its end state ---- */
@media (prefers-reduced-motion: reduce) {
  .sgj-rise { animation: none !important; opacity: 1 !important; transform: none !important; }
  .sgj-milestone--pop { animation: none !important; opacity: 1 !important; transform: translateX(-50%) !important; }
  .sgj-preset, .sgj-boost, .sgj-step, .sgj-cta, .sgj-ghost-btn { transition: none !important; }
  .sgj-preset:hover, .sgj-boost:hover, .sgj-preset:active, .sgj-boost:active,
  .sgj-step:active, .sgj-cta:active { transform: none !important; }
}
.sgj-reduced .sgj-rise { animation: none; opacity: 1; transform: none; }
`;
