'use client';

/**
 * AllocationBar - the bottom readout for the year's coin toss. The actual
 * choice of where each coin goes happens in the 3D scene above (tap a
 * bucket to launch the next coin at it, see CoinToss.tsx) - this strip just
 * shows the running dollar split that results, offers one "undo last toss"
 * escape hatch, and holds the Cash Out / Grow the year actions.
 */

import { useState } from 'react';
import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import { money } from '@/app/lib/moneytree/format';
import { BUCKETS, type Bucket, type Portfolio } from '@/app/lib/moneytree/types';

const BUCKET_TINT: Record<Bucket, { bg: string; fg: string; border: string }> = {
  safe: { bg: '#EAFBF2', fg: '#2F9E67', border: '#CDEFDD' },
  growth: { bg: '#EAF2FF', fg: '#3A6DD8', border: '#CFE0FF' },
  moonshot: { bg: '#FFEAF0', fg: '#D8407A', border: '#FFD0DE' },
};

/**
 * Split `coins` across buckets by weight, rounding to whole dollars so the
 * three displayed amounts always sum exactly to `coins` (three independently
 * `Math.round`-ed shares can drift by a dollar - e.g. 34/33/33% of $50 rounds
 * to $17+$17+$17=$51). Uses the largest-remainder method: floor every share,
 * then hand out the few leftover dollars to the buckets with the biggest
 * fractional remainder.
 */
function splitDollars(allocation: Record<Bucket, number>, totalWeight: number, coins: number): Record<Bucket, number> {
  const target = Math.round(coins);
  const entries = BUCKETS.map((b) => {
    const exact = (allocation[b] / totalWeight) * coins;
    const floor = Math.floor(exact);
    return { b, floor, rem: exact - floor };
  });
  const result: Record<Bucket, number> = { safe: 0, growth: 0, moonshot: 0 };
  for (const e of entries) result[e.b] = e.floor;
  let remainder = target - entries.reduce((s, e) => s + e.floor, 0);
  const byRemainder = [...entries].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (remainder > 0) {
    result[byRemainder[i % byRemainder.length].b] += 1;
    remainder--;
    i++;
  }
  return result;
}

