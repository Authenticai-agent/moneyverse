'use client';

/**
 * MoneyTreeGame - orchestrator for the Money Tree strategy game.
 * Renders the setup screen, the playable 3D "Stage", or the end report based on
 * the game phase from useMoneyTreeGame. The 3D tree is loaded lazily so the
 * heavy react-three-fiber bundle only arrives when a game is in progress.
 */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BANKRUPT_THRESHOLD, STAGE_THRESHOLDS } from '@/app/lib/moneytree/content';
import { cashOutGreetingLine, outcomeTone } from '@/app/lib/moneytree/coach';
import { mascotById } from '@/app/lib/moneytree/mascots';
import { isMuted, setMuted, sfx } from '@/app/lib/moneytree/sound';
import type { Bucket, Stage } from '@/app/lib/moneytree/types';
import { useMoneyTreeGame } from '@/app/lib/moneytree/useMoneyTreeGame';
import CashOutPanel from './moneytree/CashOutPanel';
import Confetti from './moneytree/Confetti';
import EventCard from './moneytree/EventCard';
import SetupScreen from './moneytree/SetupScreen';
import ReportScreen from './moneytree/ReportScreen';
import Trailer from './moneytree/Trailer';
import { GardenStage } from './moneytree-world/GardenStage';
import { COINS_PER_YEAR } from './moneytree-world/useWorldStore';

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
  // The intro trailer plays once on first open (fresh navigation from /tools),
  // then reveals the setup screen. It doesn't replay on "New plan" because the
  // component stays mounted.
  const [showTrailer, setShowTrailer] = useState(true);
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
    if (game.phase !== 'playing' || tossHistory.length >= COINS_PER_YEAR) return;
    setTossHistory((h) => [...h, bucket]);
  };
  // Silent - GardenControls plays the coin-back sound for its own Undo button.
  const undoToss = () => {
    if (tossHistory.length === 0) return;
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

  // The playing view fills the whole viewport, so stop the page behind it from
  // scrolling while a game is in progress.
  useEffect(() => {
    if (game.phase !== 'playing' && game.phase !== 'resolving') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [game.phase]);

  if (showTrailer) {
    return <Trailer src="/video/money-tree-trailer.mp4" onDone={() => setShowTrailer(false)} />;
  }

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

  // playing or resolving → the painted garden Stage, driven by the real game.
  const combinedWealth = (game.lastResult?.total ?? 0) + game.cashOut;
  const isFinalTurn = !!game.config && (game.year >= game.config.years || combinedWealth <= BANKRUPT_THRESHOLD);

  return (
    <main className="min-h-screen" style={{ background: '#FBFBFE' }}>
      <style>{JUICE_STYLES}</style>
      <div
        ref={stageRef}
        className={shaking ? 'mtg-shake' : undefined}
        style={{
          // Full-viewport immersive play area (same as the old /dev/ world),
          // rather than a small centered card. The maximize button layers the
          // native Fullscreen API on top to also hide the browser chrome.
          position: 'fixed',
          inset: 0,
          height: '100dvh',
          width: '100%',
          zIndex: 40,
          overflow: 'hidden',
          background: STAGE_BG,
          containerType: 'inline-size',
        }}
      >
        {/* The painted 2.5D garden IS the playing view now. It reads the live
            game state and its control bar drives the real engine (GardenStage
            bridges the two). The tree, coach and coin-toss all live inside it. */}
        <GardenStage
          portfolio={game.portfolio}
          tossHistory={tossHistory}
          year={game.year}
          coachId={game.config?.mascot ?? 'wizard'}
          deposit={game.coinsThisYear}
          lastResult={game.lastResult}
          resolving={game.phase === 'resolving'}
          onToss={toss}
          onUndo={undoToss}
          onGrow={() => game.growYear()}
          onOpenCashOut={() => setCashOutOpen(true)}
        />

        {/* Fullscreen toggle - mute + year + tree value now live in the garden bar. */}
        <button
          type="button"
          onClick={toggleMaximized}
          aria-label={maximized ? 'Exit full screen' : 'Full screen'}
          style={{ position: 'absolute', top: 12, left: 12, zIndex: 8, width: 36, height: 36, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'rgba(24,20,42,.42)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: '#fff', display: 'grid', placeItems: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>

        {celebrating && <Confetti />}

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
