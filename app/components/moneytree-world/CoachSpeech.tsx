'use client';

/**
 * CoachSpeech - the selected coach's live running commentary, rendered as a
 * real speech bubble pinned NEXT TO the floating Coach sprite (via drei's
 * <Html>, which projects a 3D anchor point to screen space and tracks it as the
 * camera reframes). It sits to the coach's left with a little tail pointing
 * back at them, so it reads as the wizard actually talking - not a separate
 * banner. Because it lives inside the Canvas, it must be rendered as a sibling
 * of <Coach/> (see World.tsx), not in the HTML overlay layer.
 *
 * The wording is all the frozen coach lib's, reflecting what the gardener is
 * doing right now:
 *  - while coins are being split, the coach's reaction to the in-progress
 *    allocation (allocationCoachLine) - a real risk warning past their
 *    persona's Moonshot threshold;
 *  - otherwise the rotating teaching line for this phase (playingPhaseLine).
 *
 * Hidden while the year-result popup is open so the two don't compete.
 */

import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { normalizeAllocation } from '@/app/lib/moneytree/engine';
import { allocationCoachLine, playingPhaseLine } from '@/app/lib/moneytree/coach';
import { mascotById } from '@/app/lib/moneytree/mascots';
import { BUCKETS } from '@/app/lib/moneytree/types';
import { speakSequence, stopSpeaking, ttsSupported } from '../moneytree/tts';
import { useWorldStore } from './useWorldStore';

// Anchor up by the floating coach's head, so the bubble hangs off the coach's
// left with its tail pointing back toward them.
const SPEECH_ANCHOR: [number, number, number] = [3.2, 6.4, -2.5];

export function CoachSpeech() {
  const coachId = useWorldStore((s) => s.selectedCoachId);
  const coinsThisYear = useWorldStore((s) => s.coinsThisYear);
  const portfolio = useWorldStore((s) => s.portfolio);
  const year = useWorldStore((s) => s.year);
  const resultOpen = useWorldStore((s) => s.lastResult !== null);

  const [reading, setReading] = useState(false);
  // Stop any speech if the bubble unmounts (coach change, popup opens, etc.).
  useEffect(() => () => stopSpeaking(), []);

  // Give the year-result popup the stage to itself.
  if (resultOpen) return null;

  const mascot = mascotById(coachId);
  const placed = BUCKETS.reduce((sum, b) => sum + coinsThisYear[b], 0);

  const reaction = placed > 0 ? allocationCoachLine(mascot, normalizeAllocation(coinsThisYear)) : null;
  const text = reaction?.text ?? playingPhaseLine(mascot, { year, portfolio });
  const warn = reaction?.warn ?? false;

  const bubbleBg = 'rgba(255,255,255,0.92)';

  // On-demand read-aloud in this coach's own voice (not auto - the bubble
  // updates live as coins are tossed, so auto-reading would talk over itself).
  const toggleReading = () => {
    if (reading) {
      stopSpeaking();
      setReading(false);
      return;
    }
    setReading(true);
    // Speak the line only - no name prefix (the coach's voice and the bubble
    // already say who's talking).
    speakSequence([{ text, speaker: coachId }], () => setReading(false));
  };

  return (
    <Html position={SPEECH_ANCHOR} zIndexRange={[6, 6]} style={{ pointerEvents: 'none' }}>
      {/* Shift the bubble to sit up-left of the anchor point. Width floors at
          230px so it stays a readable block on narrow phones (a plain vw cap
          collapsed it into a tall one-word-per-line column), and grows on
          big/full-screen displays. */}
      <div style={{ transform: 'translate(-100%, -50%)', width: 'max-content', maxWidth: 'clamp(230px, 40vw, 420px)' }}>
        <div
          style={{
            position: 'relative',
            background: bubbleBg,
            border: `2px solid ${warn ? 'rgba(214,140,20,0.6)' : 'rgba(255,255,255,0.9)'}`,
            borderRadius: 18,
            padding: '13px 17px',
            boxShadow: '0 12px 28px -12px rgba(40,30,60,0.5)',
            marginRight: 11,
          }}
        >
          <p style={{ margin: 0, fontSize: 'clamp(13px, 1.15vw, 18px)', lineHeight: 1.4, color: '#3A3550' }}>
            <b style={{ color: warn ? '#B8860B' : '#6B4EFF' }}>{warn ? '⚠️ ' : ''}{mascot.name}:</b> {text}
          </p>
          {ttsSupported() && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 7 }}>
              <button
                type="button"
                onClick={toggleReading}
                aria-label={reading ? 'Stop reading' : `Hear ${mascot.name} say this`}
                style={{
                  // The bubble is pointer-events:none so it never blocks the
                  // canvas; re-enable events just on this button.
                  pointerEvents: 'auto',
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: warn ? '#F6E7C8' : '#EEE9FB',
                  color: warn ? '#8A6400' : '#6B4EFF',
                  fontSize: 13,
                  lineHeight: 1,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {reading ? '⏹' : '🔊'}
              </button>
            </div>
          )}
          {/* Tail on the bubble's right edge, pointing toward the coach. */}
          <div
            style={{
              position: 'absolute',
              right: -11,
              top: '54%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderLeft: `12px solid ${bubbleBg}`,
            }}
          />
        </div>
      </div>
    </Html>
  );
}
