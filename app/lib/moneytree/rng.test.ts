import { describe, it, expect } from 'vitest';
import { createRng, seedFromString } from './rng';

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('next() stays within [0, 1)', () => {
    const rng = createRng(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('range() stays within [min, max)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.range(-5, 10);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThan(10);
    }
  });

  it('int() is inclusive of both bounds and integral', () => {
    const rng = createRng(42);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = rng.int(1, 6);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    // over 2000 rolls of a d6 we expect every face to appear
    expect(seen).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it('chance(0) is never true and chance(1) is always true', () => {
    const rng = createRng(3);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('pick() returns an element and throws on empty', () => {
    const rng = createRng(5);
    const items = ['a', 'b', 'c'] as const;
    expect(items).toContain(rng.pick(items));
    expect(() => rng.pick([])).toThrow();
  });
});

describe('seedFromString', () => {
  it('is stable for the same string', () => {
    expect(seedFromString('money-tree')).toBe(seedFromString('money-tree'));
  });

  it('differs for different strings', () => {
    expect(seedFromString('abc')).not.toBe(seedFromString('abd'));
  });

  it('returns a non-negative 32-bit integer', () => {
    const s = seedFromString('hello world');
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(0xffffffff);
  });
});
