/**
 * Money Tree — coach copy (pure)
 * ------------------------------
 * The mascot's teaching lines. Kept as data so tone is easy to tune and the
 * Coach component stays presentational.
 */

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
