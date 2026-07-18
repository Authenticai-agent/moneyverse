'use client';

/**
 * ReportScreen - the end-of-game debrief. Score, what-worked / watch-out /
 * try-next lessons, unlocked cards and badges, replay + share.
 */

import { useState } from 'react';
import { BADGES, MONEY_CARDS, STAGE_THRESHOLDS } from '@/app/lib/moneytree/content';
import { money } from '@/app/lib/moneytree/format';
import type { Mascot } from '@/app/lib/moneytree/mascots';
import type { GameSummary } from '@/app/lib/moneytree/summary';
import { BUCKETS, type Bucket, type GameConfig, type MascotId, type TurnResult } from '@/app/lib/moneytree/types';
import { BUCKET_PROFILES } from '@/app/lib/moneytree/content';
import GrowthBreakdown from './GrowthBreakdown';
import MoneyCard from './MoneyCard';
import SellComparison from './SellComparison';

const COACH_IMG: Record<MascotId, string> = {
  wizard: '/mascot/sage.png',
  robot: '/mascot/bit.png',
  adventurer: '/mascot/robin.png',
  hero: '/mascot/nova.png',
};

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

/**
 * Boil the whole game down to the few facts the debrief actually reasons about.
 * Crucially it captures BOTH the outcome (won / lost / flat) AND the shape of
 * the bets (did they go all-in on one bucket, which one) - the old logic only
 * had the growth number, so it couldn't tell "flat because you played safe"
 * from "lost because you went all-in on Moonshot", and described a losing
 * Moonshot gamble as if it had "paid off".
 */
function analyze(summary: GameSummary, results: TurnResult[]) {
  const peak = peakConcentration(results);
  const wentHeavy = peak.share >= HEAVY_CONCENTRATION;
  const stayedBalanced =
    results.length > 0 &&
    results.every((r) => Math.max(r.allocationWeights.safe, r.allocationWeights.growth, r.allocationWeights.moonshot) <= 0.5 + 1e-9);
  const grew = summary.total - summary.contributed;
  return {
    bankrupt: summary.bankrupt,
    total: summary.total,
    contributed: summary.contributed,
    peak,
    peakLabel: BUCKET_PROFILES[peak.bucket].label,
    wentHeavy,
    heavyMoonshot: wentHeavy && peak.bucket === 'moonshot',
    heavySafe: wentHeavy && peak.bucket === 'safe',
    stayedBalanced,
    sawRecession: results.some((r) => r.event?.id === 'recession'),
    grew,
    growthPct: summary.contributed > 0 ? grew / summary.contributed : null,
    won: !summary.bankrupt && grew > 1,
    lost: !summary.bankrupt && grew < -1,
    last: results[results.length - 1] as TurnResult | undefined,
  };
}

type Analysis = ReturnType<typeof analyze>;

/** The three lesson cards - outcome-AND-allocation aware. A heavy Moonshot bet
 * that lost is called a loss, not a "pay off". */
