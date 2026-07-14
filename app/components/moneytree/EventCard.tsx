'use client';

/**
 * EventCard — shown after a year resolves. Every year gets an explanation and a
 * "smart move" tip via yearInsight — an economic event's own copy when one
 * struck, or a rotating data-driven explanation on a calm year — so no year
 * ever shows bare, unexplained numbers.
 */

import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import { money, percent } from '@/app/lib/moneytree/format';
import { yearInsight } from '@/app/lib/moneytree/insights';
import { BUCKETS, type TurnResult } from '@/app/lib/moneytree/types';

const TONE_BG: Record<string, string> = {
  good: '#EAFBF2',
  bad: '#FFECEC',
  mixed: '#FFF7E6',
};
const TONE_FG: Record<string, string> = {
  good: '#2F9E67',
  bad: '#C0392B',
  mixed: '#B8860B',
};

export default function EventCard({ result, onContinue, isFinal }: { result: TurnResult; onContinue: () => void; isFinal: boolean }) {
  const insight = yearInsight(result);

  return (
    <div className="absolute inset-0 z-[9] flex items-center justify-center p-4" style={{ background: 'rgba(20,16,40,.35)', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 60px -20px rgba(30,20,60,.5)' }}>
        <div style={{ background: TONE_BG[insight.tone], color: TONE_FG[insight.tone], padding: '12px 16px', fontWeight: 800, fontSize: 15 }}>
          {insight.emoji} {insight.title} — Year {result.year}
        </div>
        <div style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 13, color: '#2C2A3A', margin: '0 0 10px' }}>{insight.whatHappened}</p>

          {/* per-bucket returns */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {BUCKETS.map((b) => {
              const r = result.returns[b];
              const up = r >= 0;
              return (
                <div key={b} style={{ flex: 1, textAlign: 'center', background: '#F6F5FB', borderRadius: 10, padding: '6px 4px' }}>
                  <div style={{ fontSize: 15 }}>{BUCKET_PROFILES[b].emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: up ? '#2F9E67' : '#C0392B' }}>{percent(r)}</div>
                </div>
              );
            })}
          </div>

          <p style={{ fontSize: 12.5, color: '#2F9E67', margin: '0 0 12px', background: '#EAFBF2', borderRadius: 10, padding: '8px 10px' }}>
            💡 {insight.smartMove}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10.5, color: '#8480A0', fontWeight: 600 }}>Tree value</div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#6B4EFF' }}>{money(result.total)}</div>
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="font-display"
              style={{ border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 999, background: '#6B4EFF', fontWeight: 600, fontSize: 15, padding: '11px 22px' }}
            >
              {isFinal ? 'See results 🎉' : 'Next year ▶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
