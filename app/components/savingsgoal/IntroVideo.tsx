'use client';

/**
 * Goal Jar - intro clip
 * ----------------------
 * A five-second welcome that plays once on arrival, then hands over to the
 * calculator.
 *
 * ## It can never trap the player
 *
 * A video standing between a child and the tool is a liability, so every way it
 * can go wrong ends the same way - straight into the calculator:
 *
 * - `prefers-reduced-motion` skips it entirely, without it ever mounting.
 * - A decode or network error advances immediately.
 * - A clip that never becomes playable is dropped after `LOAD_TIMEOUT_MS`.
 * - Anything else that hangs is caught by the watchdog.
 * - Skip is always on screen, always focused first, and Escape works too.
 *
 * ## Sound
 *
 * It tries to start **with sound**, because the clip is five seconds long and
 * nobody can find a speaker icon in time for it to matter.
 *
 * Browsers refuse unmuted autoplay on a cold load, but they allow it once the
 * user has interacted with the origin during the session - and arriving here by
 * tapping the tool card on `/tools` is exactly that. So the common path really
 * does start with audio on its own.
 *
 * Where it is refused the clip does not fall silent and carry on regardless: it
 * replays muted, and a full-frame "Tap for sound" button appears which restarts
 * from the first frame so nothing is missed. Skip and the sound toggle stay
 * visible throughout, which is also what WCAG 1.4.2 requires of audio that
 * plays for more than three seconds.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { COPY } from '@/app/lib/savingsgoal/content';
import { IconClose, IconSoundOff, IconSoundOn } from './chrome';

/** Clip length is ~5.1s; give it headroom before the last-resort watchdog. */
const WATCHDOG_MS = 9_000;

/**
 * How long to wait for the clip to become playable before giving up on it.
 *
 * This covers two cases with one rule. A missing or broken file leaves the
 * element at `readyState 0` forever, and without this the player stares at a
 * dead frame until the watchdog fires nine seconds later. A slow connection
 * looks identical from here - and a child on 3G should not be held in front of
 * a spinner to watch a five-second flourish either. Both move straight on.
 */
const LOAD_TIMEOUT_MS = 2_500;

interface IntroVideoProps {
  onDone: () => void;
}

