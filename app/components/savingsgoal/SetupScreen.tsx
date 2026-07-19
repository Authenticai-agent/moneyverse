'use client';

/**
 * Goal Jar - setup
 * -----------------
 * Chunky clay tiles, four across. Tapping one fills the goal and moves straight
 * to the jar - there is no form to submit and no next button, because the tap
 * *is* the commitment.
 *
 * "Something else" reveals a name field and an amount stepper, and only then
 * shows a button, because a custom goal genuinely needs two values first.
 *
 * Everything else is deferred to the jar screen. Progressive disclosure is the
 * organising rule here, and it is the specific reason the previous version -
 * seven inputs in a two-column grid - failed a nine-year-old.
 */

import { useState } from 'react';
import { formatMinor, parseDollarsToMinor } from '@/app/lib/savingsgoal/engine';
import { COPY, CURRENT_STEP_MINOR, GOAL_PRESETS } from '@/app/lib/savingsgoal/content';
import type { GoalPreset } from '@/app/lib/savingsgoal/types';
import { CLAY, IconMinus, IconPlus, TEXT } from './chrome';

interface SetupScreenProps {
  currentMinor: number;
  customName: string;
  customTargetMinor: number;
  isCustom: boolean;
  onPickPreset: (preset: GoalPreset) => void;
  onStartCustom: () => void;
  onSetName: (name: string) => void;
  onSetTargetMinor: (minor: number) => void;
  onSetCurrentMinor: (minor: number) => void;
  onOpenJar: () => void;
}

