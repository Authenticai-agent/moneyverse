'use client';

/** HUD - floating status chips over the 3D stage. */

import Link from 'next/link';
import { money, percent } from '@/app/lib/moneytree/format';
import { STAGE_THRESHOLDS } from '@/app/lib/moneytree/content';
import type { Stage } from '@/app/lib/moneytree/types';

function stageLabel(stage: Stage): string {
  const s = STAGE_THRESHOLDS.find((t) => t.stage === stage);
  return s ? `${s.emoji} ${s.label}` : '🌱 Seed';
}

/** Small green/red growth figure, or a muted dash when not computable. */
function GrowthStat({ label, fraction }: { label: string; fraction: number | null }) {
  if (fraction === null) {
    return (
      <span style={{ fontSize: 10.5, color: '#B4ABCE', fontWeight: 600 }}>
        {label} -
      </span>
    );
  }
  const up = fraction >= 0;
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, color: up ? '#2F9E67' : '#C0392B' }}>
      {label} {percent(fraction)}
    </span>
  );
}

const chip: React.CSSProperties = {
  background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(6px)', border: '1px solid #E3EFE6',
  borderRadius: 14, padding: '8px 14px', boxShadow: '0 10px 24px -14px rgba(60,120,80,.4)',
};

export default function HUD({
  total,
  stage,
  year,
  totalYears,
  best,
  yoy,
  totalGrowth,
  muted,
  onToggleMuted,
  maximized,
  onToggleMaximized,
}: {
  total: number;
  stage: Stage;
  year: number;
  totalYears: number;
  best: number;
  /** This year's actual investment return (excludes the new deposit's principal), or null before year 1 resolves. */
  yoy: number | null;
  /** Growth of combined wealth (tree + cashed-out) against everything contributed, or null before anything's been put in. */
  totalGrowth: number | null;
  muted: boolean;
  onToggleMuted: () => void;
  maximized: boolean;
  onToggleMaximized: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] flex items-start justify-between p-4">
      <div className="flex flex-col items-start gap-2">
        <Link
          href="/tools"
          prefetch={false}
          aria-label="Back to all tools"
          style={{
            pointerEvents: 'auto', cursor: 'pointer', border: '1px solid #E3EFE6', background: 'rgba(255,255,255,.92)',
            borderRadius: 999, width: 40, height: 40, fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 14px -8px rgba(60,40,120,.3)', textDecoration: 'none', color: '#1C1F2E',
          }}
        >
          ←
        </Link>
        <div style={chip}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: '#8480A0' }}>Tree value</div>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 26, lineHeight: 1.05, color: '#6B4EFF' }}>{money(total)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <GrowthStat label="this yr" fraction={yoy} />
            <GrowthStat label="total" fraction={totalGrowth} />
          </div>
          <div style={{ fontSize: 10.5, color: '#2F9E67', fontWeight: 600, marginTop: 1 }}>{stageLabel(stage)}</div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div style={{ ...chip, textAlign: 'right' }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: '#8480A0' }}>Year</div>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 20, color: '#1C1F2E' }}>{Math.min(year, totalYears)} / {totalYears}</div>
        </div>
        {best > 0 && (
          <div style={{ background: '#6B4EFF', color: '#fff', borderRadius: 12, padding: '5px 12px', fontSize: 11, fontWeight: 700 }}>
            🏆 Best {money(best)}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMaximized}
            aria-label={maximized ? 'Exit fullscreen' : 'Play fullscreen'}
            style={{
              pointerEvents: 'auto', cursor: 'pointer', border: '1px solid #E3EFE6', background: 'rgba(255,255,255,.92)',
              borderRadius: 999, width: 40, height: 40, fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 14px -8px rgba(60,40,120,.3)',
            }}
          >
            {maximized ? '⤡' : '⤢'}
          </button>
          <button
            type="button"
            onClick={onToggleMuted}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            style={{
              pointerEvents: 'auto', cursor: 'pointer', border: '1px solid #E3EFE6', background: 'rgba(255,255,255,.92)',
              borderRadius: 999, width: 40, height: 40, fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 14px -8px rgba(60,40,120,.3)',
            }}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </div>
  );
}
