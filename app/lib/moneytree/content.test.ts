import { describe, it, expect } from 'vitest';
import {
  BADGES,
  BUCKET_PROFILES,
  EVENTS,
  EVENT_CHANCE,
  MONEY_CARDS,
  STAGE_THRESHOLDS,
} from './content';
import { BUCKETS } from './types';

describe('bucket profiles', () => {
  it('defines exactly the three buckets', () => {
    expect(Object.keys(BUCKET_PROFILES).sort()).toEqual([...BUCKETS].sort());
  });

  it('has sane return ranges and wipe chances', () => {
    for (const b of BUCKETS) {
      const p = BUCKET_PROFILES[b];
      expect(p.id).toBe(b);
      expect(p.minReturn).toBeLessThanOrEqual(p.maxReturn);
      expect(p.wipeChance).toBeGreaterThanOrEqual(0);
      expect(p.wipeChance).toBeLessThanOrEqual(1);
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.blurb.length).toBeGreaterThan(0);
    }
  });

  it('keeps the safe bucket safe (never negative, never wipes)', () => {
    expect(BUCKET_PROFILES.safe.minReturn).toBeGreaterThanOrEqual(0);
    expect(BUCKET_PROFILES.safe.wipeChance).toBe(0);
  });
});

describe('events', () => {
  it('has a valid overall event chance', () => {
    expect(EVENT_CHANCE).toBeGreaterThan(0);
    expect(EVENT_CHANCE).toBeLessThanOrEqual(1);
  });

  it('every event is well-formed', () => {
    const validBuckets = new Set<string>(BUCKETS);
    for (const e of EVENTS) {
      expect(e.id.length).toBeGreaterThan(0);
      expect(e.weight).toBeGreaterThan(0);
      expect(['good', 'bad', 'mixed']).toContain(e.tone);
      expect(e.copy.whatHappened.length).toBeGreaterThan(0);
      expect(e.copy.smartMove.length).toBeGreaterThan(0);

      // at least one effect must actually do something
      const { returnDeltas, returnOverrides, cashDelta } = e.effects;
      const hasEffect =
        (returnDeltas && Object.keys(returnDeltas).length > 0) ||
        (returnOverrides && Object.keys(returnOverrides).length > 0) ||
        typeof cashDelta === 'number';
      expect(hasEffect).toBe(true);

      // any bucket keys referenced must be real buckets
      for (const key of Object.keys(returnDeltas ?? {})) expect(validBuckets.has(key)).toBe(true);
      for (const key of Object.keys(returnOverrides ?? {})) expect(validBuckets.has(key)).toBe(true);
    }
  });

  it('has unique event ids', () => {
    const ids = EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('stage thresholds', () => {
  it('are ascending and start at zero', () => {
    expect(STAGE_THRESHOLDS[0].min).toBe(0);
    for (let i = 1; i < STAGE_THRESHOLDS.length; i++) {
      expect(STAGE_THRESHOLDS[i].min).toBeGreaterThan(STAGE_THRESHOLDS[i - 1].min);
    }
  });

  it('matches the original tool thresholds (1k / 5k / 20k)', () => {
    const mins = STAGE_THRESHOLDS.map((s) => s.min);
    expect(mins).toEqual([0, 1000, 5000, 20000]);
  });
});

describe('collectibles', () => {
  it('money cards are complete and uniquely identified', () => {
    const ids = MONEY_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of MONEY_CARDS) {
      expect(c.emoji.length).toBeGreaterThan(0);
      expect(c.concept.length).toBeGreaterThan(0);
      expect(c.blurb.length).toBeGreaterThan(0);
      expect(c.unlock.length).toBeGreaterThan(0);
    }
  });

  it('badges are complete and uniquely identified', () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BADGES) {
      expect(b.emoji.length).toBeGreaterThan(0);
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.description.length).toBeGreaterThan(0);
    }
  });
});
