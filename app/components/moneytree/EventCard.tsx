'use client';

/**
 * EventCard - the end-of-year result popup, restyled as a kid-friendly game
 * "reward card". Every scrap of copy still comes from the frozen lib
 * (yearInsight / eventReactionLine / coachAdviceLine / moneyLessonLine /
 * sendOffLine / outcomeTone); this only re-presents it:
 *
 *  - a tone-colored top banner (good / tough / steady) with the event and year,
 *  - a big celebratory hero line - did your tree grow, and by how much,
 *  - the three bucket returns as playful chips that pop in,
 *  - the "what happened", "smart move" and "Money Lesson" as friendly blocks,
 *  - the chosen coach's painted portrait delivering their reaction + advice,
 *  - a sticky footer with the new tree value and a chunky Next-year button.
 *
 * Entrance motion is pure enhancement (elements are visible by default; the
 * animation only runs when it can), and it's disabled under reduced-motion.
 */

import { useState } from 'react';
import { totalOf } from '@/app/lib/moneytree/engine';
import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import { coachAdviceLine, eventReactionLine, outcomeTone, sendOffLine } from '@/app/lib/moneytree/coach';
import { money, percent } from '@/app/lib/moneytree/format';
import { moneyLessonLine, yearInsight } from '@/app/lib/moneytree/insights';
import type { Mascot } from '@/app/lib/moneytree/mascots';
import { BUCKETS, type Bucket, type MascotId, type TurnResult } from '@/app/lib/moneytree/types';
import { speakSequence, stopSpeaking, ttsSupported } from './tts';

/** Painted portrait for each coach (same art as the game world). */
const COACH_IMG: Record<MascotId, string> = {
  wizard: '/mascot/sage.png',
  robot: '/mascot/bit.png',
  adventurer: '/mascot/robin.png',
  hero: '/mascot/nova.png',
};

const BUCKET_COLOR: Record<Bucket, string> = { safe: '#2FA96A', growth: '#3A86E0', moonshot: '#E8477E' };

type Outcome = 'good' | 'bad' | 'flat';

const TONE: Record<Outcome, { soft: string; banner: string; ink: string; emoji: string; title: string }> = {
  good: { soft: '#E9FBF1', banner: 'linear-gradient(135deg,#5AD597,#2FA96A)', ink: '#1C7A4C', emoji: '🎉', title: 'Great year!' },
  bad: { soft: '#FFEEF1', banner: 'linear-gradient(135deg,#FF93A7,#E8477E)', ink: '#B02A54', emoji: '💪', title: 'Tough year' },
  flat: { soft: '#FFF7E6', banner: 'linear-gradient(135deg,#FFD06A,#EFA636)', ink: '#8F6410', emoji: '🌤️', title: 'Steady year' },
};