export default function SetupScreen({
  currentMinor,
  customName,
  customTargetMinor,
  isCustom,
  onPickPreset,
  onStartCustom,
  onSetName,
  onSetTargetMinor,
  onSetCurrentMinor,
  onOpenJar,
}: SetupScreenProps) {
  // Held locally so the field can be empty while typing without the engine
  // clamping it back to "0" under the cursor on every keystroke.
  const [currentDraft, setCurrentDraft] = useState<string>(() => String(currentMinor / 100));
  const [targetDraft, setTargetDraft] = useState<string>('');

  /**
   * Edited preset prices, keyed by preset id.
   *
   * Kept as raw strings for the same reason as the fields above - a controlled
   * numeric input that reformats mid-keystroke fights whoever is typing. Only
   * ids the player has actually touched appear here; the rest fall back to the
   * illustrative price from `content.ts`.
   */
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const setPrice = (id: string, raw: string) => setPriceDrafts((p) => ({ ...p, [id]: raw }));

  /** The price a tile will actually start the jar with, in minor units. */
  const priceFor = (id: string): number => {
    const draft = priceDrafts[id];
    if (draft === undefined) {
      return GOAL_PRESETS.find((p) => p.id === id)?.targetMinor ?? 0;
    }
    return parseDollarsToMinor(Number(draft));
  };

  const commitCurrent = (raw: string) => {
    setCurrentDraft(raw);
    onSetCurrentMinor(parseDollarsToMinor(Number(raw)));
  };

  const stepCurrent = (delta: number) => {
    const next = Math.max(0, currentMinor + delta);
    setCurrentDraft(String(next / 100));
    onSetCurrentMinor(next);
  };

  return (
    <div className="w-full">
      {/* Three steps up front, so a player who has never seen this knows what
          the whole thing is before touching anything. Setup only - once the jar
          is open the instructions live on the controls themselves. */}
      <ol className="sgj-steps" aria-label="How this works">
        {(
          [
            ['how.step1.title', 'how.step1.body'],
            ['how.step2.title', 'how.step2.body'],
            ['how.step3.title', 'how.step3.body'],
          ] as const
        ).map(([titleKey, bodyKey], i) => (
          <li key={titleKey} className="sgj-steps__item">
            <span className="sgj-steps__num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[14px] font-semibold" style={{ color: '#1C1F2E' }}>
                {COPY[titleKey]}
              </span>
              <span className="block text-[12.5px] leading-[1.35]" style={{ color: TEXT.muted }}>
                {COPY[bodyKey]}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <h2
        className="font-display mt-6 text-[30px] font-semibold leading-tight sm:text-[36px]"
        style={{ color: '#1C1F2E' }}
      >
        {COPY['setup.title']}
      </h2>
      <p className="mt-1 text-[15px]" style={{ color: TEXT.body }}>
        {COPY['setup.subtitle']}
      </p>

      {/* ------------------------------ presets ------------------------------ */}

      {/*
        Each preset is a card, not a button.

        The price is editable - the listed amounts are illustrative, and a bike
        does not cost the same everywhere - which means the tile has to contain
        a text field. A field inside a button is not a legal or usable control
        (the tap target swallows the caret, and screen readers announce a button
        whose label keeps changing), so the card holds a price input and its own
        "Pick this" action instead.
      */}
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GOAL_PRESETS.map((preset, i) => {
          const priceMinor = priceFor(preset.id);
          return (
            <li key={preset.id}>
              <div className="sgj-preset-card sgj-rise" style={{ ...CLAY, animationDelay: `${0.05 + i * 0.07}s` }}>
                <span aria-hidden="true" className="text-[32px] leading-none">
                  {preset.emoji}
                </span>
                <span className="mt-1.5 block font-display text-[15px] font-semibold" style={{ color: '#1C1F2E' }}>
                  {preset.name}
                </span>

                <label htmlFor={`sgj-price-${preset.id}`} className="mt-2 block text-[11.5px]" style={{ color: TEXT.muted }}>
                  {COPY['setup.preset.priceLabel']}
                </label>
                <div className="mt-1 flex items-center gap-1">
                  <span className="font-display text-[15px] font-semibold" style={{ color: TEXT.muted }}>
                    $
                  </span>
                  <input
                    id={`sgj-price-${preset.id}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="sgj-input sgj-input--price"
                    value={priceDrafts[preset.id] ?? String(preset.targetMinor / 100)}
                    onChange={(e) => setPrice(preset.id, e.target.value)}
                    aria-label={`How much does ${preset.name.toLowerCase()} cost?`}
                  />
                </div>

                <button
                  type="button"
                  className="sgj-cta sgj-cta--sm mt-2 w-full"
                  disabled={priceMinor <= 0}
                  onClick={() => onPickPreset({ ...preset, targetMinor: priceMinor })}
                  aria-label={`Pick ${preset.name.toLowerCase()} at ${formatMinor(priceMinor)}`}
                >
                  {COPY['setup.preset.pick']}
                </button>
              </div>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            className={`sgj-preset sgj-rise${isCustom ? ' sgj-preset--on' : ''}`}
            style={{ ...CLAY, animationDelay: `${0.05 + GOAL_PRESETS.length * 0.07}s` }}
            onClick={onStartCustom}
            aria-expanded={isCustom}
            aria-controls="sgj-custom"
            aria-label={`${COPY['setup.custom']}. Add your own goal.`}
          >
            <span aria-hidden="true" className="text-[34px] leading-none">
              ✨
            </span>
            <span className="mt-2 block font-display text-[15px] font-semibold" style={{ color: '#1C1F2E' }}>
              {COPY['setup.custom']}
            </span>
            <span className="mt-0.5 block text-[13px] font-semibold" style={{ color: TEXT.faint }}>
              Your own goal
            </span>
          </button>
        </li>
      </ul>

      <p className="mt-2 text-[12px]" style={{ color: TEXT.faint }}>
        {COPY['setup.illustrative']}
      </p>

      {/* ---------------------------- custom goal ---------------------------- */}

      {isCustom && (
        <div id="sgj-custom" style={CLAY} className="mt-5 p-4 sm:p-5">
          <p className="mb-3 text-[12.5px]" style={{ color: TEXT.muted }}>
            {COPY['setup.custom.hint']}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sgj-name" className="block text-[13px] font-semibold" style={{ color: TEXT.strong }}>
                {COPY['setup.custom.nameLabel']}
              </label>
              <input
                id="sgj-name"
                type="text"
                className="sgj-input mt-1 w-full"
                value={customName}
                placeholder={COPY['setup.custom.namePlaceholder']}
                onChange={(e) => onSetName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="sgj-target" className="block text-[13px] font-semibold" style={{ color: TEXT.strong }}>
                {COPY['setup.custom.amountLabel']}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-display text-[18px] font-semibold" style={{ color: TEXT.muted }}>
                  $
                </span>
                <input
                  id="sgj-target"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="sgj-input w-full"
                  value={targetDraft}
                  placeholder="120"
                  onChange={(e) => {
                    setTargetDraft(e.target.value);
                    onSetTargetMinor(parseDollarsToMinor(Number(e.target.value)));
                  }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="sgj-cta mt-4"
            onClick={onOpenJar}
            disabled={customTargetMinor <= 0}
          >
            Fill my jar
          </button>
          {customTargetMinor <= 0 && (
            <p className="mt-2 text-[12px]" style={{ color: TEXT.muted }}>
              Add how much it costs and the jar will open.
            </p>
          )}
        </div>
      )}

      {/* --------------------------- already have ---------------------------- */}

      <div style={CLAY} className="mt-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <label htmlFor="sgj-current" className="font-display text-[16px] font-semibold" style={{ color: '#1C1F2E' }}>
            {COPY['setup.current.label']}
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="sgj-step"
              onClick={() => stepCurrent(-CURRENT_STEP_MINOR)}
              disabled={currentMinor <= 0}
              aria-label={`Five dollars less. Currently ${formatMinor(currentMinor)}.`}
            >
              <IconMinus />
            </button>

            <div className="flex items-center gap-1">
              <span className="font-display text-[20px] font-semibold" style={{ color: TEXT.muted }}>
                $
              </span>
              <input
                id="sgj-current"
                type="number"
                inputMode="numeric"
                min={0}
                className="sgj-input sgj-input--num"
                value={currentDraft}
                onChange={(e) => commitCurrent(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="sgj-step"
              onClick={() => stepCurrent(CURRENT_STEP_MINOR)}
              aria-label={`Five dollars more. Currently ${formatMinor(currentMinor)}.`}
            >
              <IconPlus />
            </button>
          </div>
        </div>

        <p className="mt-2 text-[12px]" style={{ color: TEXT.muted }}>
          {COPY['setup.current.hint']}
        </p>
      </div>
    </div>
  );
}