function insights(a: Analysis, config: GameConfig) {
  const worstCaseLoss = Math.abs(a.peak.balanceThatYear * BUCKET_PROFILES[a.peak.bucket].minReturn);

  // Card 1 - what actually happened.
  let workedTitle = 'What worked ✅';
  let workedPositive = true;
  let worked: string;
  if (a.bankrupt) {
    workedTitle = 'What happened 💥';
    workedPositive = false;
    worked = 'You bet almost everything on the riskiest bucket, and one bad year wiped it out - nothing was left to fall back on.';
  } else if (a.lost) {
    workedTitle = 'What happened 📉';
    workedPositive = false;
    worked = a.heavyMoonshot
      ? 'You put most of your coins in Moonshot and it swung DOWN hard - so most of your tree fell with it. That is the flip side of a big risky bet.'
      : a.wentHeavy
        ? `You leaned most of your money into ${a.peakLabel}, and one rough year there dragged the whole tree down.`
        : a.stayedBalanced
          ? 'The market had some rough years - but spreading across all three buckets kept the loss smaller than an all-in bet would have.'
          : 'A few down years pulled your tree lower. It happens - even sensible plans have losing stretches.';
  } else if (a.heavyMoonshot) {
    worked = "You put most of your coins in Moonshot and it paid off THIS time - but that's luck, not skill. Moonshot is a coin flip that can just as easily crash.";
  } else if (a.stayedBalanced) {
    worked = 'Spreading your money across all three buckets is what really worked - no single bad year could sink your whole tree.';
  } else if (a.heavySafe) {
    worked = 'You kept almost everything in Safe Seed - rock steady, and it never dropped. Slow, but dependable.';
  } else {
    worked = `Your ${BUCKET_PROFILES[biggestBucket(a.last)].label} did most of the work.`;
  }

  // Card 2 - the risk lesson.
  let watchOut: string;
  if (a.bankrupt) {
    watchOut = 'Putting almost everything in Moonshot let one crash wipe you out. Spreading your money is what keeps one bad bucket from taking it all.';
  } else if (a.heavyMoonshot && a.lost) {
    watchOut = 'This is exactly the danger of going all-in on Moonshot: when it drops, almost everything drops with it. One risky bucket holding your whole tree means one bad year hits your whole tree.';
  } else if (a.heavyMoonshot) {
    watchOut = `That win was a gamble. If Moonshot had crashed instead, that ${money(a.peak.balanceThatYear)} could have shrunk by about ${money(worstCaseLoss)} in one year. Betting almost everything on one risky bucket is gambling, not investing.`;
  } else if (a.wentHeavy) {
    watchOut = `Putting most of your coins in ${a.peakLabel} means a bad year there hits almost everything at once. Spreading out softens those blows.`;
  } else if (a.sawRecession) {
    watchOut = 'The economy had a rough patch - and spreading your money out is exactly what softened the blow.';
  } else {
    watchOut = 'Riskier buckets bounce around a lot; keep some money safe for the bumpy years.';
  }

  // Card 3 - the actionable next step.
  let tryNext: string;
  if (a.wentHeavy) {
    tryNext = 'Try splitting your coins across all three buckets next time - real investors almost never bet nearly everything on one.';
  } else if (a.heavySafe || (!a.won && !a.lost)) {
    tryNext = 'A little more in Growth Tree could help your tree climb faster over time - Safe Seed alone barely grows.';
  } else if (config.years < 8) {
    tryNext = `You grew your tree for ${config.years} year${config.years === 1 ? '' : 's'}. Try more years next time - your money snowballs more the longer it grows.`;
  } else if (a.total >= 20000) {
    tryNext = 'Amazing! Try fewer years or a bolder mix next time to test your skills.';
  } else {
    tryNext = 'Stay patient and spread out to reach a $20,000 Money Forest.';
  }

  return { workedTitle, workedPositive, worked, watchOut, tryNext };
}

/**
 * The coach's end-of-game summary, in their persona's voice - outcome-AND-
 * allocation aware (this is the local replacement for the frozen reportLine,
 * which only saw the growth number and so told an all-in Moonshot LOSS "you
 * kept everything safe... too cautious... try Moonshot"). Same money facts,
 * correct read of what the player actually did.
 */
