'use client';

/**
 * ReportScreen - the end-of-game debrief. Score, what-worked / watch-out /
 * try-next lessons, unlocked cards and badges, replay + share.
 */

import { useState } from 'react';
import { BADGES, MONEY_CARDS, STAGE_THRESHOLDS } from '@/app/lib/moneytree/content';
import { reportLine } from '@/app/lib/moneytree/coach';
import { money } from '@/app/lib/moneytree/format';
import type { Mascot } from '@/app/lib/moneytree/mascots';
import type { GameSummary } from '@/app/lib/moneytree/summary';
import { BUCKETS, type Bucket, type GameConfig, type TurnResult } from '@/app/lib/moneytree/types';
import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import GrowthBreakdown from './GrowthBreakdown';
import MoneyCard from './MoneyCard';
import SellComparison from './SellComparison';

function biggestBucket(last: TurnResult | undefined): Bucket {
  if (!last) return 'safe';
  return BUCKETS.reduce((best, b) => (last.after[b] > last.after[best] ? b : best), 'safe' as Bucket);
}

/** The single heaviest bucket bet the player made in any one year, and the
 * bucket's balance right after that year - used to judge whether a "win" came
 * from a real strategy or from betting most of the tree on one risky bucket. */
function peakConcentration(results: TurnResult[]): { share: number; bucket: Bucket; balanceThatYear: number } {
  let best = { share: 0, bucket: 'safe' as Bucket, balanceThatYear: 0 };
  for (const r of results) {
    for (const b of BUCKETS) {
      if (r.allocationWeights[b] > best.share) best = { share: r.allocationWeights[b], bucket: b, balanceThatYear: r.after[b] };
    }
  }
  return best;
}

/** Share of coins in one bucket above which a year counts as "went heavy" -
 * intentionally above the 50% "diversified" badge threshold, so a merely
 * risk-tolerant split isn't confused with an all-in bet. */
const HEAVY_CONCENTRATION = 0.7;

function insights(summary: GameSummary, config: GameConfig, results: TurnResult[]) {
  const last = results[results.length - 1];
  const sawRecession = results.some((r) => r.event?.id === 'recession');
  const peak = peakConcentration(results);
  const wentHeavy = peak.share >= HEAVY_CONCENTRATION;
  const stayedBalanced =
    results.length > 0 &&
    results.every((r) => Math.max(r.allocationWeights.safe, r.allocationWeights.growth, r.allocationWeights.moonshot) <= 0.5 + 1e-9);
  const peakLabel = BUCKET_PROFILES[peak.bucket].label;
  const worstCaseLoss = Math.abs(peak.balanceThatYear * BUCKET_PROFILES[peak.bucket].minReturn);

  const worked = summary.bankrupt
    ? 'You took big risks - brave, but risky.'
    : wentHeavy && peak.bucket === 'moonshot'
      ? "You put most of your coins in Moonshot and it paid off this time - but that's luck, not skill. Moonshot is a coin flip that can just as easily crash."
      : stayedBalanced
        ? 'Spreading your money across all three buckets is what really worked - no single bad year could sink your whole tree.'
        : `Your ${BUCKET_PROFILES[biggestBucket(last)].label} did most of the work.`;

  const watchOut = summary.bankrupt
    ? 'Putting almost everything in Moonshot let one crash wipe you out.'
    : wentHeavy && peak.bucket === 'moonshot'
      ? `If Moonshot had crashed instead, that ${money(peak.balanceThatYear)} could have shrunk by about ${money(worstCaseLoss)} in a single year. Betting almost everything on one risky bucket is gambling, not investing.`
      : wentHeavy
        ? `You leaned hard into ${peakLabel} - it worked out, but putting most of your coins in one bucket means a bad year there would hit a lot harder too.`
        : sawRecession
          ? 'The economy had a rough patch - spreading your money out softened the blow.'
          : 'Riskier buckets bounce around a lot; keep some money safe for the bumpy years.';

  const tryNext = wentHeavy
    ? 'Try splitting your coins across all three buckets next time - real investors almost never bet nearly everything on one.'
    : config.years < 8
      ? `You grew your tree for ${config.years} year${config.years === 1 ? '' : 's'}. Try more years next time - your money snowballs more the longer it grows.`
      : summary.total >= 20000
        ? 'Amazing! Try fewer years or a bolder mix next time to test your skills.'
        : 'Stay patient and spread out to reach a $20,000 Money Forest.';

  return { worked, watchOut, tryNext };
}

