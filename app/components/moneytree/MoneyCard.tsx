'use client';

/** MoneyCard — a small collectible concept card. */

import type { MoneyCard as MoneyCardType } from '@/app/lib/moneytree/types';

export default function MoneyCard({ card, fresh }: { card: MoneyCardType; fresh?: boolean }) {
  return (
    <div
      style={{
        width: 150, borderRadius: 14, padding: '12px 12px 14px', textAlign: 'center',
        background: 'linear-gradient(180deg,#FFFFFF,#F4F1FF)', border: `2px solid ${fresh ? '#6B4EFF' : '#E8E2F8'}`,
        boxShadow: fresh ? '0 10px 24px -12px rgba(107,78,255,.6)' : 'none', position: 'relative',
      }}
    >
      {fresh && (
        <span style={{ position: 'absolute', top: -9, right: -6, background: '#6B4EFF', color: '#fff', fontSize: 9, fontWeight: 800, borderRadius: 999, padding: '2px 7px' }}>NEW</span>
      )}
      <div style={{ fontSize: 30 }}>{card.emoji}</div>
      <div className="font-display" style={{ fontWeight: 700, fontSize: 13, color: '#1C1F2E', margin: '2px 0 4px' }}>{card.concept}</div>
      <p style={{ fontSize: 10.5, color: '#6E6A85', margin: 0, lineHeight: 1.35 }}>{card.blurb}</p>
    </div>
  );
}
