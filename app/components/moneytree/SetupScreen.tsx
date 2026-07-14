'use client';

/**
 * SetupScreen — the player builds their plan and picks a coach.
 * Emits a GameConfig to start the game.
 */

import { useState } from 'react';
import { compoundingLine } from '@/app/lib/moneytree/coach';
import { MASCOTS, mascotById } from '@/app/lib/moneytree/mascots';
import type { ContributionFrequency, GameConfig, MascotId } from '@/app/lib/moneytree/types';

const PURPLE = '#6B4EFF';

const FREQUENCIES: { id: ContributionFrequency; label: string }[] = [
  { id: 'weekly', label: 'every week' },
  { id: 'monthly', label: 'every month' },
  { id: 'yearly', label: 'every year' },
  { id: 'once', label: 'one time' },
];

function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

function NumberField({
  label,
  emoji,
  value,
  onChange,
  min = 0,
  prefix,
}: {
  label: string;
  emoji: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  prefix?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#413B5A' }}>
        {emoji} {label}
      </span>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `2px solid ${PURPLE}`, borderRadius: 12, padding: '8px 12px', background: '#fff', width: 'max-content' }}>
        {prefix && <span style={{ fontWeight: 700, color: PURPLE }}>{prefix}</span>}
        <input
          type="number"
          inputMode="numeric"
          min={min}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          aria-label={label}
          style={{ width: 84, border: 'none', outline: 'none', fontWeight: 700, fontSize: 18, color: PURPLE, background: 'transparent' }}
        />
      </div>
    </label>
  );
}

export default function SetupScreen({ onStart }: { onStart: (config: GameConfig) => void }) {
  const [startAmount, setStartAmount] = useState(100);
  const [contributionAmount, setContributionAmount] = useState(20);
  const [frequency, setFrequency] = useState<ContributionFrequency>('monthly');
  const [years, setYears] = useState(10);
  const [mascot, setMascot] = useState<MascotId>('wizard');

  const coach = mascotById(mascot);

  const start = () =>
    onStart({ startAmount, contributionAmount, frequency, years, mascot, seed: randomSeed() });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <span className="inline-flex items-center gap-2 rounded-full" style={{ background: '#EAFBF2', color: '#2F9E67', fontWeight: 600, fontSize: 12.5, padding: '7px 13px' }}>
        🌳 Money Tree · Grow or Bust
      </span>
      <h1 className="font-display" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.5px', margin: '12px 0 4px', color: '#1C1F2E' }}>
        Build your money plan
      </h1>
      <p style={{ fontSize: 14, color: '#6E6A85', marginBottom: 22 }}>
        Pick how much to invest, how often, and for how long. Then choose your coach and grow!
      </p>

      {/* inputs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <NumberField label="I'm starting with" emoji="🪙" prefix="$" value={startAmount} onChange={setStartAmount} />
        <NumberField label="I'll add" emoji="💧" prefix="$" value={contributionAmount} onChange={setContributionAmount} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#413B5A' }}>📅 How often</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {FREQUENCIES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrequency(f.id)}
                style={{
                  border: 'none', cursor: 'pointer', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, fontWeight: 700,
                  background: frequency === f.id ? PURPLE : '#EDE7FA', color: frequency === f.id ? '#fff' : '#5A4E86',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* years stepper */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 18 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#413B5A' }}>🌱 Grow it for (years)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" aria-label="Fewer years" onClick={() => setYears((y) => Math.max(1, y - 1))} style={{ width: 36, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#EDE7FA', fontWeight: 800, fontSize: 18, color: '#5A4E86' }}>−</button>
          <div style={{ border: `2px solid ${PURPLE}`, borderRadius: 12, padding: '8px 18px', minWidth: 64, textAlign: 'center', fontWeight: 700, fontSize: 18, color: PURPLE, background: '#fff' }}>{years}</div>
          <button type="button" aria-label="More years" onClick={() => setYears((y) => Math.min(40, y + 1))} style={{ width: 36, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#EDE7FA', fontWeight: 800, fontSize: 18, color: '#5A4E86' }}>+</button>
        </div>
      </div>

      {/* compounding coach line */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#F6F4FF', border: '1px solid #E6E0FA', borderRadius: 14, padding: 12, marginTop: 18 }}>
        <div style={{ fontSize: 30, lineHeight: 1 }}>{coach.emoji}</div>
        <p style={{ fontSize: 12.5, color: '#4B4470', margin: 0 }}>
          <b style={{ color: PURPLE }}>{coach.name}:</b> {compoundingLine(frequency)}
        </p>
      </div>

      {/* mascot picker */}
      <div style={{ marginTop: 20 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#413B5A' }}>Pick your coach</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
          {MASCOTS.map((m) => {
            const active = m.id === mascot;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMascot(m.id)}
                aria-pressed={active}
                style={{
                  cursor: 'pointer', textAlign: 'center', borderRadius: 14, padding: '12px 16px', minWidth: 96,
                  background: '#fff', border: `2px solid ${active ? PURPLE : '#ECE7F8'}`,
                  boxShadow: active ? '0 8px 20px -10px rgba(107,78,255,.6)' : 'none',
                }}
              >
                <div style={{ fontSize: 34 }}>{m.emoji}</div>
                <div className="font-display" style={{ fontWeight: 700, fontSize: 13, color: '#1C1F2E' }}>{m.name}</div>
                <div style={{ fontSize: 10, color: '#8480A0' }}>{m.role}</div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={start}
        className="font-display"
        style={{
          marginTop: 26, width: '100%', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 999,
          background: PURPLE, fontWeight: 600, fontSize: 18, padding: '15px 22px', boxShadow: '0 14px 30px -10px rgba(107,78,255,.7)',
        }}
      >
        🌱 Plant my tree & play
      </button>
      <p style={{ fontSize: 11, lineHeight: 1.45, color: '#A8A2C0', marginTop: 12, textAlign: 'center' }}>
        A game for learning. Real investing goes up and down — no real money, no advice.
      </p>
    </div>
  );
}
