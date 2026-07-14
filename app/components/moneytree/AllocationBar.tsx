'use client';

/**
 * AllocationBar — the bottom action bar where the player sets exactly what
 * percentage of this year's coins goes to each bucket, then grows the year.
 * Allocations are percentages that always sum to 100: bumping one bucket ±5%
 * rebalances the others, so the split is always valid and directly chosen.
 */

import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import { money } from '@/app/lib/moneytree/format';
import { BUCKETS, type Allocation, type Bucket } from '@/app/lib/moneytree/types';

const STEP = 5;

const BUCKET_TINT: Record<Bucket, { bg: string; fg: string; border: string }> = {
  safe: { bg: '#EAFBF2', fg: '#2F9E67', border: '#CDEFDD' },
  growth: { bg: '#EAF2FF', fg: '#3A6DD8', border: '#CFE0FF' },
  moonshot: { bg: '#FFEAF0', fg: '#D8407A', border: '#FFD0DE' },
};

/** Move `delta` percent onto `bucket`, taking from / giving to the others so the total stays 100. */
function rebalance(alloc: Allocation, bucket: Bucket, delta: number): Allocation {
  const others = BUCKETS.filter((b) => b !== bucket);
  const next: Allocation = { ...alloc };
  if (delta > 0) {
    let move = Math.min(delta, 100 - alloc[bucket]); // == min(delta, sum of others)
    if (move <= 0) return alloc;
    next[bucket] = alloc[bucket] + move;
    for (const o of [...others].sort((a, b) => alloc[b] - alloc[a])) {
      const take = Math.min(move, next[o]);
      next[o] -= take;
      move -= take;
      if (move <= 0) break;
    }
  } else {
    const give = Math.min(-delta, alloc[bucket]);
    if (give <= 0) return alloc;
    next[bucket] = alloc[bucket] - give;
    const largest = [...others].sort((a, b) => alloc[b] - alloc[a])[0];
    next[largest] += give;
  }
  return next;
}

export default function AllocationBar({
  coins,
  allocation,
  onChange,
  onGrow,
  onOpenCashOut,
  cashOut,
  disabled,
}: {
  coins: number;
  allocation: Allocation;
  onChange: (a: Allocation) => void;
  onGrow: () => void;
  onOpenCashOut: () => void;
  cashOut: number;
  disabled?: boolean;
}) {
  const total = BUCKETS.reduce((s, b) => s + allocation[b], 0) || 1;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[6]"
      style={{ background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(8px)', borderTop: '1px solid #E3EFE6', padding: '10px 14px 14px' }}
    >
      <div style={{ textAlign: 'center', fontSize: 12, color: '#6E6A85', marginBottom: 6 }}>
        Split your <b style={{ color: '#6B4EFF' }}>{money(coins)}</b> — set the percentages
      </div>

      {/* proportion bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
        {BUCKETS.map((b) => (
          <div key={b} style={{ width: `${(allocation[b] / total) * 100}%`, background: BUCKET_TINT[b].fg, transition: 'width .2s ease' }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {BUCKETS.map((b) => {
          const p = BUCKET_PROFILES[b];
          const tint = BUCKET_TINT[b];
          const pct = Math.round((allocation[b] / total) * 100);
          return (
            <div key={b} style={{ flex: '1 1 150px', maxWidth: 240, background: tint.bg, border: `1px solid ${tint.border}`, borderRadius: 12, padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: tint.fg }}>{p.emoji} {p.label}</span>
                <span className="font-display" style={{ fontWeight: 700, fontSize: 16, color: tint.fg }}>{pct}%</span>
              </div>
              <div style={{ fontSize: 10.5, color: '#6E6A85', margin: '2px 0 6px' }}>{money((allocation[b] / total) * coins)}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" aria-label={`Less ${p.label}`} disabled={disabled} onClick={() => onChange(rebalance(allocation, b, -STEP))} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 8, background: '#fff', color: tint.fg, fontWeight: 800, fontSize: 16, padding: '5px 0' }}>−{STEP}%</button>
                <button type="button" aria-label={`More ${p.label}`} disabled={disabled} onClick={() => onChange(rebalance(allocation, b, STEP))} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 8, background: '#fff', color: tint.fg, fontWeight: 800, fontSize: 16, padding: '5px 0' }}>+{STEP}%</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
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
        <button
          type="button"
          onClick={onGrow}
          disabled={disabled}
          className="font-display"
          style={{
            flex: 1, border: 'none', cursor: disabled ? 'default' : 'pointer', color: '#fff', borderRadius: 999,
            background: disabled ? '#B9AEEB' : '#6B4EFF', fontWeight: 600, fontSize: 16, padding: '13px 22px',
            boxShadow: '0 12px 26px -12px rgba(107,78,255,.7)',
          }}
        >
          🌤️ Grow the year ▶
        </button>
      </div>
    </div>
  );
}
