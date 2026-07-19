'use client';

/**
 * SetupScreen - the player builds their plan and picks a coach, then emits a
 * GameConfig to start the game.
 *
 * Kid-first redesign: a warm, garden-toned wizard where every choice is big,
 * tappable and illustrated. The coaches and the three buckets are shown with
 * their real hand-painted art (the same characters/pots the 3D garden uses)
 * instead of emoji, so a 9-year-old immediately gets "who are these coaches"
 * and "where does my money go". All copy + the GameConfig contract come from
 * the frozen lib unchanged; only the presentation is new.
 */

import { useState } from 'react';
import { compoundingLine } from '@/app/lib/moneytree/coach';
import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import { MASCOTS, mascotById, type CoachPersona } from '@/app/lib/moneytree/mascots';
import { BUCKETS, type Bucket, type ContributionFrequency, type GameConfig, type MascotId } from '@/app/lib/moneytree/types';

/** Hand-painted portrait for each coach (same art as the 3D garden). */
const COACH_IMG: Record<MascotId, string> = {
  wizard: '/mascot/sage.webp',
  robot: '/mascot/bit.webp',
  adventurer: '/mascot/robin.webp',
  hero: '/mascot/nova.webp',
};

/** Illustrated pot for each bucket (same art as the 3D garden). */
const BUCKET_IMG: Record<Bucket, string> = {
  safe: '/env/bucket-safe.webp',
  growth: '/env/bucket-growth.webp',
  moonshot: '/env/bucket-moonshot.webp',
};

/** Per-persona accent color, used for the selected-coach ring + badge. */
const PERSONA_COLOR: Record<CoachPersona, string> = {
  bold: '#E8477E',
  balanced: '#7C5CFF',
  calm: '#3A86E0',
  cautious: '#2FA96A',
};

const BUCKET_ACCENT: Record<Bucket, string> = {
  safe: '#2FA96A',
  growth: '#3A86E0',
  moonshot: '#E8477E',
};

/** How risky each bucket is, 1-3, shown as filled dots. */
const BUCKET_RISK: Record<Bucket, number> = { safe: 1, growth: 2, moonshot: 3 };

const FREQUENCIES: { id: ContributionFrequency; label: string; sub: string }[] = [
  { id: 'weekly', label: 'Every week', sub: 'like allowance' },
  { id: 'monthly', label: 'Every month', sub: 'a little often' },
  { id: 'yearly', label: 'Every year', sub: 'once a year' },
  { id: 'once', label: 'Just once', sub: 'one big start' },
];

