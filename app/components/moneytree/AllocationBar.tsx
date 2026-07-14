'use client';

/**
 * AllocationBar — the bottom action bar where the player splits this year's
 * coins across the three buckets, then grows the year.
 */

import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import { normalizeAllocation } from '@/app/lib/moneytree/engine';
import { money } from '@/app/lib/moneytree/format';
import { BUCKETS, type Allocation, type Bucket } from '@/app/lib/moneytree/types';

const BUCKET_TINT: Record<Bucket, { bg: string; fg: string; border: string }> = {
  safe: { bg: '#EAFBF2', fg: '#2F9E67', border: '#CDEFDD' },
  growth: { bg: '#EAF2FF', fg: '#3A6DD8', border: '#CFE0FF' },
  moonshot: { bg: '#FFEAF0', fg: '#D8407A', border: '#FFD0DE' },
};

export default function AllocationBar({
  coins,
  allocation,
  onChange,
  onGrow,
  disabled,
}: {
  coins: number;
  allocation: Allocation;
  onChange: (a: Allocation) => void;
  onGrow: () => void;
  disabled?: boolean;
}) {
  const weights = normalizeAllocation(allocation);

  const bump = (b: Bucket, delta: number) => {
    onChange({ ...allocation, [b]: Math.max(0, Math.round((allocation[b] + delta) * 10) / 10) });
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[6]"
      style={{ background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(8px)', borderTop: '1px solid #E3EFE6', padding: '12px 14px 14px' }}
    >
      <div style={{ textAlign: 'center', fontSize: 12, color: '#6E6A85', marginBottom: 8 }}>
        Place your <b style={{ color: '#6B4EFF' }}>{money(coins)}</b> for this year
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {BUCKETS.map((b) => {
          const p = BUCKET_PROFILES[b];
          const tint = BUCKET_TINT[b];
          const pct = Math.round(weights[b] * 100);
          return (
            <div key={b} style={{ flex: '1 1 150px', maxWidth: 220, background: tint.bg, border: `1px solid ${tint.border}`, borderRadius: 12, padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: tint.fg }}>{p.emoji} {p.label}</span>
                <span className="font-display" style={{ fontWeight: 700, fontSize: 15, color: tint.fg }}>{pct}%</span>
              </div>
              <div style={{ fontSize: 10.5, color: '#6E6A85', margin: '2px 0 6px' }}>{money(weights[b] * coins)}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" aria-label={`Less ${p.label}`} disabled={disabled} onClick={() => bump(b, -1)} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 8, background: '#fff', color: tint.fg, fontWeight: 800, fontSize: 16, padding: '4px 0' }}>−</button>
                <button type="button" aria-label={`More ${p.label}`} disabled={disabled} onClick={() => bump(b, 1)} style={{ flex: 1, border: 'none', cursor: 'pointer', borderRadius: 8, background: '#fff', color: tint.fg, fontWeight: 800, fontSize: 16, padding: '4px 0' }}>+</button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onGrow}
        disabled={disabled}
        className="font-display"
        style={{
          marginTop: 10, width: '100%', border: 'none', cursor: disabled ? 'default' : 'pointer', color: '#fff', borderRadius: 999,
          background: disabled ? '#B9AEEB' : '#6B4EFF', fontWeight: 600, fontSize: 16, padding: '13px 22px',
          boxShadow: '0 12px 26px -12px rgba(107,78,255,.7)',
        }}
      >
        🌤️ Grow the year ▶
      </button>
    </div>
  );
}
