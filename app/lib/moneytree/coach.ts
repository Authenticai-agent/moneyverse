/**
 * Money Tree - coach copy (pure)
 * ------------------------------
 * Every coach has a persona (bold / balanced / calm / cautious) that colors
 * their tone and risk threshold, but never the facts - all four coaches teach
 * the same truth about compounding and risk, just with a different voice.
 * Kept as data/pure functions so tone is easy to tune and UI stays dumb.
 */

import { totalOf } from './engine';
import { money } from './format';
import type { CoachPersona, Mascot } from './mascots';
import { BUCKETS, type Bucket, type ContributionFrequency, type Portfolio, type TurnResult } from './types';

/** Shown once, before the first turn - explains the loop in the coach's voice,
 * then always closes with the same plain instruction (which bucket to tap,
 * and what the ⓘ badge on each one does) since that's the one thing every
 * persona's voice shouldn't get creative with. */
export function introLine(mascot: Mascot): string {
  const persona = (() => {
    switch (mascot.persona) {
      case 'bold':
        return `Hey, I'm ${mascot.name}! I love chasing big wins - Moonshot is my favorite, it can multiply your money fast! But even I know: never put ALL your coins in one risky spot. Let's go big - but smart. 🧭`;
      case 'balanced':
        return `Hi, I'm ${mascot.name}! Every year we'll split our coins into three buckets - Safe, Growth, and Moonshot. My style: a little in each, always. That way one bad year can never knock us all the way down. 🧙`;
      case 'calm':
        return `Hey, I'm ${mascot.name}! I'm never in a rush - slow and steady wins this game. We'll keep plenty safe, add a little growth, and let time do the real work. 🦸`;
      case 'cautious':
        return `Hello, I'm ${mascot.name}! Beep - I check for danger before anything else. My rule: keep most coins in Safe Seed. Not exciting, but it never lets you down. 🤖`;
    }
  })();
  return `${persona} Tap Safe Seed, Growth Tree, or Moonshot below to toss a coin in - and tap the ⓘ on any of them if you want the full story first.`;
}

/** Compounding lesson shown the moment a contribution frequency is chosen -
 * same core fact for every coach, voiced in their own persona. */