const START_PRESETS = [50, 100, 250, 500];
const ADD_PRESETS = [5, 10, 20, 50];

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/** A big, tappable dollar control: −/+ steppers, a large amount, quick presets. */
function AmountCard({
  title,
  hint,
  value,
  onChange,
  step,
  presets,
  accent,
}: {
  title: string;
  hint: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  presets: number[];
  accent: string;
}) {
  const stepBtn = (delta: number, label: string) => (
    <button
      type="button"
      aria-label={label}
      onClick={() => onChange(Math.max(0, value + delta))}
      className="grid place-items-center rounded-full transition-transform active:scale-90"
      style={{ width: 44, height: 44, border: 'none', cursor: 'pointer', background: '#F1EEFA', color: accent, fontSize: 24, fontWeight: 800, lineHeight: 1 }}
    >
      {delta < 0 ? '−' : '+'}
    </button>
  );

  return (
    <div className="rounded-3xl p-4 sm:p-5" style={{ background: '#fff', boxShadow: '0 10px 30px -18px rgba(60,40,90,0.35)', border: '1px solid #F0ECFB' }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: '#2A2740' }}>{title}</div>
      <div style={{ fontSize: 12.5, color: '#8480A0', marginTop: 2 }}>{hint}</div>
      <div className="flex items-center justify-between gap-2" style={{ marginTop: 14 }}>
        {stepBtn(-step, `Less ${title}`)}
        <div className="font-display tabular-nums" style={{ fontWeight: 700, fontSize: 34, color: accent, letterSpacing: '-1px' }}>
          ${value.toLocaleString()}
        </div>
        {stepBtn(step, `More ${title}`)}
      </div>
      <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
        {presets.map((p) => {
          const on = value === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className="rounded-full transition-colors"
              style={{
                border: `1.5px solid ${on ? accent : '#E7E2F5'}`,
                background: on ? accent : '#fff',
                color: on ? '#fff' : '#6E6A85',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                padding: '7px 14px',
                minHeight: 36,
              }}
            >
              ${p}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionTitle({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5" style={{ marginBottom: 12 }}>
      <span
        className="grid place-items-center rounded-full font-display"
        style={{ width: 28, height: 28, background: '#2FA96A', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}
      >
        {step}
      </span>
      <h2 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: '#22203A', margin: 0 }}>
        {children}
      </h2>
    </div>
  );
}

export default function SetupScreen({ onStart }: { onStart: (config: GameConfig) => void }) {
  const [startAmount, setStartAmount] = useState(100);
  const [contributionAmount, setContributionAmount] = useState(20);
  const [frequency, setFrequency] = useState<ContributionFrequency>('monthly');
  const [years, setYears] = useState(10);
  const [mascot, setMascot] = useState<MascotId>('wizard');

  const coach = mascotById(mascot);
  const coachColor = PERSONA_COLOR[coach.persona];

  const start = () => onStart({ startAmount, contributionAmount, frequency, years, mascot, seed: randomSeed() });

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(180deg, #FFF4E4 0%, #FDEAD9 34%, #EAF6EC 100%)' }}
    >
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-10">
        {/* Hero */}
        <div className="text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full"
            style={{ background: '#DCF5E5', color: '#1E8F57', fontWeight: 800, fontSize: 13, padding: '8px 15px' }}
          >
            🌳 Money Tree · Grow or Bust
          </span>
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 700, letterSpacing: '-1px', margin: '14px 0 6px', color: '#20233A' }}
          >
            Build your money plan
          </h1>
          <p style={{ fontSize: 15, color: '#6E6A85', maxWidth: 520, margin: '0 auto' }}>
            Choose how much to plant, how often, and for how long. Then pick a coach and grow your tree!
          </p>
        </div>

        {/* 1 · How much */}
        <div style={{ marginTop: 30 }}>
          <SectionTitle step={1}>How much money?</SectionTitle>
          <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <AmountCard title="I'm starting with" hint="Money you have right now" value={startAmount} onChange={setStartAmount} step={10} presets={START_PRESETS} accent="#2FA96A" />
            <AmountCard title="I'll keep adding" hint="A little more each time" value={contributionAmount} onChange={setContributionAmount} step={5} presets={ADD_PRESETS} accent="#3A86E0" />
          </div>
        </div>

        {/* 2 · How often */}
        <div style={{ marginTop: 28 }}>
          <SectionTitle step={2}>How often do you add?</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {FREQUENCIES.map((f) => {
              const on = frequency === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrequency(f.id)}
                  aria-pressed={on}
                  className="rounded-2xl text-left transition-transform active:scale-95"
                  style={{
                    cursor: 'pointer',
                    padding: '12px 14px',
                    minHeight: 66,
                    border: `2px solid ${on ? '#7C5CFF' : '#EDE9F8'}`,
                    background: on ? '#7C5CFF' : '#fff',
                    boxShadow: on ? '0 10px 22px -12px rgba(124,92,255,0.7)' : '0 6px 18px -14px rgba(60,40,90,0.4)',
                  }}
                >
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 14.5, color: on ? '#fff' : '#2A2740' }}>{f.label}</div>
                  <div style={{ fontSize: 11.5, color: on ? 'rgba(255,255,255,0.85)' : '#9A95B4', marginTop: 2 }}>{f.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 · How long */}
        <div style={{ marginTop: 28 }}>
          <SectionTitle step={3}>How long will it grow?</SectionTitle>
          <div
            className="flex items-center justify-between rounded-3xl px-5 py-4"
            style={{ background: '#fff', border: '1px solid #F0ECFB', boxShadow: '0 10px 30px -18px rgba(60,40,90,0.35)' }}
          >
            <button
              type="button"
              aria-label="Fewer years"
              onClick={() => setYears((y) => Math.max(1, y - 1))}
              className="grid place-items-center rounded-full transition-transform active:scale-90"
              style={{ width: 48, height: 48, border: 'none', cursor: 'pointer', background: '#F1EEFA', color: '#2FA96A', fontSize: 26, fontWeight: 800 }}
            >
              −
            </button>
            <div className="text-center">
              <div className="font-display" style={{ fontSize: 40, fontWeight: 700, color: '#2FA96A', lineHeight: 1 }}>{years}</div>
              <div style={{ fontSize: 12.5, color: '#8480A0', marginTop: 3 }}>{years === 1 ? 'year' : 'years'} of growing</div>
            </div>
            <button
              type="button"
              aria-label="More years"
              onClick={() => setYears((y) => Math.min(40, y + 1))}
              className="grid place-items-center rounded-full transition-transform active:scale-90"
              style={{ width: 48, height: 48, border: 'none', cursor: 'pointer', background: '#F1EEFA', color: '#2FA96A', fontSize: 26, fontWeight: 800 }}
            >
              +
            </button>
          </div>
        </div>

        {/* 4 · Where money can go */}
        <div style={{ marginTop: 28 }}>
          <SectionTitle step={4}>Where can your money go?</SectionTitle>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            {BUCKETS.map((b) => {
              const p = BUCKET_PROFILES[b];
              const accent = BUCKET_ACCENT[b];
              return (
                <div key={b} className="rounded-3xl p-4" style={{ background: '#fff', border: `1.5px solid ${accent}22`, boxShadow: '0 10px 28px -18px rgba(60,40,90,0.35)' }}>
                  <div className="flex items-center gap-3">
                    <img src={BUCKET_IMG[b]} alt={p.label} width={56} height={56} style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />
                    <div>
                      <div className="font-display" style={{ fontWeight: 700, fontSize: 15, color: accent }}>{p.label}</div>
                      <div className="flex items-center gap-1" style={{ marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: '#9A95B4', fontWeight: 700 }}>RISK</span>
                        {[1, 2, 3].map((d) => (
                          <span key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: d <= BUCKET_RISK[b] ? accent : '#E7E2F5' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#4B4470', margin: '10px 0 0', lineHeight: 1.45 }}>{p.blurb}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 · Pick your coach */}
        <div style={{ marginTop: 30 }}>
          <SectionTitle step={5}>Pick your coach!</SectionTitle>
          <p style={{ fontSize: 13, color: '#6E6A85', margin: '-4px 0 14px 38px' }}>
            Each coach has their own style - they&rsquo;ll cheer you on and teach you as you play.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {MASCOTS.map((m) => {
              const active = m.id === mascot;
              const c = PERSONA_COLOR[m.persona];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMascot(m.id)}
                  aria-pressed={active}
                  className="relative rounded-3xl text-center transition-transform active:scale-95"
                  style={{
                    cursor: 'pointer',
                    padding: '16px 12px 14px',
                    background: active ? `${c}0F` : '#fff',
                    border: `2.5px solid ${active ? c : '#EDE9F8'}`,
                    boxShadow: active ? `0 16px 30px -14px ${c}99` : '0 8px 22px -16px rgba(60,40,90,0.5)',
                    transform: active ? 'translateY(-2px)' : 'none',
                  }}
                >
                  {active && (
                    <span
                      className="absolute grid place-items-center rounded-full"
                      style={{ top: 10, right: 10, width: 24, height: 24, background: c, color: '#fff', fontSize: 14, fontWeight: 800 }}
                    >
                      ✓
                    </span>
                  )}
                  <div
                    className="mx-auto grid place-items-center rounded-full overflow-hidden"
                    style={{ width: 92, height: 92, background: `${c}14`, border: `2px solid ${c}33` }}
                  >
                    <img src={COACH_IMG[m.id]} alt={m.name} width={92} height={92} style={{ width: 84, height: 84, objectFit: 'contain' }} />
                  </div>
                  <div className="font-display" style={{ fontWeight: 700, fontSize: 16, color: '#22203A', marginTop: 9 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: '#9A95B4', fontWeight: 600 }}>{m.role}</div>
                  <span
                    className="inline-block rounded-full"
                    style={{ marginTop: 8, background: c, color: '#fff', padding: '4px 11px', fontSize: 11, fontWeight: 800 }}
                  >
                    {m.personaLabel}
                  </span>
                  <p style={{ fontSize: 11.5, color: '#6E6A85', margin: '9px 0 0', lineHeight: 1.4 }}>{m.tagline}</p>
                </button>
              );
            })}
          </div>

          {/* Selected coach speaks - illustrated portrait + compounding lesson */}
          <div
            className="flex items-start gap-3 rounded-3xl"
            style={{ marginTop: 14, padding: '14px 16px', background: `${coachColor}0D`, border: `1.5px solid ${coachColor}33` }}
          >
            <div className="grid place-items-center rounded-full overflow-hidden flex-shrink-0" style={{ width: 52, height: 52, background: `${coachColor}18` }}>
              <img src={COACH_IMG[mascot]} alt={coach.name} width={52} height={52} style={{ width: 46, height: 46, objectFit: 'contain' }} />
            </div>
            <p style={{ fontSize: 13.5, color: '#3E3A5C', margin: 0, lineHeight: 1.45 }}>
              <b style={{ color: coachColor }}>{coach.name}:</b> {compoundingLine(coach, frequency)}
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={start}
          className="font-display w-full rounded-full transition-transform active:scale-[0.98]"
          style={{
            marginTop: 26,
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            background: 'linear-gradient(180deg, #4BC57F, #2F9E67)',
            fontWeight: 700,
            fontSize: 20,
            padding: '17px 22px',
            boxShadow: '0 18px 34px -12px rgba(47,158,103,0.75)',
          }}
        >
          🌱 Plant my tree &amp; play
        </button>
        <p style={{ fontSize: 11.5, lineHeight: 1.5, color: '#A8A2C0', marginTop: 12, textAlign: 'center' }}>
          A game for learning. Real investing goes up and down - no real money, no advice.
        </p>
      </div>
    </div>
  );
}
