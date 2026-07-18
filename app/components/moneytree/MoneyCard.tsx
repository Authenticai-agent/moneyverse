'use client';

/** MoneyCard - a small collectible concept card, styled like a game reward. */

import type { MoneyCard as MoneyCardType } from '@/app/lib/moneytree/types';

export default function MoneyCard({ card, fresh }: { card: MoneyCardType; fresh?: boolean }) {
  const accent = fresh ? '#7C5CFF' : '#E4DDF6';
  return (
    <div
      style={{
        width: 154,
        borderRadius: 18,
        padding: '14px 12px 16px',
        textAlign: 'center',
        background: '#fff',
        border: `2.5px solid ${accent}`,
        boxShadow: fresh ? '0 14px 30px -14px rgba(124,92,255,.55)' : '0 8px 20px -14px rgba(60,40,90,.4)',
        position: 'relative',
      }}
    >
      {fresh && (
        <span
          className="font-display"
          style={{ position: 'absolute', top: -10, right: -6, background: 'linear-gradient(180deg,#7C5CFF,#6B4EFF)', color: '#fff', fontSize: 9.5, fontWeight: 700, borderRadius: 999, padding: '3px 9px', boxShadow: '0 6px 14px -6px rgba(107,78,255,.8)' }}
        >
          NEW ✨
        </span>
      )}
      {/* Emoji in a soft tinted medallion for a collectible feel. */}
      <div className="mx-auto grid place-items-center" style={{ width: 54, height: 54, borderRadius: '50%', background: fresh ? '#EFEBFF' : '#F5F3FB', fontSize: 28 }}>
        {card.emoji}
      </div>
      <div className="font-display" style={{ fontWeight: 700, fontSize: 13.5, color: '#22203A', margin: '8px 0 4px' }}>{card.concept}</div>
      <p style={{ fontSize: 11, color: '#6E6A85', margin: 0, lineHeight: 1.4 }}>{card.blurb}</p>
    </div>
  );
}
