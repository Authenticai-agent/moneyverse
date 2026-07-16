'use client';

/**
 * SellComparison - only shown if the player cashed out during the game.
 * Lays out exactly what selling did: how much is still growing in the tree,
 * how much cash was locked in, and what the same money would be worth today
 * if it had never been sold at all - framed around needs vs wants, so
 * spending on something real and affordable reads as a smart choice, not a
 * mistake, while impulse "wants" still get called out as the real cost.
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
        💰 You took some money out along the way
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

      <div style={{ background: cost > 0 ? '#FFF3E0' : '#EAFBF2', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: cost > 0 ? '#B8860B' : '#2F9E67', marginBottom: 3 }}>
          🔮 If it had stayed invested: {money(shadowTotal)}
        </div>
        <p style={{ fontSize: 11.5, color: '#6E6A85', margin: 0, lineHeight: 1.4 }}>
          {cost > 0
            ? `That money stopped growing the moment you took it out - it would be worth ${money(cost)} more today if you'd left it in. That's totally fine if it went toward something you really needed, or something you'd saved up for and could truly afford - that's smart money, not a mistake. Just go easy on quick "wants", since those are what quietly cost you the most future growth.`
            : `This time, selling didn't even cost you future growth - things happened to go your way afterward. Lucky! But the real test isn't whether it worked out - it's whether you spent it on something you truly needed (or saved up for and could afford), not just a quick want.`}
        </p>
      </div>

      <div style={{ background: '#EEF2FF', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6B4EFF', marginBottom: 3 }}>🎯 Need vs Want</div>
        <p style={{ fontSize: 11.5, color: '#4B4470', margin: 0, lineHeight: 1.4 }}>
          A <b style={{ color: '#2F9E67' }}>need</b> is something you truly must have, or something you&rsquo;ve been saving toward for a long
          time - like that bike you&rsquo;ve been dreaming about. A <b style={{ color: '#B8860B' }}>want</b> is something that sounds fun
          right now but you&rsquo;d forget about in a week. Spending on a real need you can afford is a smart move, not something to feel bad
          about!
        </p>
      </div>
    </div>
  );
}
