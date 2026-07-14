/**
 * Money Tree — per-year insights (pure)
 * --------------------------------------
 * Every resolved year must teach something, whether or not an economic event
 * struck. When an event fires, its own copy is used. On a "calm" year (no
 * event — the more common case), a rotating set of data-driven templates
 * explains what the numbers mean, so the game never shows a bare, unexplained
 * result. Templates are picked deterministically by year so the game stays
 * pure/testable (no randomness at render time).
 */

import { BUCKET_PROFILES } from './content';
import { percent } from './format';
import { BUCKETS, type Bucket, type TurnResult } from './types';

export interface YearInsight {
  emoji: string;
  title: string;
  tone: 'good' | 'bad' | 'mixed';
  whatHappened: string;
  smartMove: string;
}

function bestAndWorst(returns: Record<Bucket, number>): { best: Bucket; worst: Bucket } {
  let best: Bucket = BUCKETS[0];
  let worst: Bucket = BUCKETS[0];
  for (const b of BUCKETS) {
    if (returns[b] > returns[best]) best = b;
    if (returns[b] < returns[worst]) worst = b;
  }
  return { best, worst };
}

type CalmTemplate = (r: Record<Bucket, number>) => Omit<YearInsight, 'tone'>;

const CALM_TEMPLATES: CalmTemplate[] = [
  (r) => {
    const { best, worst } = bestAndWorst(r);
    return {
      emoji: '📊',
      title: 'A Calm Year',
      whatHappened: `No big news this year — just everyday ups and downs. ${BUCKET_PROFILES[best].emoji} ${BUCKET_PROFILES[best].label} did best at ${percent(r[best])}, while ${BUCKET_PROFILES[worst].emoji} ${BUCKET_PROFILES[worst].label} lagged at ${percent(r[worst])}.`,
      smartMove:
        "Markets don't need a big event to move — prices wiggle a little almost every year. It's the big picture over many years that matters, not any single one.",
    };
  },
  (r) => ({
    emoji: '🌤️',
    title: 'Smooth Sailing',
    whatHappened: `A quiet year in the markets. ${BUCKET_PROFILES.safe.emoji} Safe Seed barely moved (${percent(r.safe)}) because it's built to hold steady, while your riskier buckets swung around a bit more.`,
    smartMove: 'Boring years are good news — they mean you can keep adding coins without stress. Steady beats flashy over time.',
  }),
  (r) => {
    const spreadPp = Math.round((Math.max(r.safe, r.growth, r.moonshot) - Math.min(r.safe, r.growth, r.moonshot)) * 100);
    return {
      emoji: '🎢',
      title: 'Risk in Action',
      whatHappened: `Notice the spread this year? 🚀 Moonshot moved ${percent(r.moonshot)} while 🏦 Safe barely budged at ${percent(r.safe)} — about a ${spreadPp}-point gap.`,
      smartMove: "That gap IS risk: bigger possible moves, up or down. Riskier buckets can win big or lose big — Safe just... stays safe.",
    };
  },
  (r) => ({
    emoji: '🧮',
    title: 'Behind the Numbers',
    whatHappened: `Every bucket moved a little differently this year: 🏦 Safe ${percent(r.safe)}, 🌳 Growth ${percent(r.growth)}, 🚀 Moonshot ${percent(
      r.moonshot
    )}. That's the market doing what markets do — nobody controls it, not even grown-ups!`,
    smartMove: 'Since nobody can predict every wiggle, the best strategy is to stay invested and diversified, year after year.',
  }),
  (r) => ({
    emoji: '🔍',
    title: 'Market Check-In',
    whatHappened: `This year had no major headlines — just the normal push and pull of buyers and sellers. Your ${percent(
      (r.safe + r.growth + r.moonshot) / 3
    )} average move kept your money quietly working in the background.`,
    smartMove: 'This is what most years actually look like. The exciting headlines are rare — patience is what wins in the long run.',
  }),
];

/** A rotating, data-driven explanation for a year with no economic event. */
export function calmYearInsight(returns: Record<Bucket, number>, year: number): YearInsight {
  const idx = ((year % CALM_TEMPLATES.length) + CALM_TEMPLATES.length) % CALM_TEMPLATES.length;
  const t = CALM_TEMPLATES[idx](returns);
  return { ...t, tone: 'mixed' };
}

/** The insight to show for a resolved year: the event's copy, or a calm-year explanation. */
export function yearInsight(result: TurnResult): YearInsight {
  if (result.event) {
    return {
      emoji: result.event.emoji,
      title: result.event.title,
      tone: result.event.tone,
      whatHappened: result.event.copy.whatHappened,
      smartMove: result.event.copy.smartMove,
    };
  }
  return calmYearInsight(result.returns, result.year);
}