export function compoundingLine(mascot: Mascot, frequency: ContributionFrequency): string {
  const period = frequency === 'weekly' ? 'week' : 'month';

  switch (mascot.persona) {
    case 'bold':
      switch (frequency) {
        case 'weekly':
        case 'monthly':
          return `Every ${period} you add is like tossing more fuel on the fire! Each bit starts earning its own money, and THAT money earns too - that's compounding, and it only gets bigger the more you feed it. 🚀`;
        case 'yearly':
          return `Dropping money in once a year still lights the fuse - each deposit earns more, and that extra earns even more. More years in the game means a bigger explosion of growth. 🚀`;
        case 'once':
          return `Going all-in at the start gives your money the most time to blow up big. Time is rocket fuel for compounding - the earlier you start, the wilder the ride. 🚀`;
      }
      break;
    case 'balanced':
      switch (frequency) {
        case 'weekly':
        case 'monthly':
          return `Adding money every ${period} is like watering a plant often. Each bit you add starts earning more money - and that new money earns too! That's called compounding. Little and often beats one big drop. 💧`;
        case 'yearly':
          return `Adding money every year keeps your tree growing. Each deposit earns extra money, and that extra money earns more too - that's compounding. More years means a bigger snowball. ⛄`;
        case 'once':
          return `Putting it all in at once gives your money the most time to grow. And time is what compounding needs most - the longer it rolls, the bigger the snowball gets. 🌟`;
      }
      break;
    case 'calm':
      switch (frequency) {
        case 'weekly':
        case 'monthly':
          return `Watering your plant every ${period}, even just a little, is a calm little habit. Each bit you add quietly starts earning more, and that new money earns too - that's compounding. Small and steady always wins over big and stressful. 💧`;
        case 'yearly':
          return `Adding a steady amount every year keeps your tree growing without any drama. Each deposit earns a little extra, and that extra earns more too - that's compounding, quietly working while you relax. 🌱`;
        case 'once':
          return `Planting it all at once and then just... waiting? That's the calmest path of all. Time is what compounding needs most, and now your money has the most time possible to grow.`;
      }
      break;
    case 'cautious':
      switch (frequency) {
        case 'weekly':
        case 'monthly':
          return `Beep - adding money every ${period} is a safe, steady habit. Each deposit earns a little extra, and that extra earns more too. Beep - that's called compounding. Small, regular amounts are more reliable than one big risky drop.`;
        case 'yearly':
          return `Beep - a yearly deposit keeps your tree growing right on schedule. Each deposit earns extra, and that extra earns even more - compounding, confirmed. More years logged means more growth calculated.`;
        case 'once':
          return `Beep - one deposit, maximum time to grow. Data confirms: time is the most important ingredient for compounding. Starting early beats adding more later.`;
      }
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

/** A coach reaction to the current allocation, plus whether the UI should
 * show it as an actual warning (icon + accent color) rather than just text. */
export interface CoachReaction {
  text: string;
  warn: boolean;
}

/**
 * A reaction to the CURRENT allocation, in the coach's voice - a risk warning
 * once their persona's threshold is crossed, or (bold only) a gentle nudge to
 * take a little more risk when playing very safe. Returns null when the
 * coach has nothing to say about this particular split.
 */
export function allocationCoachLine(mascot: Mascot, weights: Record<Bucket, number>): CoachReaction | null {
  const moonshotPct = Math.round(weights.moonshot * 100);
  const threshold = RISK_WARN_THRESHOLD[mascot.persona];

  if (weights.moonshot >= threshold) {
    switch (mascot.persona) {
      case 'bold':
        return { text: `Now we're talking - ${moonshotPct}% in Moonshot! Just remember, even I wouldn't go much further than this. Keep a little safety net. 🧭`, warn: true };
      case 'balanced':
        return { text: `${moonshotPct}% in Moonshot is a lot for one bucket. Spreading your money out means one crash can't take everything. Sure about this?`, warn: true };
      case 'calm':
        return { text: `That's a big risk right there - ${moonshotPct}% in Moonshot. I'd rather sleep easy at night. Maybe balance it out a little?`, warn: true };
      case 'cautious':
        return { text: `${moonshotPct}% in Moonshot is way more than I'm comfy with. That's real money that could shrink a lot in a bad year. Maybe move some back to Safe?`, warn: true };
    }
  }

  if (mascot.persona === 'bold' && weights.moonshot <= BOLD_ENCOURAGE_THRESHOLD) {
    return { text: `Playing it pretty safe, huh? I get it - but even a little Moonshot could make things exciting. Your call, though!`, warn: false };
  }

  return null;
}

const BUCKET_LABEL: Record<Bucket, string> = { safe: 'Safe Seed', growth: 'Growth Tree', moonshot: 'Moonshot' };

function largestBucket(portfolio: Portfolio): Bucket {
  return BUCKETS.reduce((best, b) => (portfolio[b] > portfolio[best] ? b : best), BUCKETS[0]);
}

/** Rotating pool of persona-voiced financial-literacy facts, shown on years
 * with no active risk warning (and past the year-1 intro) so real education
 * keeps flowing all game long instead of stopping after the opening lines. */
const EDUCATIONAL_TIPS: Record<CoachPersona, string[]> = {
  bold: [
    "Here's the secret: the biggest wins come from staying in the game long enough for your money to snowball. Sticking around beats guessing perfectly.",
    'Notice how Moonshot bounces around way more than Safe Seed? Bigger possible wins come with bigger possible drops. No way around that.',
    "Spreading your money out isn't about playing scared - it's about surviving the bad years so you're still around for the awesome ones.",
    "Selling early locks in whatever you've got right now, forever. The longer you let it ride, the bigger it can still grow.",
    'Prices creeping up over time (grown-ups call it "inflation") nibbles away at cash that just sits still. Even I keep my money working, not stuffed in a sock drawer.',
  ],
  balanced: [
    "Spreading your coins out means no single bad year can wipe you out. That's not boring - that's smart.",
    'Compounding is patient magic: your money makes money, then that money makes money too. The longer you wait, the bigger the snowball.',
    'Selling early stops that bucket from growing for good. Sometimes worth it - just know what you\'re giving up.',
    "Risk and reward move together: Moonshot can swing way up or way down, Safe Seed barely moves at all. Nothing's free in investing.",
    'A balanced mix means one crash can dent your tree, but it can\'t chop it down. That\'s the whole point of spreading out.',
  ],
  calm: [
    'Patience is the whole strategy. Time does more of the work than any clever trick ever could.',
    'Notice how a little bit, added again and again, quietly turns into a lot? That\'s compounding - no rushing needed.',
    'Selling early feels good in the moment, but it stops that money from quietly growing in the background. Worth thinking twice.',
    "Riskier buckets bounce around more - that's just how it works. Slow and steady doesn't mean nothing happens, it means nothing panics.",
    "Even a little growth, left alone for years, adds up more than you'd expect. Time is doing you a favor.",
  ],
  cautious: [
    'Beep - fact: money left in Safe Seed grows slowly but never disappears overnight. Being predictable has real value.',
    'Beep - spreading money across buckets lowers the odds of a really bad year. My calculations confirm it.',
    'Beep - selling early stops that money from growing, permanently. Trade-off: certain cash now, versus more growth later.',
    "Beep - Moonshot's bigger possible win comes with a bigger possible loss. No reward without some risk, ever.",
    'Beep - patience really pays off: the longer money grows, the bigger the snowball gets. Time is the safest tool you have.',
  ],
};

/** A rotating, persona-voiced financial-literacy tip - deterministic by year
 * so a given playthrough is stable, but varied across the game. */
export function educationalTipLine(mascot: Mascot, year: number): string {
  const pool = EDUCATIONAL_TIPS[mascot.persona];
  const idx = ((year % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

/**
 * A proactive nudge (not a reaction to a sale) pointing out the player's
 * largest bucket and reminding them cashing out is always an option - with
 * the same "spent money stops compounding" lesson every persona teaches.
 */
export function cashOutSuggestionLine(mascot: Mascot, portfolio: Portfolio, year: number): string {
  const bucket = largestBucket(portfolio);
  const bucketLabel = BUCKET_LABEL[bucket];
  const amt = money(portfolio[bucket]);
  const variant = year % 2;

  switch (mascot.persona) {
    case 'bold':
      return variant === 0
        ? `${bucketLabel} is sitting at ${amt}. Feel like cashing some out for something real - a bike, a game, whatever? Your call - just know it stops growing the second it leaves the tree.`
        : `${amt} in ${bucketLabel} and counting. You could grab some for something fun right now, or let it keep riding. Either way, know what you're giving up.`;
    case 'balanced':
      return variant === 0
        ? `Your ${bucketLabel} bucket has grown to ${amt}. You could pull some out for something you want, like a bike - just remember, spent money stops growing. Only take what you're ready to give up.`
        : `${bucketLabel} is at ${amt} now. Cashing out for something real is always an option - just weigh it against what that money could still turn into if you leave it be.`;
    case 'calm':
      return variant === 0
        ? `${bucketLabel} is up to ${amt} now. No rush, but if there's something real you'd like - a bike, maybe - you're allowed to enjoy some of this. Just know it stops growing once it's spent.`
        : `${amt} sitting in ${bucketLabel}. Take some out if there's something you need, no judgment - just remember, patience is what got it this far.`;
    case 'cautious':
      return variant === 0
        ? `Beep - ${bucketLabel} balance: ${amt}. You can take some out anytime, for a bike or anything else. Trade-off to know: spent money doesn't grow anymore.`
        : `Beep - ${bucketLabel} has reached ${amt}. Cashing out is fine whenever you need it. Just noting: it stops growing the moment you take it out.`;
  }
}

/**
 * What the coach says during the 'playing' phase once the intro and any
 * active risk warning are out of the way - alternates a proactive cash-out
 * nudge (referencing the player's biggest bucket) with a rotating
 * educational tip, so there's always something to learn or consider.
 */
export function playingPhaseLine(mascot: Mascot, ctx: { year: number; portfolio: Portfolio }): string {
  const { year, portfolio } = ctx;
  if (year >= 3 && year % 3 === 0) {
    return cashOutSuggestionLine(mascot, portfolio, year);
  }
  return educationalTipLine(mascot, year);
}

/** Rotating hype/send-off pool shown right before the player heads into the
 * next year - a forward-looking cheer, distinct from eventReactionLine's
 * reaction to the year that just happened. */
const SEND_OFF_LINES: Record<CoachPersona, string[]> = {
  bold: [
    "Let's ride this into a bigger year! 🚀",
    "Onward - I want to see what next year's bet does!",
    "New year, new chance to swing big. Let's go!",
    "I'm ready for more action - are you?",
  ],
  balanced: [
    "Here's to another steady, balanced year ahead. 🌟",
    'Onward! Let’s keep that balance working for you.',
    'New year, same smart plan - let’s see it grow.',
    "Ready when you are - let's keep spreading the good stuff.",
  ],
  calm: [
    "Onward, nice and easy. 🌱",
    "No rush - let's just keep going, one steady year at a time.",
    "Here we go again - patience pays off, one year at a time.",
    'Ready for another quiet, steady year? Let’s go.',
  ],
  cautious: [
    'Beep - moving to next year. Everything looks good so far.',
    'Beep - onward. Being predictable feels nice, doesn’t it?',
    'Beep - starting next year now. All systems steady.',
    "Beep - let's keep this streak going.",
  ],
};

/** A forward-looking hype line for the moment right before advancing to the
 * next year - deterministic by year so it varies across a playthrough. */
export function sendOffLine(mascot: Mascot, year: number): string {
  const pool = SEND_OFF_LINES[mascot.persona];
  const idx = ((year % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

/** A short greeting shown when the cash-out panel first opens, before any
 * sale - complements sellReactionLine, which only fires after a sale. */
const CASH_OUT_GREETINGS: Record<CoachPersona, string[]> = {
  bold: [
    'Thinking about cashing out for something fun? Your call - just remember, spent money stops growing.',
    "Looking to grab some cash? Go for it - just know that part stops riding the wave with the rest.",
  ],
  balanced: [
    "Want to pull some coins out for something real? That's allowed - just know it stops growing once it's out.",
    'Thinking about taking some out? Fair enough - just weigh it against what that money could still become.',
  ],
  calm: [
    "No pressure - if there's something you'd like to use this for, go ahead. Just know it stops growing once it's spent.",
    'Take your time. Whatever you decide, just remember: spent money stops quietly growing.',
  ],
  cautious: [
    'Beep - cash-out screen open. Remember: money taken out stops earning more.',
    'Beep - ready to take some out? Reminder: growth stops the moment it leaves the tree.',
  ],
};

/** Shown once when the cash-out panel opens, before any sale this visit. */
export function cashOutGreetingLine(mascot: Mascot, year: number): string {
  const pool = CASH_OUT_GREETINGS[mascot.persona];
  const idx = ((year % pool.length) + pool.length) % pool.length;
  return pool[idx];
}

/**
 * The coach's in-character reaction right after the player cashes out shares -
 * always teaches the same core truth (money you sell stops compounding) but
 * in a voice that matches their risk philosophy.
 */
export function sellReactionLine(
  mascot: Mascot,
  ctx: { bucket: Bucket; amount: number; soldAll: boolean; yearsRemaining: number }
): string {
  const { bucket, amount, soldAll, yearsRemaining } = ctx;
  const bucketLabel = BUCKET_LABEL[bucket];
  const amt = money(amount);
  const years1 = yearsRemaining === 1 ? 'year' : 'years';

  if (soldAll) {
    switch (mascot.persona) {
      case 'bold':
        return `Cashing out ALL of your ${bucketLabel}? Bold move - you've locked in ${amt}, no take-backs. Just know that money's done growing for the ${yearsRemaining} ${years1} left. Was it worth it?`;
      case 'balanced':
        return `You sold every last coin from ${bucketLabel} - ${amt} in your pocket now. That's fine sometimes, but remember: that money can't grow anymore. Knowing when to hold on is part of balance too.`;
      case 'calm':
        return `Selling all of ${bucketLabel} for ${amt}. No judgment - but that money stops growing the moment it leaves the tree. Make sure it was worth more to you now than later.`;
      case 'cautious':
        return `Beep - all of ${bucketLabel} cashed out - ${amt} safe in hand, zero risk from here. Smart if you needed certainty. Just remember: cashed-out money can't grow anymore either.`;
    }
  }

  switch (mascot.persona) {
    case 'bold':
      return `Cashed out ${amt} from ${bucketLabel}. Locking in a win now and again isn't a bad instinct - just remember, that ${amt} won't be riding the next big swing with the rest.`;
    case 'balanced':
      return `You pulled ${amt} out of ${bucketLabel}. That's ${amt} that stops growing - sometimes worth it, but the real magic happens when money stays invested.`;
    case 'calm':
      return `Took ${amt} out of ${bucketLabel}. That's okay - just know that ${amt} won't be quietly growing alongside the rest anymore.`;
    case 'cautious':
      return `Beep - ${amt} taken out of ${bucketLabel} and safely in hand. No more risk on that part - but also no more growth. Trade-offs, trade-offs.`;
  }
}

/** Whether a resolved year was, on balance, a win, a loss, or roughly flat. */
export function outcomeTone(result: TurnResult): 'good' | 'bad' | 'flat' {
  const before = totalOf(result.before);
  const diff = result.total - before - result.contribution;
  if (Math.abs(diff) < 1) return 'flat';
  return diff > 0 ? 'good' : 'bad';
}

const REACTION_POOLS: Record<CoachPersona, Record<'good' | 'bad' | 'flat', string[]>> = {
  bold: {
    good: [
      "Nice bounce! When something's working, don't be afraid to lean into it a little more - that's how big wins happen. 🚀",
      "See that growth? That's the reward for taking a chance. Keep some risk in the mix and let's keep climbing!",
      "That's the spirit of a real risk-taker - small wins add up to big ones. Ready to push a little further?",
    ],
    bad: [
      "Ouch, that stung. But here's the thing about bold moves - sometimes they don't pay off. Never risk money you can't afford to lose.",
      "A dip! Even the boldest investors take hits sometimes. The trick is staying in the game, not giving up.",
      "That's a rough one. Want to dial back the risk this year, or double down? Either way, know why you're choosing it.",
    ],
    flat: [
      "A quiet year - not very exciting for my taste! Maybe next year's the one where we take a bigger swing.",
      "Nothing much moved. That's fine, but you know I'd rather see some real action in Moonshot.",
    ],
  },
  balanced: {
    good: [
      'Nice growth! Notice how spreading your coins across buckets helped smooth things out.',
      "That's balance paying off - a little bit everywhere adds up to steady progress.",
      "Good year! When one bucket dips, the others often carry you. That's the power of spreading it out.",
    ],
    bad: [
      "A down year, but notice it wasn't a disaster - that's the whole point of spreading your risk.",
      'Not every year is a winner, but a balanced mix means no single loss sinks the ship.',
      "That's a dip, but your other buckets are probably cushioning the blow. That's spreading it out at work.",
    ],
    flat: [
      'A steady, unremarkable year - exactly what a balanced plan often looks like. No drama, just progress.',
      "Nothing dramatic happened, and that's okay. Balance isn't about excitement, it's about consistency.",
    ],
  },
  calm: {
    good: [
      'Nice and easy growth. No need to rush - this is exactly the patient pace I like.',
      'Look at that, quietly climbing. Good things take time, and you just proved it.',
      "That's the calm, steady kind of win I love to see. Keep breathing, keep growing.",
    ],
    bad: [
      "A little dip - totally normal. The market breathes in and out; we don't panic over one bad year.",
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
      'Beep - growth detected, even with a careful strategy. Slow and steady really does add up over time.',
      'Calculations confirm: safety paid off again. I told you - no surprises, just steady progress.',
      'Another year, another gain, zero panic. This is exactly how I like my investing.',
    ],
    bad: [
      'A loss?! Beep boop - this is exactly why I always recommend keeping most coins in Safe Seed. Risk has a cost.',
      'My sensors detect a dip. If this makes you nervous, that feeling is useful - maybe move more into Safe next time.',
      'Not what I would have predicted with a cautious plan. Double-check your riskier buckets - a little goes a long way.',
    ],
    flat: [
      'Beep - no major change. Predictable. Reliable. Exactly as I calculated.',
      'A flat year is a fine year in my book - nothing lost is basically a win.',
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
        return "That's the risk I live for - and this time it didn't pay off. Even the best investors lose money sometimes; the trick is never betting everything on one idea. Spread it out next time, and jump back in!";
      case 'balanced':
        return 'This is exactly why I always say: spread it out! Putting everything in one bucket left you with nothing to fall back on. Next time, split your coins so one bad year can never take it all.';
      case 'calm':
        return "Ouch. That was a rough ride, not a calm one. Take a breath - this teaches a real lesson: patience and safety matter more than any single big bet.";
      case 'cautious':
        return 'Beep - this is exactly what I try to prevent. Too much risk, not enough safety net. Next time, let Safe Seed carry more of the load.';
    }
  }

  if (grew <= 0) {
    switch (mascot.persona) {
      case 'bold':
        return "You kept everything safe - nothing lost, but nothing much gained either. Honestly? That's too cautious for me. A little Moonshot next time could really wake things up.";
      case 'balanced':
        return "Everything stayed safe, but growth needs a little risk to work with. Try putting a bit into Growth or Moonshot next time - that's how balance pays off.";
      case 'calm':
        return "Nothing lost is still a win in my book, but your money needs a little growth to really shine. Maybe let a small slice ride in Growth next time.";
      case 'cautious':
        return 'Beep - zero risk, zero loss - technically a success by my standards. Though even I admit: a little bit in Growth could add real progress over time.';
    }
  }

  const base = `You planted ${money(contributed)} over ${years} ${years1}, and it quietly grew into an extra ${money(
    grew
  )} all on its own - that's ${pct}% you didn't have to work for. This is compounding: your money made more money, and that money made even more.`;

  switch (mascot.persona) {
    case 'bold':
      return `${base} Imagine what a bolder bet could have done - but hey, growth is growth! The longer you stay in the game, the bigger the wins get. 🚀`;
    case 'balanced':
      return `${base} Notice how spreading your coins across all three buckets kept things steady the whole way. That's the real superpower - not luck, just balance and patience. 🌟`;
    case 'calm':
      return `${base} See? No rush, no panic, just time working quietly in the background. That's the calm, patient path - and it works. 🌱`;
    case 'cautious':
      return `${base} Beep - confirmed: even a careful, low-risk plan grows beautifully given enough time. Patience is the safest strategy of all.`;
  }
}
