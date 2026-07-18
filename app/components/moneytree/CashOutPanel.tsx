'use client';

/**
 * CashOutPanel - sell shares out of any bucket mid-game, restyled to match the
 * game-card look (rounded card, tone banner, chunky buttons, the coach's
 * painted portrait). Proceeds become cash (no longer invested); the coach
 * reacts in-character so the trade-off is explained the moment it happens. All
 * copy/props come from the frozen lib unchanged.
 */

import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import { money } from '@/app/lib/moneytree/format';
import type { Mascot } from '@/app/lib/moneytree/mascots';
import { BUCKETS, type Bucket, type MascotId, type Portfolio } from '@/app/lib/moneytree/types';

const COACH_IMG: Record<MascotId, string> = {
  wizard: '/mascot/sage.png',
  robot: '/mascot/bit.png',
  adventurer: '/mascot/robin.png',
  hero: '/mascot/nova.png',
};

const BUCKET_COLOR: Record<Bucket, string> = { safe: '#2FA96A', growth: '#3A86E0', moonshot: '#E8477E' };

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
  greeting?: string;
  onSell: (bucket: Bucket, fraction: number) => void;
  onClose: () => void;
}) {
  const coachImg = COACH_IMG[mascot.id];

  return (
    <div className="absolute inset-0 z-[20] flex items-center justify-center p-3" style={{ background: 'rgba(18,14,34,.5)', backdropFilter: 'blur(3px)' }}>
      <style>{`
        @keyframes mtgCardIn { from { opacity: 0; transform: translateY(14px) scale(.95); } to { opacity: 1; transform: none; } }
        .mtg-card { animation: mtgCardIn .38s cubic-bezier(.2,.9,.3,1.2); }
        .mtg-btn { transition: transform .15s ease, box-shadow .15s ease, background .15s ease; }
        .mtg-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .mtg-btn:active:not(:disabled) { transform: translateY(0) scale(.98); }
        @media (prefers-reduced-motion: reduce) { .mtg-card { animation: none !important; } }
      `}</style>

      <div
        className="mtg-card"
        style={{ width: '100%', maxWidth: 'clamp(460px, 42vw, 600px)', maxHeight: '94%', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 26, overflow: 'hidden', boxShadow: '0 30px 70px -22px rgba(30,18,60,.6)' }}
      >
        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg,#FFD36A,#F0A324)', padding: '15px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span className="font-display" style={{ color: '#6B4A08', fontWeight: 700, fontSize: 'clamp(18px, 1.5vw, 24px)' }}>💰 Cash Out</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="mtg-btn"
            style={{ border: 'none', background: 'rgba(255,255,255,.55)', color: '#6B4A08', width: 32, height: 32, borderRadius: 999, fontSize: 15, fontWeight: 800, cursor: 'pointer', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px 4px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          <p style={{ fontSize: 'clamp(12.5px, .95vw, 15px)', color: '#4B4470', margin: '0 0 14px', lineHeight: 1.5 }}>
            Take money out of any bucket to turn it into cash. It&rsquo;s yours to keep - but it stops growing the moment you take it out. That&rsquo;s
            totally fine for a real <b style={{ color: '#2FA96A' }}>need</b> - just go easy on quick <b style={{ color: '#C08402' }}>wants</b>, since
            those cost you the most growth later.
          </p>

          {BUCKETS.map((b) => {
            const c = BUCKET_COLOR[b];
            const balance = portfolio[b];
            const empty = balance <= 0;
            return (
              <div key={b} style={{ background: `${c}10`, border: `1.5px solid ${c}33`, borderRadius: 16, padding: '11px 13px', marginBottom: 9, opacity: empty ? 0.55 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="font-display" style={{ fontSize: 'clamp(13px, 1vw, 16px)', fontWeight: 700, color: c }}>
                    {BUCKET_PROFILES[b].emoji} {BUCKET_PROFILES[b].label}
                  </span>
                  <span className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(14px, 1.1vw, 18px)', color: c }}>{money(balance)}</span>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  {SELL_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      disabled={empty}
                      onClick={() => onSell(b, p.fraction)}
                      className="mtg-btn"
                      style={{
                        flex: 1, border: `1.5px solid ${empty ? '#E7E2F5' : c}`, cursor: empty ? 'default' : 'pointer', borderRadius: 999,
                        background: empty ? '#fff' : c, color: empty ? '#B9B4CC' : '#fff', fontWeight: 800, fontSize: 'clamp(12px, .9vw, 14px)', minHeight: 42,
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
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#F1EEFA', border: '1.5px solid #E6E0FA', borderRadius: 16, padding: '10px 12px', marginTop: 8 }}>
              <div className="grid place-items-center" style={{ width: 42, height: 42, borderRadius: '50%', background: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                <img src={coachImg} alt={mascot.name} width={42} height={42} style={{ width: 38, height: 38, objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: 'clamp(12px, .92vw, 14.5px)', color: '#4B4470', margin: 0, lineHeight: 1.45 }}>
                <b className="font-display" style={{ color: '#6B4EFF' }}>{mascot.name}: </b>{sellMessage ?? greeting}
              </p>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div style={{ flexShrink: 0, borderTop: '1px solid #F0ECFB', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: '#fff' }}>
          <div>
            <div style={{ fontSize: 'clamp(10.5px, .85vw, 12.5px)', color: '#8B84A8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>💰 Cash in pocket</div>
            <div className="font-display" style={{ fontSize: 'clamp(22px, 2vw, 30px)', fontWeight: 700, color: '#2FA96A', lineHeight: 1 }}>{money(cashOut)}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-display mtg-btn"
            style={{ border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 999, background: 'linear-gradient(180deg,#7C5CFF,#6B4EFF)', fontWeight: 700, fontSize: 'clamp(15px, 1.2vw, 19px)', padding: 'clamp(12px,1vw,15px) clamp(24px,2vw,32px)', boxShadow: '0 12px 24px -10px rgba(107,78,255,.8)' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