function coachReport(coach: Mascot, a: Analysis, years: number): string {
  const p = coach.persona;
  const pct = a.growthPct !== null ? Math.round(a.growthPct * 100) : 0;
  const up = money(a.grew);
  const down = money(Math.abs(a.grew));
  const yr = years === 1 ? 'year' : 'years';

  if (a.bankrupt) {
    switch (p) {
      case 'bold':
        return "That's the risk I live for - and this time it didn't pay off. Even the best lose sometimes; the trick is never betting everything on one idea. Spread it out next time and jump back in!";
      case 'balanced':
        return 'This is exactly why I say spread it out! Everything in one bucket left nothing to fall back on. Next time, split your coins so one bad year can never take it all.';
      case 'calm':
        return "Ouch - that was a rough ride, not a calm one. Here's the real lesson: patience and safety matter more than any single big bet.";
      case 'cautious':
        return 'Beep - this is exactly what I try to prevent. Too much risk, no safety net. Next time, let Safe Seed carry more of the load.';
    }
  }

  if (a.lost && a.heavyMoonshot) {
    switch (p) {
      case 'bold':
        return `Whew - you went big on Moonshot and it bit back, ${down} down. I LOVE a bold bet, but even I keep a safety net so one bad year can't sink me. Spread it out a little and swing again!`;
      case 'balanced':
        return `You put a lot on Moonshot and one rough year hit almost all of it - down ${down}. That's exactly why I spread coins across all three: so one bad bucket can't drag everything down.`;
      case 'calm':
        return `That was a bumpy ride - down ${down}. Loading up on Moonshot means one bad year really stings. A slower, more spread-out plan keeps the dips gentle.`;
      case 'cautious':
        return `Beep - too much in one risky bucket, and the ${down} loss confirms it. Next time, let Safe Seed carry more and keep Moonshot small.`;
    }
  }

  if (a.lost) {
    const why = a.wentHeavy ? ` Leaning most of your money into ${a.peakLabel} meant one bad stretch hit almost everything.` : '';
    switch (p) {
      case 'bold':
        return `Down ${down} this run - it happens.${why} The move isn't to quit, it's to spread your bets so no single bad bucket hurts this much. Back in we go!`;
      case 'balanced':
        return `A losing run - down ${down}.${why} Spreading out is what keeps a bad year from becoming a disaster.`;
      case 'calm':
        return `Down ${down} - a few rough years.${why} No panic: the market breathes in and out. Staying spread out and patient keeps the dips small.`;
      case 'cautious':
        return `Beep - a loss of ${down}.${why} My recommendation stays the same: keep more in Safe Seed so bad years cost you less.`;
    }
  }

  if (a.won && a.heavyMoonshot) {
    switch (p) {
      case 'bold':
        return `Big Moonshot bet, big win - up ${up}! Just know it could've gone the other way just as easily. Keep a little safety net so a bad year can't wipe the smile off.`;
      case 'balanced':
        return `Moonshot paid off this time - up ${up} - but that was luck, not a plan. It could've crashed just as easily. Spreading across all three is how you win WITHOUT gambling.`;
      case 'calm':
        return `A big win on a big risk - ${up}. Exciting, but that's a stressful way to invest. A calmer, spread-out plan gets there with far fewer scares.`;
      case 'cautious':
        return `Beep - it worked out, ${up} gained, but the odds were a coin flip. Concentrated risk is still risk - I'd keep more in Safe Seed next time.`;
    }
  }

  if (a.won) {
    const base = `You planted ${money(a.contributed)} over ${years} ${yr}, and it grew an extra ${up} on its own - ${pct}% you didn't have to work for. That's compounding: your money made more money, and that money made even more.`;
    switch (p) {
      case 'bold':
        return `${base} Imagine what a bolder bet could've done - but hey, growth is growth! The longer you stay in, the bigger the wins. 🚀`;
      case 'balanced':
        return `${base} Notice how spreading your coins across all three buckets kept things steady the whole way. That's the real superpower - balance and patience. 🌟`;
      case 'calm':
        return `${base} No rush, no panic - just time working quietly in the background. That's the calm, patient path, and it works. 🌱`;
      case 'cautious':
        return `${base} Beep - confirmed: even a careful, low-risk plan grows beautifully given enough time. Patience is the safest strategy of all.`;
    }
  }

  // Flat - roughly broke even.
  switch (p) {
    case 'bold':
      return "Nearly flat this run - safe, but where's the fun? A little more Growth or Moonshot next time could actually get your tree climbing.";
    case 'balanced':
      return 'Just about flat. Your money stayed safe, but growth needs a little risk to work with. Try a bit in Growth or Moonshot next time.';
    case 'calm':
      return 'A calm, flat run - nothing lost. But your tree needs a little Growth to really shine over the years. A small slice would do it.';
    case 'cautious':
      return 'Beep - flat and safe, zero loss. Technically fine. Even I admit a little Growth could add real progress over time.';
  }
  return '';
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
  const analysis = analyze(summary, results);
  const { workedTitle, workedPositive, worked, watchOut, tryNext } = insights(analysis, config);
  const coachSummary = coachReport(coach, analysis, config.years);
  const cards = MONEY_CARDS.filter((c) => summary.unlockedCardIds.includes(c.id));
  const badges = BADGES.filter((b) => summary.earnedBadgeIds.includes(b.id));

  const grew = summary.total - summary.contributed;
  const growthPct = summary.contributed > 0 ? grew / summary.contributed : null;

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

  // Three outcomes, so the hero never says "you grew a tree" on a net loss:
  // a real gain/steady run (green, celebratory), a non-bankrupt loss (amber,
  // honest but encouraging), or bankruptcy (red).
  const positive = !summary.bankrupt && !analysis.lost;
  const banner = summary.bankrupt
    ? 'linear-gradient(135deg,#FF93A7,#E8477E)'
    : analysis.lost
      ? 'linear-gradient(135deg,#FFC98A,#F0913B)'
      : 'linear-gradient(135deg,#5AD597,#2FA96A)';
  const heroEmoji = summary.bankrupt ? '🪵' : (stageMeta?.emoji ?? '🌳');
  const heroTitle = summary.bankrupt
    ? 'Wiped out!'
    : analysis.lost
      ? `A bumpy run - you ended with a ${stageMeta?.label ?? 'tree'}`
      : `You grew a ${stageMeta?.label ?? 'tree'}!`;
  const valueColor = summary.bankrupt ? '#C0392B' : analysis.lost ? '#B26A12' : '#2FA96A';

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <style>{`
        @keyframes mtgPop { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: none; } }
        .mtg-report { animation: mtgPop .4s cubic-bezier(.2,.9,.3,1.2); }
        .mtg-btn { transition: transform .15s ease, box-shadow .15s ease; }
        .mtg-btn:hover { transform: translateY(-2px); }
        .mtg-btn:active { transform: translateY(0) scale(.98); }
        @media (prefers-reduced-motion: reduce) { .mtg-report { animation: none !important; } }
      `}</style>

      {/* Trophy hero card */}
      <div className="mtg-report" style={{ borderRadius: 26, overflow: 'hidden', background: '#fff', boxShadow: '0 26px 60px -26px rgba(30,18,60,.5)' }}>
        <div style={{ background: banner, padding: '22px 20px 18px', textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 'clamp(48px, 8vw, 68px)', lineHeight: 1 }}>{heroEmoji}</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, color: '#fff', margin: '6px 0 0', textShadow: '0 2px 4px rgba(0,0,0,.18)' }}>
            {heroTitle}
          </h2>
          {isNewBest && positive && (
            <span className="font-display" style={{ display: 'inline-block', marginTop: 8, background: 'rgba(255,255,255,.9)', color: '#1C7A4C', fontWeight: 700, fontSize: 'clamp(12px,1vw,14px)', padding: '4px 14px', borderRadius: 999 }}>
              🎉 New best!
            </span>
          )}
        </div>
        <div style={{ padding: '16px 18px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(11px,.9vw,13px)', color: '#8B84A8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Final tree value</div>
          <div className="font-display" style={{ fontSize: 'clamp(40px, 5.5vw, 60px)', fontWeight: 700, color: valueColor, lineHeight: 1.05 }}>{money(summary.total)}</div>
          {summary.bankrupt && (
            <p style={{ fontSize: 'clamp(12.5px,1vw,15px)', color: '#6E6A85', margin: '8px auto 0', maxWidth: 380, lineHeight: 1.45 }}>
              Your tree lost everything - but every investor learns from a crash! Spread your money out and try again. 🌱
            </p>
          )}
          {analysis.lost && !summary.bankrupt && (
            <p style={{ fontSize: 'clamp(12.5px,1vw,15px)', color: '#6E6A85', margin: '8px auto 0', maxWidth: 400, lineHeight: 1.45 }}>
              You ended with less than you planted this time - the risky buckets had a rough run. Spreading your money out helps the next one go smoother. 🌱
            </p>
          )}
          <GrowthBreakdown contributed={summary.contributed} grew={grew} growthPct={growthPct} years={config.years} total={summary.total} />
          {summary.soldAnything && (
            <SellComparison treeValue={summary.treeValue} cashOut={summary.cashOut} total={summary.total} shadowTotal={summary.shadowTotal} />
          )}
        </div>
      </div>

      {/* lessons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
        {[
          { t: workedTitle, body: worked, bg: workedPositive ? '#E9FBF1' : '#FFEEF0', ink: workedPositive ? '#1C7A4C' : '#B02A54' },
          { t: 'Watch out ⚠️', body: watchOut, bg: '#FFF7E6', ink: '#9A6A12' },
          { t: 'Try next time 🎯', body: tryNext, bg: '#EFEBFF', ink: '#6B4EFF' },
        ].map((c) => (
          <div key={c.t} style={{ flex: '1 1 180px', background: c.bg, borderRadius: 18, padding: '13px 14px' }}>
            <div className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(13px,1vw,15px)', color: c.ink, marginBottom: 5 }}>{c.t}</div>
            <p style={{ fontSize: 'clamp(12px,.95vw,14px)', color: '#4B4470', margin: 0, lineHeight: 1.45 }}>{c.body}</p>
          </div>
        ))}
      </div>

      {/* coach note with painted portrait */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'linear-gradient(135deg,#F3F0FF,#EDF6FF)', border: '1.5px solid #E6E0FA', borderRadius: 20, padding: 14, marginTop: 14 }}>
        <div className="grid place-items-center" style={{ width: 58, height: 58, borderRadius: '50%', background: '#fff', flexShrink: 0, overflow: 'hidden' }}>
          <img src={COACH_IMG[coach.id]} alt={coach.name} width={58} height={58} style={{ width: 52, height: 52, objectFit: 'contain' }} />
        </div>
        <div>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(13px,1vw,15px)', color: '#6B4EFF', marginBottom: 3 }}>{coach.name} says</div>
          <p style={{ fontSize: 'clamp(13px,1vw,15.5px)', color: '#3C3760', margin: 0, lineHeight: 1.55 }}>{coachSummary}</p>
        </div>
      </div>

      {/* badges */}
      {badges.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="font-display" style={{ fontSize: 12.5, fontWeight: 700, color: '#8480A0', marginBottom: 7 }}>🏅 Badges earned</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {badges.map((b) => (
              <span key={b.id} title={b.description} className="font-display" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', border: `2.5px solid ${newBadgeIds.includes(b.id) ? '#7C5CFF' : '#ECE7F8'}`, borderRadius: 999, padding: '6px 13px', fontSize: 12.5, fontWeight: 700, color: '#22203A', boxShadow: newBadgeIds.includes(b.id) ? '0 8px 18px -10px rgba(124,92,255,.6)' : 'none' }}>
                {b.emoji} {b.name}{newBadgeIds.includes(b.id) && <span style={{ color: '#7C5CFF' }}>· new</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* cards */}
      {cards.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="font-display" style={{ fontSize: 12.5, fontWeight: 700, color: '#8480A0', marginBottom: 7 }}>🃏 Money Cards</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {cards.map((c) => (
              <MoneyCard key={c.id} card={c} fresh={newCardIds.includes(c.id)} />
            ))}
          </div>
        </div>
      )}

      {/* actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        <button type="button" onClick={onReplay} className="font-display mtg-btn" style={{ flex: '1 1 150px', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 999, background: 'linear-gradient(180deg,#7C5CFF,#6B4EFF)', fontWeight: 700, fontSize: 'clamp(15px,1.2vw,18px)', padding: '14px 20px', boxShadow: '0 14px 28px -12px rgba(107,78,255,.75)' }}>
          ▶ Play again
        </button>
        <button type="button" onClick={onNewPlan} className="mtg-btn" style={{ flex: '1 1 120px', cursor: 'pointer', color: '#5A3EE6', borderRadius: 999, background: '#fff', border: '2px solid #D9CFF5', fontWeight: 700, fontSize: 14, padding: '14px 20px' }}>
          ↺ New plan
        </button>
        <button type="button" onClick={share} className="mtg-btn" style={{ flex: '1 1 120px', cursor: 'pointer', color: '#2FA96A', borderRadius: 999, background: '#fff', border: '2px solid #CDEFDD', fontWeight: 700, fontSize: 14, padding: '14px 20px' }}>
          {shared ? 'Copied! 🎉' : 'Share 🔗'}
        </button>
      </div>
    </div>
  );
}
