'use client';

/**
 * GrowthBreakdown — explains what "planted" and "grew" actually mean, instead
 * of showing bare badges. Each row is labeled with a plain-language sentence,
 * and the math connecting them (planted + grew = total, grew ÷ planted = %) is
 * shown explicitly so the numbers aren't just decoration.
 */

import { money, percent } from '@/app/lib/moneytree/format';

export default function GrowthBreakdown({
  contributed,
  grew,
  growthPct,
  years,
  total,
}: {
  contributed: number;
  grew: number;
  growthPct: number | null;
  years: number;
  total: number;
}) {
  const years1 = years === 1 ? 'year' : 'years';
  const grewColor = grew >= 0 ? '#2F9E67' : '#C0392B';
  const grewBg = grew >= 0 ? '#EAFBF2' : '#FFECEC';

  return (
    <div style={{ background: '#FBFAFF', border: '1px solid #ECE7F8', borderRadius: 16, padding: 14, marginTop: 14, textAlign: 'left' }}>
      <div className="font-display" style={{ fontWeight: 700, fontSize: 13, color: '#1C1F2E', marginBottom: 10 }}>
        How your {money(total)} breaks down
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>🪙</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1F2E' }}>
            You planted {money(contributed)}
          </div>
          <p style={{ fontSize: 11.5, color: '#6E6A85', margin: '2px 0 0', lineHeight: 1.4 }}>
            This is your own money — everything you started with, plus every coin you added over {years} {years1}.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{grew >= 0 ? '✨' : '📉'}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: grewColor }}>
            {grew >= 0 ? `It grew by ${money(grew)}` : `It lost ${money(Math.abs(grew))}`}
          </div>
          <p style={{ fontSize: 11.5, color: '#6E6A85', margin: '2px 0 0', lineHeight: 1.4 }}>
            {grew >= 0
              ? `This is extra money you didn&apos;t put in yourself — it&apos;s what your investments earned on their own over ${years} ${years1}, through compounding.`
              : `This wasn&apos;t money you added — it&apos;s value your investments lost over ${years} ${years1} because of risky bets or a market crash.`}
          </p>
        </div>
      </div>

      {growthPct !== null && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>{grew >= 0 ? '📈' : '📉'}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: grewColor }}>
              {percent(growthPct)} total growth
            </div>
            <p style={{ fontSize: 11.5, color: '#6E6A85', margin: '2px 0 0', lineHeight: 1.4 }}>
              That&apos;s {money(Math.abs(grew))} ÷ {money(contributed)} planted — how much bigger (or smaller) your money became compared to what you put in.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E3DCF5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11.5, color: '#8480A0' }}>
        <span style={{ fontWeight: 700, color: '#1C1F2E' }}>{money(contributed)}</span>
        <span>planted</span>
        <span style={{ fontWeight: 700 }}>{grew >= 0 ? '+' : '−'}</span>
        <span style={{ fontWeight: 700, color: grewColor }}>{money(Math.abs(grew))}</span>
        <span>{grew >= 0 ? 'grew' : 'lost'}</span>
        <span style={{ fontWeight: 700 }}>=</span>
        <span style={{ fontWeight: 700, color: '#6B4EFF' }}>{money(total)}</span>
        <span>final tree value</span>
      </div>

      <div style={{ background: grewBg, borderRadius: 10, padding: '8px 10px', marginTop: 10, fontSize: 11.5, color: grewColor, fontWeight: 600, textAlign: 'center' }}>
        💡 &ldquo;Planted&rdquo; is money you put in. &ldquo;Grew&rdquo; is money your investments made for you — that&apos;s the whole point of investing!
      </div>
    </div>
  );
}
