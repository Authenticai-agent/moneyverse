'use client';

/**
 * GardenStage - the painted 2.5D World driven by a REAL useMoneyTreeGame
 * session instead of the standalone demo loop. It's a thin bridge:
 *
 *  - it pushes the game's live state (portfolio, this year's tossed coins, the
 *    year, the chosen coach, the real per-year deposit, mood) into
 *    useWorldStore, which every garden sprite already reads for its visuals;
 *  - it rewires the store's four action handlers (addCoin / undoCoin /
 *    resolveYear / cashOutBiggestBucket) to call the game's own toss / undo /
 *    grow / open-cash-out, so tapping a bucket in the painted world drives the
 *    exact same frozen engine the calculator has always used.
 *
 * The coach is fixed by the setup screen and the year-result popup is the host's
 * EventCard, so it renders <World embedded/> (which hides the in-world coach
 * picker and YearResult to avoid doubling up).
 */

import { useEffect, useMemo, useRef } from 'react';
import { outcomeTone } from '@/app/lib/moneytree/coach';
import type { Bucket, MascotId, Portfolio, TurnResult } from '@/app/lib/moneytree/types';
import World from './World';
import { useWorldStore, type WorldMood } from './useWorldStore';

function countCoins(history: Bucket[]): Record<Bucket, number> {
  const c: Record<Bucket, number> = { safe: 0, growth: 0, moonshot: 0 };
  for (const b of history) c[b]++;
  return c;
}

export function GardenStage({
  portfolio,
  tossHistory,
  year,
  coachId,
  deposit,
  lastResult,
  resolving,
  onToss,
  onUndo,
  onGrow,
  onOpenCashOut,
}: {
  portfolio: Portfolio;
  tossHistory: Bucket[];
  year: number;
  coachId: MascotId;
  /** This year's real dollar contribution (from coinsForYear). */
  deposit: number;
  lastResult: TurnResult | null;
  resolving: boolean;
  onToss: (bucket: Bucket) => void;
  onUndo: () => void;
  onGrow: () => void;
  onOpenCashOut: () => void;
}) {
  // Latest handlers in refs so the store actions (installed once) never close
  // over stale game state.
  const tossRef = useRef(onToss);
  tossRef.current = onToss;
  const undoRef = useRef(onUndo);
  undoRef.current = onUndo;
  const growRef = useRef(onGrow);
  growRef.current = onGrow;
  const cashRef = useRef(onOpenCashOut);
  cashRef.current = onOpenCashOut;

  // Install the bridge once; restore the demo handlers on unmount so the
  // standalone /dev/ world still works after visiting the game.
  useEffect(() => {
    const demo = useWorldStore.getState();
    const saved = {
      addCoin: demo.addCoin,
      undoCoin: demo.undoCoin,
      resolveYear: demo.resolveYear,
      cashOutBiggestBucket: demo.cashOutBiggestBucket,
    };
    useWorldStore.setState({
      addCoin: (b: Bucket) => tossRef.current(b),
      undoCoin: () => undoRef.current(),
      resolveYear: () => growRef.current(),
      cashOutBiggestBucket: () => cashRef.current(),
    });
    return () => useWorldStore.setState(saved);
  }, []);

  const coinsThisYear = useMemo(() => countCoins(tossHistory), [tossHistory]);
  const tone = lastResult ? outcomeTone(lastResult) : null;
  const mood: WorldMood = tone === 'good' ? 'good' : tone === 'bad' ? 'bad' : 'neutral';

  // Sync the game's live state into the presentation store on every change.
  useEffect(() => {
    useWorldStore.setState({
      portfolio,
      coinsThisYear,
      coinHistory: tossHistory,
      year,
      selectedCoachId: coachId,
      yearlyDeposit: deposit,
      mood,
      // Hide the in-world CoachSpeech while the host's EventCard is up.
      lastResult: resolving ? lastResult : null,
      // A fresh round starts with an empty pile and nothing mid-air.
      ...(tossHistory.length === 0 ? { coinsInFlight: { safe: 0, growth: 0, moonshot: 0 } } : {}),
    });
  }, [portfolio, coinsThisYear, tossHistory, year, coachId, deposit, mood, resolving, lastResult]);

  return <World embedded />;
}
