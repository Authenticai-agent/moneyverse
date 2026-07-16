/**
 * Money Tree - per-year insights (pure)
 * --------------------------------------
 * Every resolved year must teach something, whether or not an economic event
 * struck. When an event fires, its own copy is used. On a "calm" year (no
 * event - the more common case), a rotating set of data-driven templates
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
      whatHappened: `Nothing big happened this year - just normal ups and downs. ${BUCKET_PROFILES[best].emoji} ${BUCKET_PROFILES[best].label} did best at ${percent(r[best])}, while ${BUCKET_PROFILES[worst].emoji} ${BUCKET_PROFILES[worst].label} lagged behind at ${percent(r[worst])}.`,
      smartMove:
        "Money doesn't need big news to move around a little - it happens almost every year. What matters is the big picture over many years, not any single one.",
    };
  },
  (r) => ({
    emoji: '🌤️',
    title: 'Smooth Sailing',
    whatHappened: `A quiet year for your money. ${BUCKET_PROFILES.safe.emoji} Safe Seed barely moved (${percent(r.safe)}) because it's built to hold steady, while your riskier buckets bounced around a bit more.`,
    smartMove: 'Boring years are good news - they mean you can keep adding coins without stress. Steady beats flashy over time.',
  }),
  (r) => {
    const spreadPp = Math.round((Math.max(r.safe, r.growth, r.moonshot) - Math.min(r.safe, r.growth, r.moonshot)) * 100);
    return {
      emoji: '🎢',
      title: 'Risk in Action',
      whatHappened: `Notice the gap this year? 🚀 Moonshot moved ${percent(r.moonshot)} while 🏦 Safe barely budged at ${percent(r.safe)} - about a ${spreadPp}-point difference.`,
      smartMove: "That gap IS risk: bigger possible moves, up or down. Riskier buckets can win big or lose big - Safe just... stays safe.",
    };
  },
  (r) => ({
    emoji: '🧮',
    title: 'Behind the Numbers',
    whatHappened: `Every bucket moved a little differently this year: 🏦 Safe ${percent(r.safe)}, 🌳 Growth ${percent(r.growth)}, 🚀 Moonshot ${percent(
      r.moonshot
    )}. That's just how money moves - nobody controls it, not even grown-ups!`,
    smartMove: 'Since nobody can guess every wiggle, the best plan is to stay invested and spread out, year after year.',
  }),
  (r) => ({
    emoji: '🔍',
    title: 'Money Check-In',
    whatHappened: `This year had no big headlines - just the normal buying and selling that happens every day. Your money kept quietly working in the background at about ${percent(
      (r.safe + r.growth + r.moonshot) / 3
    )} on average.`,
    smartMove: 'This is what most years actually look like. Exciting headlines are rare - patience is what wins in the long run.',
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

/**
 * A rotating pool of real financial-literacy concepts, independent of
 * whatever happened this specific year (event or calm) - `yearInsight`
 * explains THIS year's numbers; this teaches an idea that stays true every
 * year, so every resolved turn adds a genuinely new piece of understanding
 * instead of repeating the same "what happened" framing. Picked
 * deterministically by year, same pattern as `calmYearInsight`.
 */
const MONEY_LESSONS: string[] = [
  "Compounding is when your money earns money, and then that new money earns money too. It's like a snowball rolling downhill - small at first, then huge the longer it rolls.",
  'Spreading money across different buckets is called diversifying. If one bucket has a bad year, the others can help balance it out.',
  'Riskier investments can grow faster - but they can also drop faster. That trade-off between risk and reward is one of the biggest ideas in investing.',
  'The earlier you start investing, the more years your money has to grow. Time is one of the most powerful tools any investor has.',
  "Prices go up a little almost every year - that's called inflation. If your money doesn't grow at least that fast, it's quietly losing power even if the number looks the same.",
  "A bucket dropping for one year doesn't mean it's a bad investment. What matters most is where it ends up after many years, not any single year.",
  "Real 'Growth Tree'-style index funds can own tiny slices of hundreds of real companies at once - so even if a few struggle, the fund can still do okay overall.",
  'When it costs more to borrow money, some companies grow slower. That\'s part of why interest rates can shake up Growth Tree and Moonshot more than Safe Seed.',
  "Adding money regularly, instead of waiting for the 'perfect' moment, is called dollar-cost averaging. Over many years it usually works out just fine.",
  "Every dollar you invest is a dollar you're not spending today. Smart investors ask 'is this the best use of this dollar?' - not just 'is this good?'",
  "The biggest mistake many investors make isn't picking the wrong thing - it's panicking and selling during a scary year, then missing the recovery afterward.",
  'Keeping some money in something safe (like Safe Seed) means you\'re never forced to sell your growing investments at a bad moment just to cover a surprise.',
  'A stock or coin (like Moonshot) is a bet on ONE thing doing well. An index fund (like Growth Tree) is a bet on MANY things averaging out well. Both are real strategies - they just carry very different risk.',
  'Nobody, not even professional investors, can predict the market perfectly every year. The plan that works is staying invested for a long time, not guessing right every single year.',
];

/** A rotating financial-literacy fact, deterministic by year (pure, testable). */
export function moneyLessonLine(year: number): string {
  const idx = ((year % MONEY_LESSONS.length) + MONEY_LESSONS.length) % MONEY_LESSONS.length;
  return MONEY_LESSONS[idx];
}
