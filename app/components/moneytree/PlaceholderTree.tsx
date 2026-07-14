'use client';

/**
 * PlaceholderTree - a lightweight 2D tree used while building the game loop.
 * Replaced by the 3D <TreeScene> in Step 8; kept as the reduced-motion / mobile
 * fallback afterwards.
 */

const COIN = 'radial-gradient(circle at 32% 28%, #FFECAE, #FFD84D 58%, #F3C218)';

export default function PlaceholderTree({ total, wilting }: { total: number; wilting?: boolean }) {
  const scale = 0.35 + Math.sqrt(Math.min(total, 50000) / 50000) * 0.95;
  const leaf = wilting
    ? 'radial-gradient(circle at 38% 32%, #D9C27A, #B79A45 70%)'
    : 'radial-gradient(circle at 38% 32%, #7BE3A3, #5FD38D 70%)';
  const coins = [total > 400, total > 1500, total > 4000, total > 10000, total > 20000];

  return (
    <div className="absolute left-1/2 z-[3] flex items-end justify-center" style={{ bottom: 96, transform: 'translateX(-50%)', width: 320, height: 340 }}>
      <div style={{ transform: `scale(${scale.toFixed(3)})`, transformOrigin: 'bottom center', transition: 'transform .8s cubic-bezier(.2,.9,.3,1)' }}>
        <div className="relative" style={{ width: 280, height: 330 }}>
          <div style={{ position: 'absolute', left: 127, bottom: 0, width: 26, height: 130, borderRadius: 12, background: 'linear-gradient(#B07A46, #8B5A2B)' }} />
          <div style={{ position: 'absolute', left: 75, bottom: 158, width: 160, height: 160, borderRadius: '50%', background: leaf, transition: 'background .8s ease' }} />
          <div style={{ position: 'absolute', left: 28, bottom: 118, width: 116, height: 116, borderRadius: '50%', background: leaf, transition: 'background .8s ease' }} />
          <div style={{ position: 'absolute', left: 162, bottom: 112, width: 124, height: 124, borderRadius: '50%', background: leaf, transition: 'background .8s ease' }} />
          {coins[0] && <Coin left={106} bottom={230} size={36} />}
          {coins[1] && <Coin left={58} bottom={168} size={30} />}
          {coins[2] && <Coin left={200} bottom={172} size={32} />}
          {coins[3] && <Coin left={150} bottom={266} size={28} />}
          {coins[4] && <Coin left={90} bottom={130} size={26} />}
        </div>
      </div>
    </div>
  );
}

function Coin({ left, bottom, size }: { left: number; bottom: number; size: number }) {
  return (
    <div style={{ position: 'absolute', left, bottom, width: size, height: size, borderRadius: '50%', background: COIN, boxShadow: '0 3px 8px rgba(243,194,24,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="font-display" style={{ fontWeight: 700, color: '#8A5A12', fontSize: size * 0.47 }}>$</span>
    </div>
  );
}
