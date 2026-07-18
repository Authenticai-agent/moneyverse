'use client';

/**
 * CoachPicker - lets the player choose which of the four coaches stands beside
 * the gardener and (later) does the teaching. Reads the real coach registry
 * from the frozen game lib so names/personas match the game; the creature
 * emoji here just reflects the illustrated art (dog, squirrel, etc.), since
 * the lib's stand-in emoji predates these characters.
 */

import { MASCOTS } from '@/app/lib/moneytree/mascots';
import type { MascotId } from '@/app/lib/moneytree/types';
import { useWorldStore } from './useWorldStore';

const CREATURE_EMOJI: Record<MascotId, string> = {
  wizard: '🧙',
  robot: '🤖',
  adventurer: '🐶',
  hero: '🐿️',
};

export function CoachPicker() {
  const selected = useWorldStore((s) => s.selectedCoachId);
  const setCoach = useWorldStore((s) => s.setSelectedCoach);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 15,
        display: 'flex',
        gap: 6,
        padding: 8,
        borderRadius: 16,
        background: 'rgba(24,20,42,0.42)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 10px 28px -14px rgba(0,0,0,0.5)',
      }}
    >
      {MASCOTS.map((m) => {
        const active = m.id === selected;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setCoach(m.id)}
            title={`${m.name} — ${m.tagline}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              width: 60,
              padding: '7px 4px',
              borderRadius: 12,
              cursor: 'pointer',
              border: active ? '2px solid #FFD84D' : '2px solid transparent',
              background: active ? 'rgba(255,216,77,0.18)' : 'rgba(255,255,255,0.08)',
              color: '#fff',
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{CREATURE_EMOJI[m.id]}</span>
            <span style={{ fontSize: 12, fontWeight: 800 }}>{m.name}</span>
            <span style={{ fontSize: 9.5, fontWeight: 600, opacity: 0.85, textAlign: 'center', lineHeight: 1.15 }}>
              {m.personaLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