export default function EventCard({
  result,
  onContinue,
  isFinal,
  mascot,
}: {
  result: TurnResult;
  onContinue: () => void;
  isFinal: boolean;
  mascot: Mascot;
}) {
  const insight = yearInsight(result);
  const reaction = eventReactionLine(mascot, result);
  const lesson = moneyLessonLine(result.year);
  const advice = coachAdviceLine(mascot, result.allocationWeights);
  const hype = isFinal ? null : sendOffLine(mascot, result.year + 1);

  const tone = outcomeTone(result);
  const t = TONE[tone];
  const grew = result.total - totalOf(result.before) - result.contribution;
  const coachImg = COACH_IMG[mascot.id];

  const heroLine =
    tone === 'good'
      ? `Your money tree grew ${money(grew)} this year!`
      : tone === 'bad'
        ? `Your tree dipped ${money(Math.abs(grew))} this year — it happens!`
        : 'A calm year — your tree barely moved.';

  // Read-aloud: the game's narration in one voice, the coach's advice in
  // another, so the two roles sound distinct. Auto-plays when the card appears
  // (unless sound is muted); the speaker button replays or stops it.
  // Each passage is read separately with a beat of silence after it, so the
  // headline, the story, the smart move and the money lesson each land before
  // the next one starts.
  const passages = [
    `${insight.title}. ${heroLine}`,
    insight.whatHappened,
    `Smart move: ${insight.smartMove}`,
    `Money lesson: ${lesson}`,
  ];
  // No name prefix - the coach's own voice already identifies them, and the
  // card shows the name on screen.
  const coachSpeech = `${reaction} ${advice}`;

  const [reading, setReading] = useState(false);
  const startReading = () => {
    setReading(true);
    speakSequence(
      [
        // A ~1s beat after each passage, played as a volume-0 filler utterance.
        // Do NOT swap this for a punctuation-only utterance (read aloud as
        // "comma"), trailing punctuation (trimmed), or an [[slnc]] command
        // (read aloud as "slnc one thousand"). See tts.ts for the full list.
        ...passages.map((text) => ({ text, speaker: 'narrator' as const, pauseAfter: 1000 })),
        { text: coachSpeech, speaker: mascot.id },
      ],
      () => setReading(false),
    );
  };
  const toggleReading = () => {
    if (reading) {
      stopSpeaking();
      setReading(false);
    } else {
      startReading();
    }
  };

  // Read-aloud is opt-in: the card never speaks on its own, the player taps the
  // speaker button. (Auto-reading also fought React's dev double-render, which
  // made the card start, stop, then read again from the top.)

  return (
    <div
      className="absolute inset-0 z-[20] flex items-center justify-center p-3"
      style={{ background: 'rgba(18,14,34,.5)', backdropFilter: 'blur(3px)' }}
    >
      <style>{`
        @keyframes mtgCardIn { from { opacity: 0; transform: translateY(14px) scale(.95); } to { opacity: 1; transform: none; } }
        @keyframes mtgChipIn { from { transform: scale(.72); } to { transform: scale(1); } }
        @keyframes mtgTwinkle { 0%,100% { opacity: .25; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.15); } }
        .mtg-card { animation: mtgCardIn .38s cubic-bezier(.2,.9,.3,1.2); }
        .mtg-chip { animation: mtgChipIn .4s cubic-bezier(.2,.9,.3,1.4) both; }
        .mtg-next { transition: transform .15s ease, box-shadow .15s ease; }
        .mtg-next:hover { transform: translateY(-2px) scale(1.02); }
        .mtg-next:active { transform: translateY(0) scale(.98); }
        .mtg-spark { animation: mtgTwinkle 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .mtg-card, .mtg-chip, .mtg-spark { animation: none !important; }
        }
      `}</style>

      <div
        className="mtg-card"
        style={{
          width: '100%',
          // Grows on wider screens so it isn't a tiny hard-to-read card on
          // desktop, while width:100% still caps it on phones.
          maxWidth: 'clamp(460px, 42vw, 640px)',
          maxHeight: '94%',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRadius: 26,
          overflow: 'hidden',
          boxShadow: '0 30px 70px -22px rgba(30,18,60,.6)',
        }}
      >
        {/* Banner */}
        <div style={{ position: 'relative', background: t.banner, padding: '16px 18px 18px', flexShrink: 0, overflow: 'hidden' }}>
          {tone === 'good' && (
            <>
              <span className="mtg-spark" style={{ position: 'absolute', top: 12, left: '38%', fontSize: 14 }}>✨</span>
              <span className="mtg-spark" style={{ position: 'absolute', top: 30, left: '62%', fontSize: 11, animationDelay: '.6s' }}>✨</span>
              <span className="mtg-spark" style={{ position: 'absolute', top: 8, left: '80%', fontSize: 12, animationDelay: '1s' }}>⭐</span>
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="font-display"
              style={{ background: 'rgba(255,255,255,.28)', color: '#fff', fontWeight: 700, fontSize: 12, padding: '4px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}
            >
              Year {result.year}
            </div>
            <div className="font-display" style={{ color: '#fff', fontWeight: 700, fontSize: 'clamp(20px, 1.7vw, 27px)', lineHeight: 1, textShadow: '0 1px 2px rgba(0,0,0,.18)' }}>
              {t.emoji} {t.title}
            </div>
            {ttsSupported() && (
              <button
                type="button"
                onClick={toggleReading}
                aria-label={reading ? 'Stop reading' : 'Read this to me'}
                className="mtg-next"
                style={{ marginLeft: 'auto', flexShrink: 0, width: 36, height: 36, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,.3)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 16, position: 'relative', zIndex: 2 }}
              >
                {reading ? '⏹' : '🔊'}
              </button>
            )}
          </div>
          <div
            style={{
              marginTop: 12,
              background: 'rgba(255,255,255,.95)',
              borderRadius: 16,
              padding: '11px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{insight.emoji}</span>
            <div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(14px, 1.1vw, 17px)', color: '#2A2740' }}>{insight.title}</div>
              <div className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(15px, 1.25vw, 20px)', color: t.ink }}>{heroLine}</div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '14px 16px 4px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          {/* Read-aloud is opt-in, so tell the player it's there. */}
          {ttsSupported() && (
            <button
              type="button"
              onClick={toggleReading}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 'clamp(11.5px, .9vw, 13.5px)',
                color: '#6B4EFF',
                fontWeight: 600,
                padding: '0 0 10px',
              }}
            >
              {reading ? '⏹ Tap to stop reading' : '🔊 Want this read out loud? Tap the speaker.'}
            </button>
          )}

          {/* Bucket return chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {BUCKETS.map((b, i) => {
              const r = result.returns[b];
              const up = r >= 0;
              const c = BUCKET_COLOR[b];
              return (
                <div
                  key={b}
                  className="mtg-chip"
                  style={{ flex: 1, textAlign: 'center', background: `${c}12`, border: `1.5px solid ${c}33`, borderRadius: 14, padding: '9px 4px', animationDelay: `${0.08 + i * 0.07}s` }}
                >
                  <div style={{ fontSize: 'clamp(18px, 1.5vw, 24px)', lineHeight: 1 }}>{BUCKET_PROFILES[b].emoji}</div>
                  <div className="font-display" style={{ fontSize: 'clamp(14px, 1.2vw, 19px)', fontWeight: 700, color: c, marginTop: 3 }}>
                    {up ? '▲' : '▼'} {percent(r)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* What happened */}
          <p style={{ fontSize: 'clamp(13.5px, 1.05vw, 16.5px)', color: '#3A3550', lineHeight: 1.5, margin: '0 0 12px' }}>{insight.whatHappened}</p>

          {/* Smart move */}
          <div style={{ background: '#E9FBF1', borderRadius: 14, padding: '10px 12px', marginBottom: 10 }}>
            <div className="font-display" style={{ fontSize: 'clamp(11.5px, .9vw, 13.5px)', fontWeight: 700, color: '#1C7A4C', marginBottom: 2 }}>💡 Smart move</div>
            <p style={{ fontSize: 'clamp(12.5px, .95vw, 15px)', color: '#286A48', margin: 0, lineHeight: 1.45 }}>{insight.smartMove}</p>
          </div>

          {/* Money lesson */}
          <div style={{ background: '#EFEBFF', borderRadius: 14, padding: '10px 12px', marginBottom: 12 }}>
            <div className="font-display" style={{ fontSize: 'clamp(11.5px, .9vw, 13.5px)', fontWeight: 700, color: '#6B4EFF', marginBottom: 2 }}>🎓 Money Lesson</div>
            <p style={{ fontSize: 'clamp(12.5px, .95vw, 15px)', color: '#3F3670', margin: 0, lineHeight: 1.45 }}>{lesson}</p>
          </div>

          {/* Coach reaction + advice, with painted portrait */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <div className="grid place-items-center" style={{ width: 46, height: 46, borderRadius: '50%', background: '#F1EEFA', flexShrink: 0, overflow: 'hidden' }}>
              <img src={coachImg} alt={mascot.name} width={46} height={46} style={{ width: 42, height: 42, objectFit: 'contain' }} />
            </div>
            <div>
              <p style={{ fontSize: 'clamp(12.5px, .95vw, 15px)', color: '#4B4470', margin: '0 0 6px', lineHeight: 1.45 }}>
                <b className="font-display" style={{ color: '#6B4EFF' }}>{mascot.name}: </b>
                <span style={{ fontStyle: 'italic' }}>{reaction}</span>
              </p>
              <div style={{ background: '#FFF6E6', borderRadius: 12, padding: '8px 10px' }}>
                <p style={{ fontSize: 'clamp(12px, .92vw, 14.5px)', color: '#7A5B0E', margin: 0, lineHeight: 1.4 }}>
                  <b style={{ color: '#B8860B' }}>Next year, {mascot.name} says: </b>{advice}
                </p>
              </div>
            </div>
          </div>

          {hype && (
            <p className="font-display" style={{ fontSize: 'clamp(12.5px, .95vw, 15px)', color: '#6B4EFF', fontWeight: 700, margin: '0 0 8px 56px', lineHeight: 1.4 }}>{hype}</p>
          )}
        </div>

        {/* Sticky footer */}
        <div style={{ flexShrink: 0, borderTop: '1px solid #F0ECFB', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff' }}>
          <div>
            <div style={{ fontSize: 'clamp(10.5px, .85vw, 12.5px)', color: '#8B84A8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>🌳 Tree value</div>
            <div className="font-display" style={{ fontSize: 'clamp(26px, 2.2vw, 34px)', fontWeight: 700, color: '#2FA96A', lineHeight: 1 }}>{money(result.total)}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSpeaking(); // don't talk over the next year
              onContinue();
            }}
            className="font-display mtg-next"
            style={{
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              borderRadius: 999,
              background: 'linear-gradient(180deg,#7C5CFF,#6B4EFF)',
              fontWeight: 700,
              fontSize: 'clamp(16px, 1.3vw, 20px)',
              padding: 'clamp(13px, 1.1vw, 16px) clamp(24px, 2vw, 32px)',
              whiteSpace: 'nowrap',
              boxShadow: '0 12px 24px -10px rgba(107,78,255,.8)',
            }}
          >
            {isFinal ? 'See results 🎉' : 'Next year ▶'}
          </button>
        </div>
      </div>
    </div>
  );
}