export default function IntroVideo({ onDone }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef(false);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  /** True when the browser refused sound and we fell back to a silent play. */
  const [soundBlocked, setSoundBlocked] = useState(false);

  /** Idempotent: several failure paths can race, and the player leaves once. */
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  /** Restartable, because turning sound on replays the clip from the top. */
  const armWatchdog = useCallback(() => {
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    watchdogRef.current = setTimeout(finish, WATCHDOG_MS);
  }, [finish]);

  // Send focus to Skip, so a keyboard user's first press gets them out.
  useEffect(() => {
    skipRef.current?.focus();
  }, []);

  // Escape leaves, matching every other dismissible thing on the web.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  // Watchdog: a stalled buffer must not strand anyone on a still frame.
  useEffect(() => {
    armWatchdog();
    return () => {
      if (watchdogRef.current) clearTimeout(watchdogRef.current);
    };
  }, [armWatchdog]);

  /*
   * Give up early if the clip is not playable.
   *
   * `<video onError>` does NOT fire when `<source>` children fail to load - the
   * error is dispatched on the source elements, and the video is simply left at
   * `networkState 3 / readyState 0`. Relying on the video's own error handler
   * meant a missing file sat on screen until the nine-second watchdog. This
   * checks readiness directly, which catches a broken file, an unsupported
   * codec, and a slow connection alike.
   */
  useEffect(() => {
    const t = setTimeout(() => {
      const el = videoRef.current;
      if (!el || el.readyState < 3 /* HAVE_FUTURE_DATA */) finish();
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [finish]);

  /*
   * Try to start with sound, and fall back to silence rather than to nothing.
   *
   * No browser allows unmuted autoplay on a cold load - the promise from
   * `play()` simply rejects. It IS allowed once the user has interacted with
   * this origin during the session, and arriving here by tapping the tool card
   * on `/tools` is exactly that interaction, so in the common path the clip
   * does start with sound on its own.
   *
   * When it is refused we do not give up on the clip: it replays muted, which
   * is always permitted, and a "Tap for sound" button appears. That button
   * restarts from the first frame, because a five-second clip is over before
   * anyone could have hunted for a speaker icon halfway through.
   *
   * WCAG 1.4.2 requires a way to stop audio that plays for more than three
   * seconds; Skip and the sound toggle are both on screen the whole time.
   */
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let cancelled = false;

    el.muted = false;
    const withSound = el.play();

    if (withSound && typeof withSound.then === 'function') {
      withSound
        .then(() => {
          if (!cancelled) setSoundOn(true);
        })
        .catch(() => {
          // Refused, or superseded by a re-run. Either way, hand off to the
          // silent effect below rather than acting from inside this callback.
          if (!cancelled) setSoundBlocked(true);
        });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Start the silent replay from its own effect.
   *
   * Doing this inside the rejection handler above raced React's effects: a
   * `play()` promise rejects with AbortError whenever a newer play request
   * supersedes it, which happens on every effect re-run and on every dev-mode
   * double invocation, so the retry kept cancelling itself and the clip sat
   * frozen on its poster. Driving it from state means it runs once, after the
   * render that established the fallback.
   */
  useEffect(() => {
    if (!soundBlocked) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    setSoundOn(false);
    const silent = el.play();
    if (silent && typeof silent.catch === "function") silent.catch(() => undefined);
  }, [soundBlocked]);

  /** Turn sound on and replay from the top, so nothing is missed. */
  const enableSound = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.currentTime = 0;
    setSoundOn(true);
    setSoundBlocked(false);
    armWatchdog(); // the clip just got five seconds longer
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch(() => undefined);
  };

  const toggleSound = () => {
    if (!soundOn) {
      enableSound();
      return;
    }
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    setSoundOn(false);
  };

  return (
    <section className="sgj-intro" aria-label={COPY['intro.label']}>
      <div className="sgj-intro__frame">
        <video
          ref={videoRef}
          className="sgj-intro__video"
          poster="/video/savings-goal-intro.jpg"
          preload="auto"
          playsInline
          /* No `muted` attribute and no `autoPlay`: muting is driven
             imperatively above so the unmuted attempt comes first, and a React
             `muted` prop would re-assert itself on every render and fight it. */
          onEnded={finish}
          onError={finish}
          /* No `onStalled` handler: `stalled` fires whenever data is briefly
             not forthcoming, which happens during perfectly normal ranged
             playback, and aborting on it cut the clip short at random. Real
             failures are caught by onError, the per-source handlers, the
             readiness timeout, and the watchdog. */
          // Decorative: the text beneath carries the same message, and the
          // calculator behind it is the actual content.
          aria-hidden="true"
          tabIndex={-1}
        >
          {/* onError on each source as well as the video: a failing `<source>`
              dispatches its error here, not on the parent element. */}
          <source src="/video/savings-goal-intro.webm" type="video/webm" onError={finish} />
          <source src="/video/savings-goal-intro.mp4" type="video/mp4" onError={finish} />
        </video>

        {/* Only when the browser refused sound. Covers the frame rather than
            sitting in a corner: a five-second clip gives nobody time to find a
            small speaker icon, and tapping this restarts from the first frame
            so the whole thing is heard. */}
        {soundBlocked && (
          <button type="button" className="sgj-intro__soundcta" onClick={enableSound}>
            <span className="sgj-intro__soundcta-icon" aria-hidden="true">
              <IconSoundOn size={26} />
            </span>
            <span>{COPY['intro.tapForSound']}</span>
          </button>
        )}

        <div className="sgj-intro__controls">
          <button
            type="button"
            className="sgj-intro__icon"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? COPY['intro.soundOff'] : COPY['intro.soundOn']}
          >
            {soundOn ? <IconSoundOn size={18} /> : <IconSoundOff size={18} />}
          </button>
          <button ref={skipRef} type="button" className="sgj-intro__skip" onClick={finish}>
            {COPY['intro.skip']}
            <IconClose size={16} />
          </button>
        </div>
      </div>

      <p className="sgj-intro__caption">{COPY['intro.caption']}</p>
    </section>
  );
}
