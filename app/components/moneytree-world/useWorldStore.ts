'use client';

/**
 * useWorldStore - Zustand store for the Money Tree garden.
 *
 * `portfolio` (the same Portfolio shape the frozen game engine produces) and
 * `mood` drive MoneyTree's size, per-bucket canopy composition, and health
 * tint. The game loop is real: `coinsThisYear`/`addCoin`/`undoCoin` back the
 * on-screen coin buttons, `resolveYear` calls the frozen engine's own
 * `resolveTurn` (reading the frozen lib's exported pure functions is fine -
 * only editing app/lib/moneytree/ itself is forbidden) to actually roll
 * returns and events when the player grows the year, and
 * `cashOutBiggestBucket` backs the cash-out button. This is a self-contained
 * demo loop (fixed yearly deposit, a fresh RNG per session) - Phase 6's
 * "swap" is what wires this world up to a real persisted `useMoneyTreeGame`
 * session instead.
 *
 * (The earlier walkable build also kept player position/velocity/joystick
 * input and an active-station slot here; those were removed along with the
 * Player/FollowCamera/TouchJoystick/StationProximity components when the game
 * moved to a fixed camera + control bar.)
 */

import { create } from 'zustand';
import { createRng, type Rng } from '@/app/lib/moneytree/rng';
import { resolveTurn, sellFromBucket, totalOf } from '@/app/lib/moneytree/engine';
import { BUCKETS, type Bucket, type MascotId, type Portfolio, type TurnResult } from '@/app/lib/moneytree/types';

export type WorldMood = 'neutral' | 'good' | 'bad';

export const COINS_PER_YEAR = 10;
export const YEARLY_DEPOSIT = 500;
const CASH_OUT_FRACTION = 0.25;

function emptyCoins(): Record<Bucket, number> {
  return { safe: 0, growth: 0, moonshot: 0 };
}

interface WorldState {
  /** Dollars held in each bucket - MoneyTree's size and per-lobe composition. */
  portfolio: Portfolio;
  setPortfolio: (portfolio: Portfolio) => void;

  /** Derived from the last resolved TurnResult - drives ambience, not logic. */
  mood: WorldMood;
  setMood: (mood: WorldMood) => void;

  /** The dollar deposit being planted this year. Fixed in the standalone demo
   * loop; when the world is embedded in a real useMoneyTreeGame session
   * (GardenStage) it's synced to that year's actual contribution. */
  yearlyDeposit: number;

  /** Which of the 4 coaches the player has picked (the educator shown beside
   * the gardener). Defaults to Sage the wizard. */
  selectedCoachId: MascotId;
  setSelectedCoach: (id: MascotId) => void;

  /** This year's coin-toss counts, one garden-plot visit each. */
  coinsThisYear: Record<Bucket, number>;
  /** The order coins were placed this year, so undo can pop the last one. */
  coinHistory: Bucket[];
  /** Coins currently mid-air (thrown by the mascot, not yet landed on the
   * plot). GardenPlot subtracts these from its rendered pile so a coin only
   * appears on the pile the instant it lands, not the instant it's tapped. */
  coinsInFlight: Record<Bucket, number>;
  addInFlight: (bucket: Bucket) => void;
  removeInFlight: (bucket: Bucket) => void;
  /** Adds one coin to a bucket, up to COINS_PER_YEAR total across all three. */
  addCoin: (bucket: Bucket) => void;
  /** Removes the most recently placed coin (whichever bucket it went into),
   * so the player can re-split before growing the year. No-op if none placed. */
  undoCoin: () => void;

  year: number;
  /** True once every coin this year has been placed - enables the "Grow the
   * year" button and brightens the decorative bell as a "ready" cue. */
  canResolveYear: () => boolean;
  /** Rolls returns/events for the year via the frozen engine's resolveTurn,
   * applies them to the portfolio, updates mood, advances the year, and
   * resets the coin counts for the next one. */
  resolveYear: () => void;

  /** The full TurnResult from the most recent resolveYear - the real numbers
   * (per-bucket returns, event, before/after totals) that the year-result
   * popup shows and the coaches react to. Null while no result is pending. */
  lastResult: TurnResult | null;
  /** Dismisses the year-result popup (the year has already advanced). */
  dismissResult: () => void;

  /** Sells a fixed fraction from whichever bucket currently holds the most. */
  cashOutBiggestBucket: () => void;
}

let rng: Rng = createRng(Date.now());

export const useWorldStore = create<WorldState>((set, get) => ({
  portfolio: { safe: 0, growth: 0, moonshot: 0 },
  setPortfolio: (portfolio) => set({ portfolio }),

  mood: 'neutral',
  setMood: (mood) => set({ mood }),

  yearlyDeposit: YEARLY_DEPOSIT,

  selectedCoachId: 'wizard',
  setSelectedCoach: (id) => set({ selectedCoachId: id }),

  coinsThisYear: emptyCoins(),
  coinHistory: [],
  coinsInFlight: emptyCoins(),
  addInFlight: (bucket) => {
    const { coinsInFlight } = get();
    set({ coinsInFlight: { ...coinsInFlight, [bucket]: coinsInFlight[bucket] + 1 } });
  },
  removeInFlight: (bucket) => {
    const { coinsInFlight } = get();
    set({ coinsInFlight: { ...coinsInFlight, [bucket]: Math.max(0, coinsInFlight[bucket] - 1) } });
  },
  addCoin: (bucket) => {
    const { coinsThisYear, coinHistory } = get();
    if (coinHistory.length >= COINS_PER_YEAR) return;
    set({
      coinsThisYear: { ...coinsThisYear, [bucket]: coinsThisYear[bucket] + 1 },
      coinHistory: [...coinHistory, bucket],
    });
  },
  undoCoin: () => {
    const { coinsThisYear, coinHistory } = get();
    if (coinHistory.length === 0) return;
    const last = coinHistory[coinHistory.length - 1];
    set({
      coinsThisYear: { ...coinsThisYear, [last]: Math.max(0, coinsThisYear[last] - 1) },
      coinHistory: coinHistory.slice(0, -1),
    });
  },

  year: 1,
  canResolveYear: () => {
    const { coinsThisYear } = get();
    return BUCKETS.reduce((sum, b) => sum + coinsThisYear[b], 0) >= COINS_PER_YEAR;
  },
  resolveYear: () => {
    const { portfolio, coinsThisYear, year } = get();
    if (!get().canResolveYear()) return;
    const result = resolveTurn(portfolio, coinsThisYear, YEARLY_DEPOSIT, year, rng);
    const yoyBase = totalOf(result.before) + result.contribution;
    set({
      portfolio: result.after,
      mood: result.total >= yoyBase ? 'good' : 'bad',
      year: year + 1,
      coinsThisYear: emptyCoins(),
      coinHistory: [],
      coinsInFlight: emptyCoins(),
      lastResult: result,
    });
  },

  lastResult: null,
  dismissResult: () => set({ lastResult: null }),

  cashOutBiggestBucket: () => {
    const { portfolio } = get();
    let biggest: Bucket = 'safe';
    for (const b of BUCKETS) if (portfolio[b] > portfolio[biggest]) biggest = b;
    if (portfolio[biggest] <= 0) return;
    const { portfolio: next } = sellFromBucket(portfolio, biggest, CASH_OUT_FRACTION);
    set({ portfolio: next });
  },
}));
