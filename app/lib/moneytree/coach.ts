/**
 * Money Tree — coach copy (pure)
 * ------------------------------
 * The mascot's teaching lines. Kept as data so tone is easy to tune and the
 * Coach component stays presentational.
 */

import { money } from './format';
import type { ContributionFrequency } from './types';

export function introLine(mascotName: string): string {
  return `Hi, I'm ${mascotName}! Every year you'll split your coins across three buckets, then we watch the market. Spread your risk and be patient — that's how money trees grow. 🌱`;
}

/** Compounding lesson shown the moment a contribution frequency is chosen. */
export function compoundingLine(frequency: ContributionFrequency): string {
  switch (frequency) {
    case 'weekly':
    case 'monthly': {
      const period = frequency === 'weekly' ? 'week' : 'month';
      return `Adding money every ${period} is like watering your tree often. Each deposit starts earning, and its earnings earn too — that's compounding! A little, often, for many years beats one big drop. 💧`;
    }
    case 'yearly':
      return `Adding money every year keeps your tree growing. Each deposit earns, and its earnings earn too — that's compounding. The more years you give it, the bigger the snowball. ⛄`;
    case 'once':
      return `A one-time lump sum gets the most time in the market up front, and time is compounding's best friend — the longer it grows, the faster it snowballs. 🚀`;
  }
}

/** Warning when the player pours too much into the risky bucket. */
export function riskyAllocationLine(moonshotShare: number): string | null {
  if (moonshotShare < 0.5) return null;
  return `Whoa — ${Math.round(
    moonshotShare * 100
  )}% in Moonshots! That can win big… or lose it all. Real investors spread their money so one crash can't wipe them out. Sure about this?`;
}

/**
 * The coach's end-of-game summary: a short, educational, encouraging paragraph
 * explaining what compounding just did for (or to) the player, in plain words.
 */
export function reportLine(
  opts: { bankrupt: boolean; years: number; contributed: number; grew: number; growthPct: number | null }
): string {
  const { bankrupt, years, contributed, grew, growthPct } = opts;

  if (bankrupt) {
    return `Ouch — that one hurt. But here's the secret: every real investor loses money sometimes. What matters is that you never bet everything on one risky idea again. Spread your coins across all three buckets next time, and let time do the heavy lifting instead of luck. 🌱`;
  }

  const pct = growthPct !== null ? Math.round(growthPct * 100) : 0;
  const years1 = years === 1 ? 'year' : 'years';

  if (grew <= 0) {
    return `You kept every coin safe this time — nothing lost, but not much grown either. Compounding needs two things to work its magic: time, and a little risk. Try giving your Growth or Moonshot buckets some room to breathe next round!`;
  }

  return `Look what just happened — you planted ${money(
    contributed
  )} over ${years} ${years1}, and it quietly grew into an extra ${money(
    grew
  )} all on its own. That's ${pct}% growth you didn't have to work for! This is compounding: your money earns money, and then that money earns more money too. The longer you leave it, the faster the snowball rolls. That's the real superpower behind every big fortune — not luck, just patience. 🌟`;
}
