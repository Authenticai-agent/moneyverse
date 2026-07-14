/**
 * Money Tree — content tables
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
    blurb: 'Small, steady growth. Never loses — like a savings account or bonds.',
    minReturn: 0.02,
    maxReturn: 0.04,
    wipeChance: 0,
  },
  growth: {
    id: 'growth',
    emoji: '🌳',
    label: 'Growth Tree',
    blurb: 'Bumpy but climbs over time — like a fund of many companies.',
    minReturn: -0.1,
    maxReturn: 0.2,
    wipeChance: 0,
  },
  moonshot: {
    id: 'moonshot',
    emoji: '🚀',
    label: 'Moonshot',
    blurb: 'Huge highs and scary lows. A big bet that can soar — or crash.',
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
    effects: { returnDeltas: { growth: -0.12, moonshot: -0.35 } },
    copy: {
      whatHappened:
        'The economy slowed down. People and businesses spent less, so lots of companies were worth less this year. Safe money held steady, but riskier bets fell.',
      smartMove:
        "Don't panic and sell everything. Recessions are normal and markets usually bounce back — staying invested is often the smart move.",
    },
  },
  {
    id: 'boom',
    emoji: '📈',
    title: 'Boom Year',
    weight: 3,
    tone: 'good',
    effects: { returnDeltas: { growth: 0.1, moonshot: 0.4 } },
    copy: {
      whatHappened:
        'The economy grew fast! People spent more and companies earned more, so investments jumped — especially the risky ones.',
      smartMove:
        "Enjoy it, but remember booms don't last forever. Keep some money spread across safer buckets too.",
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
        'Prices went up, so each dollar buys a little less than before. Money sitting still quietly loses value.',
      smartMove:
        'This is why we invest! To beat inflation, your money needs to grow faster than prices rise — safe-only is not always safe.',
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
        'A "too good to be true" scheme turned out to be a scam. Risky Moonshot money got hit hard and lost half its value this year.',
      smartMove:
        'If someone promises guaranteed huge returns with no risk, be suspicious. Spreading money out means one scam can’t wipe you out.',
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
      whatHappened: 'A birthday gift and some extra chores earned you a bonus of cash this year!',
      smartMove:
        'Found money is a great chance to invest a little more instead of spending it all — your future self will thank you.',
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
      whatHappened: 'Something broke and needed fixing, so an unexpected cost came out of your pot this year.',
      smartMove:
        'Surprises happen. Keeping some money in Safe means an emergency does not force you to sell investments at a bad time.',
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
        'Banks raised interest rates. Safe savings now earn a bit more, but borrowing got pricier so some companies grew slower.',
      smartMove:
        'Different conditions help different buckets. A mix means something in your tree is usually doing okay.',
    },
  },
];

/* --------------------------- stage thresholds --------------------------- */

/** Dollar thresholds for each stage — mirrors the original Money Tree tool. */
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
    blurb: 'Your money earns money — and that earning earns too. The longer you wait, the faster it snowballs.',
    unlock: 'Finish a game of 8 years or more.',
  },
  {
    id: 'diversify',
    emoji: '🧺',
    concept: 'Diversify',
    blurb: "Don't put all your eggs in one basket. Spreading money across buckets means one crash can't wipe you out.",
    unlock: 'Finish a game with money in all three buckets.',
  },
  {
    id: 'risk-reward',
    emoji: '⚖️',
    concept: 'Risk vs Reward',
    blurb: 'Bigger possible rewards come with bigger possible losses. Match your risk to how much you can afford to lose.',
    unlock: 'Put money into the Moonshot bucket.',
  },
  {
    id: 'bear-bull',
    emoji: '🐻',
    concept: 'Bear & Bull Markets',
    blurb: 'A "bear market" is when prices fall; a "bull market" is when they rise. Both are a normal part of investing.',
    unlock: 'Survive a recession without going bankrupt.',
  },
  {
    id: 'consistency',
    emoji: '💧',
    concept: 'Keep Watering',
    blurb: 'Adding money regularly — not just once — keeps feeding the snowball and smooths out the bumpy years.',
    unlock: 'Play with weekly or monthly contributions.',
  },
  {
    id: 'opportunity-cost',
    emoji: '⏳',
    concept: 'Opportunity Cost',
    blurb: 'Money you cash out stops growing. Selling early can be smart — but it always costs you future compounding.',
    unlock: 'Sell shares from any bucket during a game.',
  },
];

/* ------------------------------- badges -------------------------------- */

export const BADGES: Badge[] = [
  {
    id: 'first-forest',
    emoji: '🌲',
    name: 'First Forest',
    description: 'Grow your tree to a $20,000 Money Forest.',
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
    description: 'Recover from under $500 all the way to over $5,000.',
  },
  {
    id: 'steady-hand',
    emoji: '🧘',
    name: 'Steady Hand',
    description: 'Survive a recession and still finish in the green.',
  },
  {
    id: 'diamond-hands',
    emoji: '💎',
    name: 'Diamond Hands',
    description: 'Ride out a down year without selling a single share — and still finish ahead.',
  },
];
