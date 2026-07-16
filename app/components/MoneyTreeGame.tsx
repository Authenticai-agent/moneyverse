'use client';

/**
 * MoneyTreeGame - orchestrator for the Money Tree strategy game.
 * Renders the setup screen, the playable 3D "Stage", or the end report based on
 * the game phase from useMoneyTreeGame. The 3D tree is loaded lazily so the
 * heavy react-three-fiber bundle only arrives when a game is in progress.
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BANKRUPT_THRESHOLD, STAGE_THRESHOLDS } from '@/app/lib/moneytree/content';
import { coinsForYear, normalizeAllocation, stageOf, totalOf } from '@/app/lib/moneytree/engine';
import { allocationCoachLine, cashOutGreetingLine, introLine, outcomeTone, playingPhaseLine } from '@/app/lib/moneytree/coach';
import { mascotById } from '@/app/lib/moneytree/mascots';
import { isMuted, setMuted, sfx } from '@/app/lib/moneytree/sound';
import type { Bucket, Stage } from '@/app/lib/moneytree/types';
import { useMoneyTreeGame } from '@/app/lib/moneytree/useMoneyTreeGame';
import AllocationBar from './moneytree/AllocationBar';
import CashOutPanel from './moneytree/CashOutPanel';
import Coach from './moneytree/Coach';
import { NUM_COINS } from './moneytree/CoinToss';
import Confetti from './moneytree/Confetti';
import EventCard from './moneytree/EventCard';
import HUD from './moneytree/HUD';
import PlaceholderTree from './moneytree/PlaceholderTree';
import SetupScreen from './moneytree/SetupScreen';
import ReportScreen from './moneytree/ReportScreen';

const TreeScene = dynamic(() => import('./moneytree/TreeScene'), {
  ssr: false,
  loading: () => null,
});

const STAGE_BG = 'linear-gradient(180deg, #E9F5FF 0%, #F4FBF3 58%, #E0F5E7 100%)';

const JUICE_STYLES = `
@keyframes mtgConfettiFall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateY(420px) rotate(340deg); opacity: 0; }
}
@keyframes mtgShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(7px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(4px); }
}
.mtg-shake { animation: mtgShake .4s ease-in-out; }
@keyframes mtg-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.mtg-bucket-card { transition: transform .12s ease, box-shadow .12s ease; }
.mtg-bucket-card:active { transform: scale(0.96); }
@media (hover: hover) {
  .mtg-bucket-card:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -12px rgba(30,20,60,.35); }
}
@media (prefers-reduced-motion: reduce) {
  .mtg-confetti-piece, .mtg-shake { animation: none !important; }
  [style*="mtg-bob"] { animation: none !important; }
  .mtg-bucket-card, .mtg-bucket-card:hover, .mtg-bucket-card:active { transform: none !important; }
}
`;

function stageRank(stage: Stage): number {
  return STAGE_THRESHOLDS.findIndex((t) => t.stage === stage);
}

export default function MoneyTreeGame() {
  const game = useMoneyTreeGame();
  const coach = mascotById(game.config?.mascot ?? 'wizard');
  const [cashOutOpen, setCashOutOpen] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Which bucket each of this year's coins has been tossed into so far, in
  // order - the single source of truth the 3D coin toss and the 2D readout
  // both render from. `epoch` bumps on every new game/replay (on top of
  // `game.year` already changing every turn) so a fresh coin pile always
  // starts empty, even for a 1-year game replayed back-to-back.
  const [tossHistory, setTossHistory] = useState<Bucket[]>([]);
  const [epoch, setEpoch] = useState(0);
  const roundKey = `${epoch}-${game.year}`;
  // Reset the pile the instant a new round starts (rather than in an
  // effect, which would paint one stale frame first) - this is React's
  // documented pattern for resetting state when a derived key changes.
  const [prevRoundKey, setPrevRoundKey] = useState(roundKey);
  if (roundKey !== prevRoundKey) {
    setPrevRoundKey(roundKey);
    setTossHistory([]);
  }

  const toss = (bucket: Bucket) => {
    if (game.phase !== 'playing' || tossHistory.length >= NUM_COINS) return;
    setTossHistory((h) => [...h, bucket]);
  };
  const undoToss = () => {
    if (tossHistory.length === 0) return;
    sfx.coinBack();
    setTossHistory((h) => h.slice(0, -1));
  };

  // Convert the coin toss into the engine's weighted allocation - no bucket
  // gets a coin until the player actually taps it (AllocationBar's "Grow the
  // year" button stays disabled until every coin is placed, so this never
  // reaches the engine still holding unplaced coins in practice; normalizeAllocation's
  // own all-zero fallback to 100% Safe only matters before the very first tap).
  useEffect(() => {
    const counts: Record<Bucket, number> = { safe: 0, growth: 0, moonshot: 0 };
    for (const b of tossHistory) counts[b]++;
    game.setAllocation(counts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tossHistory]);

  const startGame: typeof game.startGame = (config) => {
    setEpoch((e) => e + 1);
    game.startGame(config);
  };
  const replay: typeof game.replay = () => {
    setEpoch((e) => e + 1);
    game.replay();
  };

  const prevStageRef = useRef<Stage | null>(null);
  const celebTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => setMutedState(isMuted()), []);

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.click();
  };

  // "Maximized" always drives the visual size via CSS (works on every device,
  // including iOS Safari which has no fullscreen API for arbitrary elements);
  // the native Fullscreen API is layered on top as a bonus where supported,
  // so on desktop/Android it also hides browser chrome. `fullscreenchange`
  // keeps the two in sync if the player exits fullscreen a native way (Esc,
  // browser UI) instead of the in-game button.
  const toggleMaximized = () => {
    const next = !maximized;
    setMaximized(next);
    if (next) {
      stageRef.current?.requestFullscreen?.().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setMaximized(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!maximized) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaximized(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [maximized]);

  const triggerShake = () => {
    setShaking(false);
    requestAnimationFrame(() => {
      setShaking(true);
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => setShaking(false), 420);
    });
  };

  // React to each newly resolved year: play a sound, celebrate a stage-up, shake on trouble.
  useEffect(() => {
    if (!game.lastResult) return;
    const result = game.lastResult;
    const prevRank = prevStageRef.current === null ? null : stageRank(prevStageRef.current);
    const stageUp = prevRank !== null && stageRank(result.stage) > prevRank;
    prevStageRef.current = result.stage;

    if (result.bankrupt) {
      sfx.bankrupt();
      triggerShake();
    } else if (stageUp) {
      sfx.stageUp();
      setCelebrating(true);
      clearTimeout(celebTimerRef.current);
      celebTimerRef.current = setTimeout(() => setCelebrating(false), 2200);
    } else {
      const tone = outcomeTone(result);
      if (tone === 'good') sfx.gain();
      else if (tone === 'bad') {
        sfx.loss();
        triggerShake();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.lastResult]);

  // A fresh best score, celebrated once the report screen lands.
  useEffect(() => {
    if (game.phase === 'report' && game.isNewBest) {
      const t = setTimeout(() => sfx.newBest(), 350);
      return () => clearTimeout(t);
    }
  }, [game.phase, game.isNewBest]);

  useEffect(
    () => () => {
      clearTimeout(celebTimerRef.current);
      clearTimeout(shakeTimerRef.current);
    },
    []
  );

  if (game.phase === 'setup') {
    return (
      <main className="min-h-screen" style={{ background: '#FBFBFE' }}>
        <div className="px-6 pt-6">
          <Link href="/tools" prefetch={false} style={{ fontSize: 12.5, fontWeight: 600, color: '#8B7FC0', textDecoration: 'none' }}>
            ← Free Tools
          </Link>
        </div>
        <SetupScreen onStart={startGame} />
      </main>
    );
  }

  if (game.phase === 'report' && game.summary && game.config) {
    return (
      <main className="min-h-screen" style={{ background: '#FBFBFE' }}>
        <ReportScreen
          summary={game.summary}
          config={game.config}
          results={game.results}
          coach={coach}
          isNewBest={game.isNewBest}
          newCardIds={game.newCardIds}
          newBadgeIds={game.newBadgeIds}
          onReplay={replay}
          onNewPlan={game.resetToSetup}
        />
      </main>
    );
  }

  // playing or resolving → the Stage
  const weights = normalizeAllocation(game.allocation);
  const riskLine = allocationCoachLine(coach, weights);
  // Priority while playing: an active risk warning first (safety-critical),
  // then the year-1 intro, then a rotating mix of educational tips and
  // proactive cash-out nudges so there's always something to learn.
  let coachReaction: { text: string; warn: boolean } | null = null;
  if (game.phase === 'playing') {
    if (riskLine) {
      coachReaction = riskLine;
    } else if (game.year === 1) {
      coachReaction = { text: introLine(coach), warn: false };
    } else {
      coachReaction = { text: playingPhaseLine(coach, { year: game.year, portfolio: game.portfolio }), warn: false };
    }
  }
  const coachText = coachReaction?.text ?? null;
  const coachWarn = coachReaction?.warn ?? false;
  const wilting = !!game.lastResult && game.lastResult.total < totalOf(game.lastResult.before);
  const combinedWealth = (game.lastResult?.total ?? 0) + game.cashOut;
  const isFinalTurn = !!game.config && (game.year >= game.config.years || combinedWealth <= BANKRUPT_THRESHOLD);

  // growth stats for the HUD: this year's actual return, and combined-wealth
  // growth vs everything put in so far.
  const currentTotal = totalOf(game.portfolio);
  const lastResult = game.lastResult;
  // The pool this year's return was actually earned on: the portfolio before
  // this turn, plus the deposit placed into it (both land in the bucket
  // before the return multiplies it - see engine.ts applyTurn). Comparing
  // the after-turn total against just "before" would count the new deposit's
  // principal as if it were investment growth.
  const yoyBase = lastResult ? totalOf(lastResult.before) + lastResult.contribution : null;
  const yoy = yoyBase !== null && yoyBase > 0 ? (lastResult!.total - yoyBase) / yoyBase : null;
  let contributed = 0;
  if (game.config) {
    for (let y = 1; y <= game.results.length; y++) contributed += coinsForYear(game.config, y);
  }
  // Combined wealth (tree + cashed-out), matching the Best-score and final
  // report's definition of "total growth" - excluding cash-out here would
  // make the stat look worse right after a player wisely locks in gains.
  const liveWealth = currentTotal + game.cashOut;
  const totalGrowth = contributed > 0 ? (liveWealth - contributed) / contributed : null;

  return (
    <main className="min-h-screen" style={{ background: '#FBFBFE' }}>
      <style dangerouslySetInnerHTML={{ __html: JUICE_STYLES }} />
      <div
        ref={stageRef}
        className={`relative mx-auto w-full max-w-3xl${shaking ? ' mtg-shake' : ''}`}
        style={{
          height: maximized ? '100dvh' : 'min(88dvh, 760px)',
          margin: maximized ? 0 : '12px auto',
          maxWidth: maximized ? 'none' : undefined,
          position: maximized ? 'fixed' : 'relative',
          top: maximized ? 0 : undefined,
          left: maximized ? 0 : undefined,
          right: maximized ? 0 : undefined,
          bottom: maximized ? 0 : undefined,
          zIndex: maximized ? 50 : undefined,
          borderRadius: maximized ? 0 : 24,
          overflow: 'hidden',
          background: STAGE_BG,
          border: maximized ? 'none' : '1px solid #E3EFE6',
          boxShadow: maximized ? 'none' : '0 24px 56px -30px rgba(60,120,80,.45)',
          containerType: 'inline-size',
        }}
      >
        {/* sky decor */}
        <div aria-hidden style={{ position: 'absolute', top: 30, right: 40, width: 54, height: 54, borderRadius: '50%', background: 'radial-gradient(circle at 32% 28%, #FFECAE, #FFD84D 58%, #F3C218)', boxShadow: '0 6px 18px rgba(243,194,24,.5)' }} />

        <HUD
          total={currentTotal}
          stage={stageOf(currentTotal)}
          year={game.year}
          totalYears={game.totalYears}
          best={game.progress.bestScore}
          yoy={yoy}
          totalGrowth={totalGrowth}
          muted={muted}
          onToggleMuted={toggleMuted}
          maximized={maximized}
          onToggleMaximized={toggleMaximized}
        />

        <TreeScene
          total={totalOf(game.portfolio)}
          wilting={wilting}
          tossHistory={tossHistory}
          tossInteractive={game.phase === 'playing'}
          onToss={toss}
          fallback={<PlaceholderTree total={totalOf(game.portfolio)} wilting={wilting} />}
        />

        {coachText && <Coach emoji={coach.emoji} name={coach.name} text={coachText} warn={coachWarn} />}

        {celebrating && <Confetti />}

        {/*
          Always mounted (never conditionally rendered) - toggling this in and
          out of the tree previously triggered a layout-corruption bug in the
          Stage's other absolutely-positioned children. Visibility is
          controlled with CSS instead of mount/unmount.
        */}
        <div style={{ visibility: game.phase === 'playing' ? 'visible' : 'hidden' }}>
          <AllocationBar
            coins={game.coinsThisYear}
            numCoins={NUM_COINS}
            history={tossHistory}
            portfolio={game.portfolio}
            onToss={toss}
            onUndo={undoToss}
            onGrow={() => {
              sfx.grow();
              game.growYear();
            }}
            onOpenCashOut={() => setCashOutOpen(true)}
            cashOut={game.cashOut}
            canSell={currentTotal > 0}
            disabled={game.phase !== 'playing'}
          />
        </div>

        {game.phase === 'playing' && cashOutOpen && (
          <CashOutPanel
            portfolio={game.portfolio}
            cashOut={game.cashOut}
            mascot={coach}
            sellMessage={game.lastSellMessage}
            greeting={cashOutGreetingLine(coach, game.year)}
            onSell={(bucket, fraction) => {
              game.sellShares(bucket, fraction);
              sfx.cashOut();
            }}
            onClose={() => setCashOutOpen(false)}
          />
        )}

        {game.phase === 'resolving' && game.lastResult && (
          <EventCard result={game.lastResult} onContinue={game.next} isFinal={isFinalTurn} mascot={coach} />
        )}
      </div>
    </main>
  );
}
