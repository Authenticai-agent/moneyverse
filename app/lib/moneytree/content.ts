/**
 * Money Tree - content tables
 * ---------------------------
 * All game data and educational copy lives here as plain data so it is easy to
 * read, tune, and expand without touching engine logic.
 *
 * Numbers express *design intent* (see the spec §4.2) and are meant to be
 * play-tested and tuned; they are not sacred.
 */

import type { Badge, Bucket, BucketProfile, MarketEvent, MoneyCard, Stage } from './types';

/* ----------------------------- risk buckets ----------------------------- */

export const BUCKET_PROFILES: Record<Bucket, BucketProfile> = {
  safe: {
    id: 'safe',
    emoji: '🏦',
    label: 'Safe Seed',
    blurb: 'Grows a little every year and never shrinks - like a piggy bank that pays you extra.',
    realWorld: 'Real world match: a savings account or bonds. Real banks pay about 2-4% a year - small, but it never goes backwards.',
    minReturn: 0.02,
    maxReturn: 0.04,
    wipeChance: 0,
  },
  growth: {
    id: 'growth',
    emoji: '🌳',
    label: 'Growth Tree',
    blurb: 'Goes up and down, but climbs over time - like owning a tiny piece of lots of companies.',
    realWorld: 'Real world match: an index fund that owns a slice of hundreds of companies. It has historically grown about 10% a year on average - but bounces between down years and up years, so here it swings from -10% to +20%.',
    minReturn: -0.1,
    maxReturn: 0.2,
    wipeChance: 0,
  },
  moonshot: {
    id: 'moonshot',
    emoji: '🚀',
    label: 'Moonshot',
    blurb: 'Big risky bet. It can blast off and multiply your money - or crash and lose a lot, fast.',
    realWorld: 'Real world match: a single risky stock or crypto coin. It could more than double - or crash and lose most of its value. There is no safe "average" here.',
    minReturn: -0.6,
    maxReturn: 1.5,
    wipeChance: 0.04,
  },
};

/* ------------------------------- events -------------------------------- */

/** Probability that *some* event strikes in a given year. */
export const EVENT_CHANCE = 0.35;

export const EVENTS: MarketEvent[] = [
  {
    id: 'recession',
    emoji: '📉',
    title: 'Recession',
    weight: 3,
    tone: 'bad',
    // Deltas push the risky buckets down; the caps guarantee they actually land
    // in the red, so the numbers can never contradict "both dropped". Safe Seed
    // is untouched and holds steady, exactly as the copy says.
    effects: {
      returnDeltas: { growth: -0.12, moonshot: -0.35 },
      returnCaps: { growth: -0.02, moonshot: -0.05 },
    },
    copy: {
      whatHappened:
        'A "recession" hit - that means businesses everywhere sold less stuff and made less money. Safe Seed held steady, but Growth Tree and Moonshot both dropped.',
      smartMove:
        "Don't panic-sell everything! Recessions happen every few years and things usually get better again - staying invested is usually the smart move.",
    },
  },
  {
    id: 'boom',
    emoji: '📈',
    title: 'Boom Year',
    weight: 3,
    tone: 'good',
    // Mirror of the recession: deltas lift the risky buckets and the floors keep
    // them in the green, so the numbers always match "jumped up, especially the
    // riskier ones".
    effects: {
      returnDeltas: { growth: 0.1, moonshot: 0.4 },
      returnFloors: { growth: 0.02, moonshot: 0.05 },
    },
    copy: {
      whatHappened:
        'A "boom" hit - businesses everywhere did great and made more money. Your investments jumped up, especially the riskier ones.',
      smartMove:
        "Enjoy it, but good years don't last forever. Keep some money in safer buckets too, so you're ready for the next down year.",
    },
  },
  {
    id: 'inflation',
    emoji: '🌡️',
    title: 'High Inflation',
    weight: 2,
    tone: 'bad',
    effects: { returnDeltas: { safe: -0.02, growth: -0.04 } },
    copy: {
      whatHappened:
        'Prices went up on lots of things this year - candy, games, everything. That means each dollar buys a little less than before.',
      smartMove:
        'This is exactly why we invest instead of just saving! Your money needs to grow faster than prices go up, or it quietly loses power.',
    },
  },
  {
    id: 'scam',
    emoji: '🕵️',
    title: 'Investment Scam',
    weight: 2,
    tone: 'bad',
    effects: { returnOverrides: { moonshot: -0.5 } },
    copy: {
      whatHappened:
        'A "get rich quick" deal turned out to be fake. Your Moonshot money got hit hard and lost half its value this year.',
      smartMove:
        'If a deal promises huge money with zero risk, that\'s a big red flag. Spreading your money out means one scam can\'t take everything.',
    },
  },
  {
    id: 'windfall',
    emoji: '🎁',
    title: 'Surprise Windfall',
    weight: 1,
    tone: 'good',
    effects: { cashDelta: 150 },
    copy: {
      whatHappened: 'A birthday gift and some extra chores earned you bonus cash this year!',
      smartMove:
        'Surprise money is a great chance to invest a bit more instead of spending it all right away - future-you will be glad you did.',
    },
  },
  {
    id: 'expense',
    emoji: '💸',
    title: 'Surprise Expense',
    weight: 2,
    tone: 'bad',
    effects: { cashDelta: -120 },
    copy: {
      whatHappened: 'Something broke and had to get fixed, so an unexpected cost came out of your pot this year.',
      smartMove:
        'Surprises happen to everyone. Keeping some money in Safe Seed means one bad surprise doesn\'t force you to sell your other buckets at a bad time.',
    },
  },
  {
    id: 'rate-hike',
    emoji: '🏦',
    title: 'Interest Rates Rise',
    weight: 1,
    tone: 'mixed',
    effects: { returnDeltas: { safe: 0.02, growth: -0.03 } },
    copy: {
      whatHappened:
        'Banks started paying more for saved money - nice for Safe Seed! But borrowing money got more expensive too, which slowed some companies down.',
      smartMove:
        'Different years help different buckets. Having a mix means something in your tree is almost always doing okay.',
    },
  },
];

