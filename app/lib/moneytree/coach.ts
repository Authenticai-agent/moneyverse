/**
 * Money Tree — coach copy (pure)
 * ------------------------------
 * Every coach has a persona (bold / balanced / calm / cautious) that colors
 * their tone and risk threshold, but never the facts — all four coaches teach
 * the same truth about compounding and risk, just with a different voice.
 * Kept as data/pure functions so tone is easy to tune and UI stays dumb.
 */

import { totalOf } from './engine';
import { money } from './format';
import type { CoachPersona, Mascot } from './mascots';
import type { Bucket, ContributionFrequency, TurnResult } from './types';

/** Shown once, before the first turn — explains the loop in the coach's voice. */
export function introLine(mascot: Mascot): string {
  switch (mascot.persona) {
    case 'bold':
      return `Hey, I'm ${mascot.name}! I love chasing big wins — Moonshot is my favorite, it can multiply your money fast. But even I know: never bet it ALL on one risky idea. Let's explore, but smart. 🧭`;
    case 'balanced':
      return `Hi, I'm ${mascot.name}! Every year we'll split coins across three buckets — Safe, Growth, and Moonshot. My style is a little of each, always — that's how you ride out any storm. 🧙`;
    case 'calm':
      return `Hey, I'm ${mascot.name}! I'm not in a rush — slow and steady wins this game. We'll keep plenty safe, add a little growth, and let time do the real work. 🦸`;
    case 'cautious':
      return `Hello, I'm ${mascot.name}! *beep* I calculate risk before anything else. My rule: most coins stay in Safe Seed. It's not exciting, but it never lets you down. 🤖`;
  }
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

/** How aggressively Moonshot has to be weighted before this persona speaks up. */
const RISK_WARN_THRESHOLD: Record<CoachPersona, number> = {
  bold: 0.8,
  balanced: 0.5,
  calm: 0.4,
  cautious: 0.25,
};

/** Below this Moonshot share, only the bold coach comments (encouragingly). */
const BOLD_ENCOURAGE_THRESHOLD = 0.05;

/**
 * A reaction to the CURRENT allocation, in the coach's voice — a risk warning
 * once their persona's threshold is crossed, or (bold only) a gentle nudge to
 * take a little more risk when playing very safe. Returns null when the
 * coach has nothing to say about this particular split.
 */
export function allocationCoachLine(mascot: Mascot, weights: Record<Bucket, number>): string | null {
  const moonshotPct = Math.round(weights.moonshot * 100);
  const threshold = RISK_WARN_THRESHOLD[mascot.persona];

  if (weights.moonshot >= threshold) {
    switch (mascot.persona) {
      case 'bold':
        return `Now we're talking — ${moonshotPct}% in Moonshot! Just remember, even I wouldn't go much further than this. Keep a little safety net. 🧭`;
      case 'balanced':
        return `${moonshotPct}% in Moonshot is a lot for one bucket. Real investors spread their money out — one crash can't wipe out a balanced plan. Sure about this?`;
      case 'calm':
        return `That's a big risk right there — ${moonshotPct}% in Moonshot. I'd rather sleep easy at night. Maybe balance it out a little?`;
      case 'cautious':
        return `*alert* ${moonshotPct}% in Moonshot is well outside my comfort zone. That's real money that could vanish in a bad year. Consider pulling some back to Safe.`;
    }
  }

  if (mascot.persona === 'bold' && weights.moonshot <= BOLD_ENCOURAGE_THRESHOLD) {
    return `Playing it pretty safe, huh? I get it — but even a *little* Moonshot could make things exciting. Your call, though!`;
  }

  return null;
}

/** Whether a resolved year was, on balance, a win, a loss, or roughly flat. */
function outcomeTone(result: TurnResult): 'good' | 'bad' | 'flat' {
  const before = totalOf(result.before);
  const diff = result.total - before - result.contribution;
  if (Math.abs(diff) < 1) return 'flat';
  return diff > 0 ? 'good' : 'bad';
}

const REACTION_POOLS: Record<CoachPersona, Record<'good' | 'bad' | 'flat', string[]>> = {
  bold: {
    good: [
      "Nice bounce! When something's working, don't be afraid to lean into it a little more — that's how big wins happen. 🚀",
      "See that growth? That's the reward for taking a chance. Keep some risk in the mix and let's keep climbing!",
      "That's the spirit of a real risk-taker — small wins add up to big ones. Ready to push a little further?",
    ],
    bad: [
      "Ouch, that stung. But here's the thing about bold moves — sometimes they don't pay off. Never risk money you can't afford to lose.",
      "A dip! Even the boldest investors take hits sometimes. The trick is staying in the game, not giving up.",
      "That's a rough one. Want to dial back the risk this year, or double down? Either way, know why you're choosing it.",
    ],
    flat: [
      "A quiet year — not very exciting for my taste! Maybe next year's the one where we take a bigger swing.",
      "Nothing much moved. That's fine, but you know I'd rather see some real action in Moonshot.",
    ],
  },
  balanced: {
    good: [
      'Nice growth! Notice how spreading your coins across buckets helped smooth things out.',
      "That's balance paying off — a little bit everywhere adds up to steady progress.",
      "Good year! When one bucket dips, the others often carry you. That's the power of diversifying.",
    ],
    bad: [
      "A down year, but notice it wasn't a disaster — that's the whole point of spreading your risk.",
      'Not every year is a winner, but a balanced mix means no single loss sinks the ship.',
      "That's a dip, but your other buckets are likely cushioning the blow. This is diversifying at work.",
    ],
    flat: [
      'A steady, unremarkable year — exactly what a balanced plan often looks like. No drama, just progress.',
      "Nothing dramatic happened, and that's okay. Balance isn't about excitement, it's about consistency.",
    ],
  },
  calm: {
    good: [
      'Nice and easy growth. No need to rush — this is exactly the patient pace I like.',
      'Look at that, quietly climbing. Good things take time, and you just proved it.',
      "That's the calm, steady kind of win I love to see. Keep breathing, keep growing.",
    ],
    bad: [
      "A little dip — totally normal. The market breathes in and out; we don't panic over one bad year.",
      "That's alright. Even calm waters have small waves sometimes. Stay the course.",
      "One down year doesn't undo your progress. Take a breath, we've got plenty of years left.",
    ],
    flat: [
      'A calm, quiet year. Honestly? My favorite kind. Nothing to fix, nothing to fear.',
      'Not much happened, and that suits me just fine. Patience is the whole strategy.',
    ],
  },
  cautious: {
    good: [
      '*beep* Growth detected, even with a careful strategy. Slow and steady really does add up over time.',
      'Calculations confirm: safety paid off again. I told you — no surprises, just steady progress.',
      'Another year, another gain, zero panic. This is exactly how I like my investing.',
    ],
    bad: [
      'A loss?! *beep boop* This is exactly why I always recommend keeping most coins in Safe Seed. Risk has a cost.',
      'My sensors detect a dip. If this makes you nervous, that feeling is useful — maybe move more into Safe next time.',
      'Not what I would have predicted with a cautious plan. Double-check your riskier buckets — a little goes a long way.',
    ],
    flat: [
      '*beep* No major change. Predictable. Reliable. Exactly as I calculated.',
      'A flat year is a fine year in my book — nothing lost is a win, statistically speaking.',
    ],
  },
};

/**
 * The coach's personal reaction to a resolved year, shown alongside the
 * factual event explanation. Rotates through a few variants per outcome so it
 * doesn't repeat verbatim, picked deterministically by year (pure, testable).
 */
export function eventReactionLine(mascot: Mascot, result: TurnResult): string {
  const tone = outcomeTone(result);
  const pool = REACTION_POOLS[mascot.persona][tone];
  const idx = ((result.year % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

interface ReportOpts {
  bankrupt: boolean;
  years: number;
  contributed: number;
  grew: number;
  growthPct: number | null;
}

/**
 * The coach's end-of-game summary: an educational, encouraging paragraph in
 * their persona's voice, explaining what compounding just did for (or to) the
 * player.
 */
export function reportLine(mascot: Mascot, opts: ReportOpts): string {
  const { bankrupt, years, contributed, grew, growthPct } = opts;
  const years1 = years === 1 ? 'year' : 'years';
  const pct = growthPct !== null ? Math.round(growthPct * 100) : 0;

  if (bankrupt) {
    switch (mascot.persona) {
      case 'bold':
        return "That's the risk I live for — and this time it didn't pay off. Every real investor loses money sometimes; the pros just never bet everything on one idea. Spread your next bet, and get back in the game!";
      case 'balanced':
        return 'This is exactly why I always preach balance — going all-in on one bucket left you with nothing to fall back on. Next time, spread your coins so one bad year can never take everything.';
      case 'calm':
        return "Ouch. That was a rough ride, not a calm one. Take a breath — losses like this teach a real lesson: patience and safety matter more than any single big bet.";
      case 'cautious':
        return '*beep* System alert: this is precisely the outcome I try to prevent. Too much risk, not enough safety net. Next time, let Safe Seed carry more of the load.';
    }
  }

  if (grew <= 0) {
    switch (mascot.persona) {
      case 'bold':
        return "You kept everything safe — nothing lost, but nothing much gained either. Honestly? That's too cautious for me. A little Moonshot next time could really wake things up.";
      case 'balanced':
        return "Everything stayed safe, but growth needs a little risk to work with. Try spreading a bit into Growth or Moonshot next time — that's how balance pays off.";
      case 'calm':
        return "Nothing lost is still a win in my book, but compounding needs a little growth to really shine. Maybe let a small slice ride in Growth next time.";
      case 'cautious':
        return '*beep* Zero risk, zero loss — technically a success by my standards. Though even I admit: a small amount in Growth could add real progress over time.';
    }
  }

  const base = `You planted ${money(contributed)} over ${years} ${years1}, and it quietly grew into an extra ${money(
    grew
  )} all on its own — that's ${pct}% you didn't have to work for. This is compounding: your money earns money, and that money earns more too.`;

  switch (mascot.persona) {
    case 'bold':
      return `${base} Imagine what a bolder bet could have done — but hey, growth is growth! The longer you stay in the game, the bigger the wins get. 🚀`;
    case 'balanced':
      return `${base} Notice how spreading your coins across all three buckets kept things steady the whole way. That's the real superpower — not luck, just balance and patience. 🌟`;
    case 'calm':
      return `${base} See? No rush, no panic, just time working quietly in the background. That's the calm, patient path — and it works. 🌱`;
    case 'cautious':
      return `${base} *beep* Confirmed: even a careful, low-risk plan compounds beautifully given enough time. Patience is the safest strategy of all.`;
  }
}
