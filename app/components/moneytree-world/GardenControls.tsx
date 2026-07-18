'use client';

/**
 * GardenControls - the on-screen control bar that replaces walking to
 * stations entirely. The player stands still, watching the garden, and does
 * everything from here: toss a coin into each bucket, ring the bell to grow
 * the year, and cash out. Every button calls a useWorldStore action directly
 * (no proximity, no 'E' key), so a tap always does exactly what it says - and
 * the 3D garden (coin piles, bell swing, tree growth) still reacts as the
 * diegetic feedback.
 *
 * Wrapped in a translucent "glass" panel so the text and buttons stay legible
 * over the bright garden, with a 10-slot coin tray that fills (and colors
 * itself per bucket, from coinHistory) as coins are planted.
 *
 * Responsive: on a narrow phone the panel tightens up and the actions split
 * into two rows - a full-width primary "Grow the year" below a compact
 * Undo / Cash out row - so the primary button never wraps unevenly and every
 * control stays a comfortable touch target.
 */

import { useEffect, useState } from 'react';
import { money } from '@/app/lib/moneytree/format';
import { isMuted, setMuted, sfx } from '@/app/lib/moneytree/sound';
import { BUCKETS, type Bucket } from '@/app/lib/moneytree/types';
import { BUCKET_COLOR, BUCKET_LABEL } from './GardenPlot';
import { COINS_PER_YEAR, useWorldStore } from './useWorldStore';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

const ACTION_MIN_HEIGHT = 46; // comfortable touch target

