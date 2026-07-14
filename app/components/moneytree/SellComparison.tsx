'use client';

/**
 * SellComparison - only shown if the player cashed out during the game.
 * Lays out exactly what selling did: how much is still growing in the tree,
 * how much cash was locked in, and - the real lesson - what the same money
 * would be worth today if it had never been sold at all.
 */

import { money } from '@/app/lib/moneytree/format';

export default function SellComparison({
  treeValue,
  cashOut,
  total,
  shadowTotal,
}: {
  treeValue: number;
  cashOut: number;
  total: number;
  shadowTotal: number;
}) {
  const cost = shadowTotal - total;

  return (
    <div style={{ background: '#FFFBF0', border: '1px solid #F5E6C8', borderRadius: 16, padding: 14, marginTop: 14, textAlign: 'left' }}>
      <div className="font-display" style={{ fontWeight: 700, fontSize: 13, color: '#1C1F2E', marginBottom: 10 }}>
        💰 You cashed out along the way - here&rsquo;s what that cost
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ flex: '1 1 120px', background: '#fff', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 10.5, color: '#8480A0', fontWeight: 600 }}>🌳 Still growing</div>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: '#2F9E67' }}>{money(treeValue)}</div>
        </div>
        <div style={{ flex: '1 1 120px', background: '#fff', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 10.5, color: '#8480A0', fontWeight: 600 }}>💰 Cashed out</div>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: '#B8860B' }}>{money(cashOut)}</div>
        </div>
        <div style={{ flex: '1 1 120px', background: '#fff', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: 10.5, color: '#8480A0', fontWeight: 600 }}>= Your total</div>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: '#6B4EFF' }}>{money(total)}</div>
        </div>
      </div>

      <div style={{ background: cost > 0 ? '#FFECEC' : '#EAFBF2', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: cost > 0 ? '#C0392B' : '#2F9E67', marginBottom: 3 }}>
          🔮 If you had never sold: {money(shadowTotal)}
        </div>
        <p style={{ fontSize: 11.5, color: '#6E6A85', margin: 0, lineHeight: 1.4 }}>
          {cost > 0
            ? `Cashing out early cost you ${money(cost)} in future growth - that money stopped compounding the moment you sold it. That's the real price of selling early.`
            : `In this game, selling didn't cost you anything - the market moved in your favor after you cashed out. That's not always the case, so this was a bit lucky!`}
        </p>
      </div>
    </div>
  );
}
