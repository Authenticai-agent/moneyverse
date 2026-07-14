/**
 * Money Tree: Grow or Bust — shared types
 * ---------------------------------------
 * Pure domain types for the investing strategy game. No React, no DOM.
 * See docs/superpowers/specs/2026-07-13-money-tree-3d-strategy-game-design.md
 */

/** The three risk buckets a player allocates money into each year. */
export type Bucket = 'safe' | 'growth' | 'moonshot';

export const BUCKETS: readonly Bucket[] = ['safe', 'growth', 'moonshot'] as const;

/** How often the player contributes money. Aggregated to a yearly deposit. */
export type ContributionFrequency = 'weekly' | 'monthly' | 'yearly' | 'once';

/** Which mascot the player picked as their coach (maps to a 3D model). */
export type MascotId = 'wizard' | 'robot' | 'adventurer' | 'hero';

/** Player-chosen setup, fixed for the duration of a game. */
export interface GameConfig {
  /** Starting amount in dollars (>= 0). */
  startAmount: number;
  /** Contribution amount in dollars per `frequency` period (>= 0). */
  contributionAmount: number;
  /** How often the contribution is added. */
  frequency: ContributionFrequency;
  /** Number of yearly turns to play (>= 1). */
  years: number;
  /** Chosen coach mascot. */
  mascot: MascotId;
  /** Seed for the market RNG — reproducible games and shareable "markets". */
  seed: number;
}

/**
 * A portfolio is money held in each bucket. Everything is invested; there is
 * no idle "cash" bucket in the base game (kept deliberately simple for kids).
 * Amounts are in dollars.
 */
export type Portfolio = Record<Bucket, number>;

/**
 * How the player splits the coins available this turn across buckets.
 * Values are weights (non-negative); they are normalised at resolution time,
 * so they need not sum to 1.
 */
export type Allocation = Record<Bucket, number>;

/** A growth stage derived from total portfolio value. */
export type Stage = 'seed' | 'sapling' | 'tree' | 'forest';

/**
 * How an event changes a year's outcome. All fields optional; an event uses
 * whichever express its real-world effect most clearly.
 */
export interface EventEffects {
  /** Additive change to a bucket's return this year (e.g. -0.15 = 15pp worse). */
  returnDeltas?: Partial<Record<Bucket, number>>;
  /**
   * Force a bucket's return outright this year, ignoring the market roll and any
   * delta (e.g. a scam forces Moonshot to a loss). Used when the event's effect
   * must always show clearly on the bucket's displayed return.
   */
  returnOverrides?: Partial<Record<Bucket, number>>;
  /** Flat dollar change to the portfolio (windfall +, surprise expense −). */
  cashDelta?: number;
}

/** An economic event that can strike during a market roll. */
export interface MarketEvent {
  id: string;
  emoji: string;
  title: string;
  /** Relative likelihood when an event is drawn (higher = more common). */
  weight: number;
  /** Whether this event is broadly good, bad, or mixed — used for UI tone. */
  tone: 'good' | 'bad' | 'mixed';
  effects: EventEffects;
  /** Kid-friendly explanation surfaced in the EventCard. */
  copy: {
    whatHappened: string;
    smartMove: string;
  };
}

/** The outcome of resolving a single yearly turn. */
export interface TurnResult {
  /** Year index that was just resolved (1-based). */
  year: number;
  /** Portfolio before this turn's contribution and returns. */
  before: Portfolio;
  /** Portfolio after contribution + returns + any event. */
  after: Portfolio;
  /** Dollars added as this year's contribution. */
  contribution: number;
  /** Normalised allocation weights used to place the contribution this year. */
  allocationWeights: Record<Bucket, number>;
  /** Per-bucket return fraction actually applied this year (e.g. 0.07 = +7%). */
  returns: Record<Bucket, number>;
  /** The event that struck this year, if any. */
  event: MarketEvent | null;
  /** Total value after the turn. */
  total: number;
  /** Stage after the turn. */
  stage: Stage;
  /** True once the player is effectively wiped out. */
  bankrupt: boolean;
}

/** A record of the player cashing out part or all of a bucket mid-game. */
export interface Withdrawal {
  /** The year (1-based) in which the sale happened, just before that year's turn. */
  year: number;
  bucket: Bucket;
  /** Fraction of that bucket's balance sold (0..1]. */
  fraction: number;
  /** Dollars received — added to cash, no longer invested or growing. */
  proceeds: number;
}

/** Where a game currently sits in its lifecycle. */
export type GamePhase = 'setup' | 'playing' | 'resolving' | 'report';

/** Static description of a risk bucket, shown in the UI and used by the engine. */
export interface BucketProfile {
  id: Bucket;
  emoji: string;
  label: string;
  /** One-line kid description of what this bucket represents. */
  blurb: string;
  /** Lowest possible yearly return in a normal year (fraction, e.g. -0.10). */
  minReturn: number;
  /** Highest possible yearly return in a normal year (fraction). */
  maxReturn: number;
  /**
   * Small chance (0..1) of a catastrophic wipe of this bucket's holdings in a
   * given year (models a Moonshot going to zero). 0 for safe buckets.
   */
  wipeChance: number;
}

/** A collectible concept card unlocked through play. */
export interface MoneyCard {
  id: string;
  emoji: string;
  concept: string;
  blurb: string;
  /** Human-readable unlock condition (also documents the trigger). */
  unlock: string;
}

/** A badge awarded for a play achievement. */
export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
}