export function GardenControls() {
  const coinsThisYear = useWorldStore((s) => s.coinsThisYear);
  const coinHistory = useWorldStore((s) => s.coinHistory);
  const portfolio = useWorldStore((s) => s.portfolio);
  const year = useWorldStore((s) => s.year);
  const yearlyDeposit = useWorldStore((s) => s.yearlyDeposit);
  const addCoin = useWorldStore((s) => s.addCoin);
  const undoCoin = useWorldStore((s) => s.undoCoin);
  const resolveYear = useWorldStore((s) => s.resolveYear);
  const cashOut = useWorldStore((s) => s.cashOutBiggestBucket);

  const narrow = useMediaQuery('(max-width: 480px)');

  const [muted, setMutedState] = useState(false);
  useEffect(() => setMutedState(isMuted()), []);
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.click(); // a blip to confirm sound is back on
  };

  const placed = coinHistory.length;
  const remaining = COINS_PER_YEAR - placed;
  const canGrow = remaining <= 0;
  const total = portfolio.safe + portfolio.growth + portfolio.moonshot;
  // Each of this year's 10 coins is worth this slice of the deposit. The
  // deposit is fixed in the standalone demo and synced to the real per-year
  // contribution when embedded in a game (GardenStage).
  const coinValue = yearlyDeposit / COINS_PER_YEAR;
  // Dollars planted so far this year - the number that visibly climbs as you
  // toss; the tree `total` only changes when the year is grown.
  const placedValue = placed * coinValue;

  // Plant a coin, throwing-sound and all.
  const plant = (bucket: Bucket) => {
    addCoin(bucket);
    sfx.coinLaunch();
  };

  const takeBack = () => {
    undoCoin();
    sfx.coinBack();
  };

  // Ring the bell to resolve the year. The win/loss outcome cue is played by
  // whoever owns the result (the game host reacts to the resolved TurnResult),
  // so this only plays the action's own bell tone.
  const growYear = () => {
    resolveYear();
    sfx.grow();
  };

  // In the demo this sells a slice immediately; embedded in a game it opens the
  // Cash Out panel (the actual sale + its sound happen there). Either way this
  // is just the button tap.
  const doCashOut = () => {
    cashOut();
    sfx.click();
  };

  const undoButton = (
    <button
      type="button"
      onClick={takeBack}
      disabled={placed === 0}
      style={{
        minHeight: ACTION_MIN_HEIGHT,
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: 12,
        padding: '0 16px',
        fontWeight: 700,
        fontSize: 13,
        cursor: placed === 0 ? 'not-allowed' : 'pointer',
        color: '#fff',
        background: 'rgba(255,255,255,0.1)',
        opacity: placed === 0 ? 0.4 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      ↩ Undo
    </button>
  );

  const growButton = (
    <button
      type="button"
      onClick={growYear}
      disabled={!canGrow}
      style={{
        flex: 1,
        minHeight: ACTION_MIN_HEIGHT,
        border: 'none',
        borderRadius: 12,
        padding: '0 12px',
        fontWeight: 800,
        fontSize: 15,
        whiteSpace: 'nowrap',
        cursor: canGrow ? 'pointer' : 'not-allowed',
        color: '#fff',
        background: canGrow ? 'linear-gradient(180deg, #43C07E, #2F9E67)' : 'rgba(150,150,165,0.4)',
        boxShadow: canGrow ? '0 6px 16px -6px rgba(47,158,103,.8)' : 'none',
      }}
    >
      🔔 Grow the year
    </button>
  );

  const cashOutButton = total <= 0 ? null : (
    <button
      type="button"
      onClick={doCashOut}
      style={{
        minHeight: ACTION_MIN_HEIGHT,
        border: 'none',
        borderRadius: 12,
        padding: '0 16px',
        fontWeight: 800,
        fontSize: 13.5,
        cursor: 'pointer',
        color: '#7A5B0E',
        background: 'linear-gradient(180deg, #FFE27A, #FFD23F)',
        boxShadow: '0 6px 16px -6px rgba(243,194,24,.8)',
        whiteSpace: 'nowrap',
      }}
    >
      💰 Cash out
    </button>
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: narrow ? 10 : 16,
        transform: 'translateX(-50%)',
        zIndex: 15,
        width: 'min(580px, calc(100% - 16px))',
        padding: narrow ? 9 : 14,
        borderRadius: 20,
        background: 'rgba(24, 20, 42, 0.42)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 12px 32px -12px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: narrow ? 6 : 11,
      }}
    >
      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff', fontWeight: 700, fontSize: narrow ? 12.5 : 13.5, gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ background: 'rgba(255,255,255,0.16)', padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>Year {year}</span>
          <span style={{ fontSize: narrow ? 10 : 11, opacity: 0.8, fontWeight: 700, whiteSpace: 'nowrap' }}>🌳 {money(total)} tree</span>
        </div>
        {/* The dollars-planted-this-year readout - climbs as coins are tossed. */}
        <div style={{ textAlign: 'center', lineHeight: 1.05 }}>
          <div style={{ fontSize: narrow ? 16 : 18, fontWeight: 800 }}>
            {money(placedValue)}
            <span style={{ opacity: 0.6, fontWeight: 700, fontSize: narrow ? 11 : 12.5 }}> / {money(yearlyDeposit)}</span>
          </div>
          <div style={{ fontSize: narrow ? 9 : 10, opacity: 0.75, fontWeight: 600 }}>planted this year</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ opacity: 0.9, fontSize: narrow ? 11.5 : 12.5, whiteSpace: 'nowrap' }}>{remaining > 0 ? `${remaining} left` : 'Ready!'}</span>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.16)',
              borderRadius: 999,
              width: 28,
              height: 28,
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* What to do - shown until the first coin is tossed, then it gets out of
          the way (the readout + tray carry the state from there). */}
      {placed === 0 && (
        <div style={{ textAlign: 'center', fontSize: narrow ? 11 : 12, color: 'rgba(255,255,255,0.92)', lineHeight: 1.35 }}>
          👆 Tap a bucket below to drop a coin in — split all {COINS_PER_YEAR}, then <b>Grow the year</b>.
        </div>
      )}

      {/* Coin tray - 10 slots, filled per bucket color as coins are planted */}
      <div style={{ display: 'flex', gap: narrow ? 4 : 5, justifyContent: 'center' }}>
        {Array.from({ length: COINS_PER_YEAR }, (_, i) => {
          const bucket = coinHistory[i];
          const dot = narrow ? 11 : 15;
          return (
            <span
              key={i}
              style={{
                width: dot,
                height: dot,
                borderRadius: '50%',
                background: bucket ? BUCKET_COLOR[bucket] : 'transparent',
                border: bucket ? 'none' : '1.5px solid rgba(255,255,255,0.4)',
                boxShadow: bucket ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Bucket buttons */}
      <div style={{ display: 'flex', gap: narrow ? 7 : 9 }}>
        {BUCKETS.map((bucket) => (
          <BucketButton
            key={bucket}
            bucket={bucket}
            coins={coinsThisYear[bucket]}
            coinValue={coinValue}
            disabled={remaining <= 0}
            narrow={narrow}
            onToss={() => plant(bucket)}
          />
        ))}
      </div>

      {/* Action buttons - a single row on every size (Undo · Grow · Cash out).
          The primary Grow button flexes to fill; keeping one row keeps the
          whole panel short so it never swallows the game on a phone. */}
      <div style={{ display: 'flex', gap: narrow ? 7 : 9 }}>
        {undoButton}
        {growButton}
        {cashOutButton}
      </div>
    </div>
  );
}

function BucketButton({
  bucket,
  coins,
  coinValue,
  disabled,
  narrow,
  onToss,
}: {
  bucket: Bucket;
  coins: number;
  coinValue: number;
  disabled: boolean;
  narrow: boolean;
  onToss: () => void;
}) {
  const color = BUCKET_COLOR[bucket];
  const dot = narrow ? 15 : 24;
  return (
    <button
      type="button"
      onClick={onToss}
      disabled={disabled}
      style={{
        flex: 1,
        minWidth: 0,
        border: `2px solid ${color}`,
        borderRadius: 14,
        padding: narrow ? '6px 2px' : '9px 4px',
        background: disabled ? 'rgba(255,255,255,0.5)' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: narrow ? 2 : 4,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span style={{ width: dot, height: dot, borderRadius: '50%', background: color, boxShadow: `0 2px 6px -1px ${color}` }} />
      <span style={{ fontSize: narrow ? 11 : 12.5, fontWeight: 800, color: '#2C2A3A', whiteSpace: 'nowrap' }}>{BUCKET_LABEL[bucket]}</span>
      {/* Dollar + coin count on one line to keep the card short on mobile. */}
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 5, whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: narrow ? 12 : 13.5, fontWeight: 800, color }}>+{money(coins * coinValue)}</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#8480A0' }}>{coins}🪙</span>
      </span>
    </button>
  );
}