export default function ReportScreen({
  summary,
  config,
  results,
  coach,
  isNewBest,
  newCardIds,
  newBadgeIds,
  onReplay,
  onNewPlan,
}: {
  summary: GameSummary;
  config: GameConfig;
  results: TurnResult[];
  coach: Mascot;
  isNewBest: boolean;
  newCardIds: string[];
  newBadgeIds: string[];
  onReplay: () => void;
  onNewPlan: () => void;
}) {
  const [shared, setShared] = useState(false);
  const stageMeta = STAGE_THRESHOLDS.find((s) => s.stage === summary.stage);
  const { worked, watchOut, tryNext } = insights(summary, config, results);
  const cards = MONEY_CARDS.filter((c) => summary.unlockedCardIds.includes(c.id));
  const badges = BADGES.filter((b) => summary.earnedBadgeIds.includes(b.id));

  const grew = summary.total - summary.contributed;
  const growthPct = summary.contributed > 0 ? grew / summary.contributed : null;
  const coachSummary = reportLine(coach, {
    bankrupt: summary.bankrupt,
    years: config.years,
    contributed: summary.contributed,
    grew,
    growthPct,
  });

  const share = async () => {
    const text = `🌳 I grew a money tree to ${money(summary.total)} in ${config.years} years on MoneyVerse! Can you beat it?`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: 'My Money Tree', text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8">
      <div style={{ textAlign: 'center' }}>
        {summary.bankrupt ? (
          <>
            <div style={{ fontSize: 56 }}>🪵💀</div>
            <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, color: '#C0392B', margin: '4px 0' }}>Wiped out!</h2>
            <p style={{ fontSize: 13, color: '#6E6A85' }}>Your tree lost everything - but every investor learns from a crash! Spread your money out and try again. 🌱</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56 }}>{stageMeta?.emoji ?? '🌳'}</div>
            <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, color: '#2F9E67', margin: '4px 0' }}>
              You grew a {stageMeta?.label ?? 'tree'}!
            </h2>
          </>
        )}
        <div className="font-display" style={{ fontSize: 40, fontWeight: 800, color: '#6B4EFF', lineHeight: 1.1 }}>{money(summary.total)}</div>

        {isNewBest && (
          <div style={{ fontSize: 12, color: '#6B4EFF', fontWeight: 800, marginTop: 6 }}>🎉 New best!</div>
        )}

        <GrowthBreakdown contributed={summary.contributed} grew={grew} growthPct={growthPct} years={config.years} total={summary.total} />

        {summary.soldAnything && (
          <SellComparison treeValue={summary.treeValue} cashOut={summary.cashOut} total={summary.total} shadowTotal={summary.shadowTotal} />
        )}
      </div>

      {/* lessons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
        {[
          { t: 'What worked ✅', body: worked, bg: '#EAFBF2' },
          { t: 'Watch out ⚠️', body: watchOut, bg: '#FFF7E6' },
          { t: 'Try next time 🎯', body: tryNext, bg: '#EEF2FF' },
        ].map((c) => (
          <div key={c.t} style={{ flex: '1 1 160px', background: c.bg, borderRadius: 14, padding: 12 }}>
            <div className="font-display" style={{ fontWeight: 700, fontSize: 13, color: '#1C1F2E', marginBottom: 4 }}>{c.t}</div>
            <p style={{ fontSize: 12, color: '#4B4470', margin: 0, lineHeight: 1.4 }}>{c.body}</p>
          </div>
        ))}
      </div>

      {/* coach note */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'linear-gradient(135deg,#F6F4FF,#EFF7FF)', border: '1px solid #E6E0FA', borderRadius: 16, padding: 14, marginTop: 16 }}>
        <div style={{ fontSize: 34, lineHeight: 1 }}>{coach.emoji}</div>
        <div>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 13, color: '#6B4EFF', marginBottom: 3 }}>{coach.name} says</div>
          <p style={{ fontSize: 13, color: '#3C3760', margin: 0, lineHeight: 1.55 }}>{coachSummary}</p>
        </div>
      </div>

      {/* badges */}
      {badges.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8480A0', marginBottom: 6 }}>Badges earned</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {badges.map((b) => (
              <span key={b.id} title={b.description} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', border: `2px solid ${newBadgeIds.includes(b.id) ? '#6B4EFF' : '#ECE7F8'}`, borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#1C1F2E' }}>
                {b.emoji} {b.name}{newBadgeIds.includes(b.id) && <span style={{ color: '#6B4EFF' }}>· new</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* cards */}
      {cards.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8480A0', marginBottom: 6 }}>Money Cards</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {cards.map((c) => (
              <MoneyCard key={c.id} card={c} fresh={newCardIds.includes(c.id)} />
            ))}
          </div>
        </div>
      )}

      {/* actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        <button type="button" onClick={onReplay} className="font-display" style={{ flex: '1 1 140px', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 999, background: '#6B4EFF', fontWeight: 600, fontSize: 16, padding: '13px 20px', boxShadow: '0 12px 26px -12px rgba(107,78,255,.7)' }}>
          ▶ Play again
        </button>
        <button type="button" onClick={onNewPlan} style={{ flex: '1 1 120px', cursor: 'pointer', color: '#5A3EE6', borderRadius: 999, background: '#fff', border: '1.5px solid #D9CFF5', fontWeight: 600, fontSize: 14, padding: '13px 20px' }}>
          ↺ New plan
        </button>
        <button type="button" onClick={share} style={{ flex: '1 1 120px', cursor: 'pointer', color: '#2F9E67', borderRadius: 999, background: '#fff', border: '1.5px solid #CDEFDD', fontWeight: 600, fontSize: 14, padding: '13px 20px' }}>
          {shared ? 'Copied! 🎉' : 'Share 🔗'}
        </button>
      </div>
    </div>
  );
}