/* --------------------------- stage thresholds --------------------------- */

/** Dollar thresholds for each stage - mirrors the original Money Tree tool. */
export const STAGE_THRESHOLDS: { stage: Stage; min: number; emoji: string; label: string }[] = [
  { stage: 'seed', min: 0, emoji: '🌱', label: 'Seed' },
  { stage: 'sapling', min: 1000, emoji: '🌿', label: 'Sapling' },
  { stage: 'tree', min: 5000, emoji: '🌳', label: 'Growing Tree' },
  { stage: 'forest', min: 20000, emoji: '🌲', label: 'Money Forest' },
];

/** Total value at or below which the player is considered bankrupt. */
export const BANKRUPT_THRESHOLD = 1;

/* ----------------------------- money cards ----------------------------- */

export const MONEY_CARDS: MoneyCard[] = [
  {
    id: 'compounding',
    emoji: '📈',
    concept: 'Compound Growth',
    blurb: 'Your money makes more money, and then THAT money makes more money too. Like a snowball rolling downhill - the longer it rolls, the bigger it gets.',
    unlock: 'Finish a game of 8 years or more.',
  },
  {
    id: 'diversify',
    emoji: '🧺',
    concept: 'Diversify',
    blurb: "Don't put all your eggs in one basket! Spreading your money across different buckets means one bad crash can't take everything.",
    unlock: 'Finish a game with money in all three buckets.',
  },
  {
    id: 'risk-reward',
    emoji: '⚖️',
    concept: 'Risk vs Reward',
    blurb: 'Bigger possible wins come with bigger possible losses - always. Only put in a risky bucket what you could handle losing.',
    unlock: 'Put money into the Moonshot bucket.',
  },
  {
    id: 'bear-bull',
    emoji: '🐻',
    concept: 'Bear & Bull Markets',
    blurb: 'When prices fall, grown-ups call it a "bear market." When prices rise, it\'s a "bull market." Both happen all the time - it\'s totally normal.',
    unlock: 'Survive a recession without going bankrupt.',
  },
  {
    id: 'consistency',
    emoji: '💧',
    concept: 'Keep Watering',
    blurb: 'Adding a little money again and again - not just once - keeps your snowball rolling and makes the bumpy years less scary.',
    unlock: 'Play with weekly or monthly contributions.',
  },
  {
    id: 'opportunity-cost',
    emoji: '⏳',
    concept: 'Opportunity Cost',
    blurb: "Money you take out stops growing forever. Spending on a real need you can afford is a smart trade - just go easy on quick wants, since those cost you the most future growth.",
    unlock: 'Sell shares from any bucket during a game.',
  },
];

/* ------------------------------- badges -------------------------------- */

export const BADGES: Badge[] = [
  {
    id: 'first-forest',
    emoji: '🌲',
    name: 'First Forest',
    description: 'Grow your tree all the way to $20,000.',
  },
  {
    id: 'diversified',
    emoji: '🧺',
    name: 'Diversified',
    description: 'Finish a game without ever putting more than half your money in one bucket.',
  },
  {
    id: 'comeback-kid',
    emoji: '💪',
    name: 'Comeback Kid',
    description: 'Drop under $500, then climb all the way back over $5,000.',
  },
  {
    id: 'steady-hand',
    emoji: '🧘',
    name: 'Steady Hand',
    description: 'Live through a recession and still end the game with a gain.',
  },
  {
    id: 'diamond-hands',
    emoji: '💎',
    name: 'Diamond Hands',
    description: 'Have a bad year and not sell anything - then still finish ahead.',
  },
];