export default function AllocationBar({
  coins,
  numCoins,
  history,
  portfolio,
  onToss,
  onUndo,
  onGrow,
  onOpenCashOut,
  cashOut,
  canSell,
  disabled,
}: {
  coins: number;
  /** How many identical coins this year's deposit is split into for tossing. */
  numCoins: number;
  /** Ordered list of which bucket each tossed coin landed in so far. */
  history: Bucket[];
  /** Live bucket balances already invested, shown alongside the new split so the two never get confused. */
  portfolio: Portfolio;
  /** Tap a bucket card to toss the next coin into it - the same action as tapping the bucket in the 3D scene, kept here too since the 3D buckets aren't always reachable (camera angle, cut off by this very panel, etc). */
  onToss: (bucket: Bucket) => void;
  onUndo: () => void;
  onGrow: () => void;
  onOpenCashOut: () => void;
  cashOut: number;
  /** Whether there's anything invested yet to sell (false before the first year resolves). */
  canSell: boolean;
  disabled?: boolean;
}) {
  const [openInfo, setOpenInfo] = useState<Bucket | null>(null);

  const counts: Record<Bucket, number> = { safe: 0, growth: 0, moonshot: 0 };
  for (const b of history) counts[b]++;
  const placed = history.length;
  const allPlaced = placed >= numCoins;
  // No bucket gets a coin until the player actually taps it - unplaced coins
  // just aren't shown as money anywhere yet, rather than quietly defaulting
  // into Safe Seed. `placedValue` is the dollar worth of only the coins
  // tossed so far, so the split always sums to what's actually been placed,
  // not the year's full deposit.
  const placedValue = coins * (placed / (numCoins || 1));
  const dollarSplit = splitDollars(counts, placed || 1, placedValue);

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[6]"
      style={{ background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(8px)', borderTop: '1px solid #E3EFE6', padding: '10px 14px 14px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#6E6A85' }}>
          🪙 Toss your <b style={{ color: '#6B4EFF' }}>{money(coins)}</b> into the buckets - tap a bucket!
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', flex: '1 1 auto', maxWidth: 360, background: '#EEEAFB' }}>
          {BUCKETS.map((b) => (
            <div key={b} style={{ width: `${(counts[b] / (numCoins || 1)) * 100}%`, background: BUCKET_TINT[b].fg, transition: 'width .2s ease' }} />
          ))}
        </div>
        <span className="font-display" style={{ fontSize: 11.5, color: '#8480A0', whiteSpace: 'nowrap' }}>
          {history.length}/{numCoins} tossed
        </span>
        <button
          type="button"
          onClick={onUndo}
          disabled={disabled || history.length === 0}
          style={{
            border: '1px solid #E3DCF5', cursor: disabled || history.length === 0 ? 'default' : 'pointer', borderRadius: 999,
            background: '#fff', color: history.length === 0 ? '#C9C2DE' : '#6B4EFF', fontWeight: 700, fontSize: 12,
            padding: '10px 14px', minHeight: 40,
          }}
        >
          ↺ Undo
        </button>
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#8B7FC0', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 6px' }}>
        🪣 Your buckets — tap a card to add a coin
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {BUCKETS.map((b) => {
          const p = BUCKET_PROFILES[b];
          const tint = BUCKET_TINT[b];
          const canToss = !disabled && history.length < numCoins;
          return (
            <div
              key={b}
              role="button"
              tabIndex={canToss ? 0 : -1}
              aria-label={`Toss a coin into ${p.label}`}
              className={canToss ? 'mtg-bucket-card' : undefined}
              onClick={() => canToss && onToss(b)}
              onKeyDown={(e) => {
                if (canToss && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onToss(b);
                }
              }}
              style={{
                position: 'relative', flex: '1 1 150px', maxWidth: 240, background: tint.bg, border: `1.5px solid ${tint.border}`,
                borderTop: `3px solid ${tint.fg}`, borderRadius: 12, padding: '8px 10px 8px', cursor: canToss ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: tint.fg, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {p.emoji} {p.label}
                  <button
                    type="button"
                    aria-label={`What is ${p.label}? Tap to learn more`}
                    title={`What is ${p.label}?`}
                    aria-expanded={openInfo === b}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenInfo((cur) => (cur === b ? null : b));
                    }}
                    style={{
                      border: `1px solid ${tint.fg}`, cursor: 'pointer', borderRadius: '50%', width: 20, height: 20, lineHeight: '18px',
                      fontSize: 11, fontWeight: 800, padding: 0, background: openInfo === b ? tint.fg : 'rgba(255,255,255,.85)', color: openInfo === b ? '#fff' : tint.fg,
                    }}
                  >
                    ⓘ
                  </button>
                </span>
                <span className="font-display" style={{ fontWeight: 700, fontSize: 13, color: tint.fg }}>{counts[b]} 🪙</span>
              </div>
              <div style={{ fontSize: 10.5, color: '#6E6A85', margin: '2px 0 1px' }}>+{money(dollarSplit[b])} new</div>
              {portfolio[b] > 0 && (
                <div style={{ fontSize: 10, color: tint.fg, opacity: 0.75, margin: 0 }}>{money(portfolio[b])} already invested</div>
              )}
              {canToss && (
                <div style={{ fontSize: 10, fontWeight: 700, color: tint.fg, margin: '3px 0 0' }}>👆 Tap to add a coin</div>
              )}
              {openInfo === b && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute', left: 0, right: 0, bottom: 'calc(100% + 8px)', zIndex: 10,
                    fontSize: 11, color: '#4B4470', lineHeight: 1.45, background: '#fff', borderRadius: 10,
                    padding: '9px 10px', boxShadow: '0 10px 24px -10px rgba(30,20,60,.35)', border: `1px solid ${tint.border}`,
                    textAlign: 'left',
                  }}
                >
                  <p style={{ margin: '0 0 5px' }}>{p.blurb}</p>
                  <p style={{ margin: 0 }}>{p.realWorld}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {canSell && (
          <button
            type="button"
            onClick={onOpenCashOut}
            disabled={disabled}
            className="font-display"
            style={{
              border: '1.5px solid #F0DDA0', cursor: disabled ? 'default' : 'pointer', color: '#B8860B', borderRadius: 999,
              background: '#FFF7E6', fontWeight: 700, fontSize: 13, padding: '13px 16px', whiteSpace: 'nowrap',
            }}
          >
            💰{cashOut > 0 ? ` ${money(cashOut)}` : ' Cash Out'}
          </button>
        )}
        <button
          type="button"
          onClick={onGrow}
          disabled={disabled || !allPlaced}
          className="font-display"
          style={{
            flex: 1, border: 'none', cursor: disabled || !allPlaced ? 'default' : 'pointer', color: '#fff', borderRadius: 999,
            background: disabled || !allPlaced ? '#B9AEEB' : '#6B4EFF', fontWeight: 600, fontSize: 16, padding: '13px 22px',
            boxShadow: '0 12px 26px -12px rgba(107,78,255,.7)',
          }}
        >
          {allPlaced ? '🌤️ Grow the year ▶' : `🪙 Toss ${numCoins - placed} more coin${numCoins - placed === 1 ? '' : 's'} first`}
        </button>
      </div>
    </div>
  );
}
