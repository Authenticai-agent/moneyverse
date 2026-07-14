/**
 * Money Tree — seeded pseudo-random number generator
 * --------------------------------------------------
 * A deterministic RNG so a game is reproducible from its seed. This enables
 * shareable "markets" ("beat my exact game") and makes the engine unit-testable
 * without `Math.random`.
 *
 * Algorithm: mulberry32 — tiny, fast, good-enough distribution for a game.
 */

export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
  /** Next float in [min, max). */
  range(min: number, max: number): number;
  /** Next integer in [min, max] (inclusive). */
  int(min: number, max: number): number;
  /** True with the given probability (0..1). */
  chance(probability: number): boolean;
  /** Pick a random element from a non-empty array. */
  pick<T>(items: readonly T[]): T;
}

/** mulberry32 — deterministic 32-bit PRNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Create an RNG from a numeric seed. */
export function createRng(seed: number): Rng {
  const nextFloat = mulberry32(seed);
  return {
    next: nextFloat,
    range(min: number, max: number) {
      return min + nextFloat() * (max - min);
    },
    int(min: number, max: number) {
      return Math.floor(min + nextFloat() * (max - min + 1));
    },
    chance(probability: number) {
      return nextFloat() < probability;
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('pick() needs a non-empty array');
      return items[Math.floor(nextFloat() * items.length)];
    },
  };
}

/**
 * Derive a stable 32-bit numeric seed from a string (e.g. a shared game code).
 * Uses the FNV-1a hash so the same string always maps to the same seed.
 */
export function seedFromString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
