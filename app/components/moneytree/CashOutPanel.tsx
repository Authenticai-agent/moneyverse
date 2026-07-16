'use client';

/**
 * CashOutPanel - lets the player sell shares out of any bucket mid-game.
 * Proceeds become cash (no longer invested); the coach reacts in-character
 * right in the panel so the trade-off is explained the moment it happens.
 */

import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import { money } from '@/app/lib/moneytree/format';
import type { Mascot } from '@/app/lib/moneytree/mascots';
import { BUCKETS, type Bucket, type Portfolio } from '@/app/lib/moneytree/types';

const BUCKET_TINT: Record<Bucket, { bg: string; fg: string; border: string }> = {
  safe: { bg: '#EAFBF2', fg: '#2F9E67', border: '#CDEFDD' },
  growth: { bg: '#EAF2FF', fg: '#3A6DD8', border: '#CFE0FF' },
  moonshot: { bg: '#FFEAF0', fg: '#D8407A', border: '#FFD0DE' },
};

const SELL_PRESETS = [
  { label: '25%', fraction: 0.25 },
  { label: '50%', fraction: 0.5 },
  { label: 'All', fraction: 1 },
];

export default function CashOutPanel({
  portfolio,
  cashOut,
  mascot,
  sellMessage,
  greeting,
  onSell,
  onClose,
}: {
  portfolio: Portfolio;
  cashOut: number;
  mascot: Mascot;
  sellMessage: string | null;
  /** Shown when no sale has happened yet this time the panel is open. */
  greeting?: string;
  onSell: (bucket: Bucket, fraction: number) => void;
  onClose: () => void;
}) {
  return (
    // Rendered in-tree (not a document.body portal) and absolutely positioned
    // to fill the Stage exactly - a portal to document.body sits outside the
    // Stage's own DOM subtree, and when the native Fullscreen API is actually
    // engaged (not just the CSS-driven "maximized" state), the browser only
    // renders the fullscreened element's own subtree - anything portaled out
    // simply never appears on screen at all, no z-index can fix that.
    <div className="absolute inset-0 z-[9] flex items-center justify-center p-4" style={{ background: 'rgba(20,16,40,.4)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 60px -20px rgba(30,20,60,.5)' }}>
        <div style={{ background: '#FFF7E6', color: '#B8860B', padding: '12px 16px', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>💰 Cash Out</span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', color: '#B8860B', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 12.5, color: '#4B4470', margin: '0 0 12px' }}>
            Take money out of any bucket to turn it into cash. It&rsquo;s yours to keep - but it stops growing the moment you take it out.
            That&rsquo;s totally fine for a real <b style={{ color: '#2F9E67' }}>need</b> (or something you&rsquo;ve saved up for and can
            afford) - just go easy on quick <b style={{ color: '#B8860B' }}>wants</b>, since those are what cost you the most growth later.
          </p>

          {BUCKETS.map((b) => {
            const tint = BUCKET_TINT[b];
            const balance = portfolio[b];
            return (
              <div key={b} style={{ background: tint.bg, border: `1px solid ${tint.border}`, borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: tint.fg }}>
                    {BUCKET_PROFILES[b].emoji} {BUCKET_PROFILES[b].label}
                  </span>
                  <span className="font-display" style={{ fontWeight: 700, fontSize: 14, color: tint.fg }}>{money(balance)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {SELL_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      disabled={balance <= 0}
                      onClick={() => onSell(b, p.fraction)}
                      style={{
                        flex: 1, border: 'none', cursor: balance > 0 ? 'pointer' : 'default', borderRadius: 8,
                        background: '#fff', color: tint.fg, fontWeight: 700, fontSize: 12, padding: '6px 0',
                        opacity: balance > 0 ? 1 : 0.4,
                      }}
                    >
                      Sell {p.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {(sellMessage || greeting) && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#F6F4FF', border: '1px solid #E6E0FA', borderRadius: 12, padding: '9px 11px', marginTop: 6 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{mascot.emoji}</span>
              <p style={{ fontSize: 12, color: '#4B4470', margin: 0, lineHeight: 1.4 }}>
                <b style={{ color: '#6B4EFF' }}>{mascot.name}:</b> {sellMessage ?? greeting}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 10.5, color: '#8480A0', fontWeight: 600 }}>💰 Cash in pocket</div>
              <div className="font-display" style={{ fontSize: 20, fontWeight: 700, color: '#2F9E67' }}>{money(cashOut)}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="font-display"
              style={{ border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 999, background: '#6B4EFF', fontWeight: 600, fontSize: 15, padding: '11px 22px' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
