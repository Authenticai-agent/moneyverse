'use client';

/**
 * MoneyTreeGame — orchestrator for the Money Tree strategy game.
 * Renders the setup screen, the playable 3D "Stage", or the end report based on
 * the game phase from useMoneyTreeGame. The 3D tree is loaded lazily so the
 * heavy react-three-fiber bundle only arrives when a game is in progress.
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BANKRUPT_THRESHOLD, STAGE_THRESHOLDS } from '@/app/lib/moneytree/content';
import { coinsForYear, normalizeAllocation, totalOf } from '@/app/lib/moneytree/engine';
import { allocationCoachLine, introLine, outcomeTone } from '@/app/lib/moneytree/coach';
import { mascotById } from '@/app/lib/moneytree/mascots';
import { isMuted, setMuted, sfx } from '@/app/lib/moneytree/sound';
import type { Stage } from '@/app/lib/moneytree/types';
import { useMoneyTreeGame } from '@/app/lib/moneytree/useMoneyTreeGame';
import AllocationBar from './moneytree/AllocationBar';
import CashOutPanel from './moneytree/CashOutPanel';
import Coach from './moneytree/Coach';
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
@media (prefers-reduced-motion: reduce) {
  .mtg-confetti-piece, .mtg-shake { animation: none !important; }
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
        <SetupScreen onStart={game.startGame} />
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
          onReplay={game.replay}
          onNewPlan={game.resetToSetup}
        />
      </main>
    );
  }

  // playing or resolving → the Stage
  const weights = normalizeAllocation(game.allocation);
  const riskLine = allocationCoachLine(coach, weights);
  const coachText = game.phase === 'playing' ? (riskLine ?? (game.year === 1 ? introLine(coach) : null)) : null;
  const wilting = !!game.lastResult && game.lastResult.total < totalOf(game.lastResult.before);
  const combinedWealth = (game.lastResult?.total ?? 0) + game.cashOut;
  const isFinalTurn = !!game.config && (game.year >= game.config.years || combinedWealth <= BANKRUPT_THRESHOLD);

  // growth stats for the HUD: vs previous year, and vs everything put in so far
  const currentTotal = totalOf(game.portfolio);
  const prevTotal = game.results.length >= 2 ? game.results[game.results.length - 2].total : null;
  let contributed = 0;
  if (game.config) {
    for (let y = 1; y <= game.results.length; y++) contributed += coinsForYear(game.config, y);
  }

  return (
    <main className="min-h-screen" style={{ background: '#FBFBFE' }}>
      <style dangerouslySetInnerHTML={{ __html: JUICE_STYLES }} />
      <div
        className={`relative mx-auto w-full max-w-3xl${shaking ? ' mtg-shake' : ''}`}
        style={{
          height: 'min(88vh, 760px)', margin: '12px auto', borderRadius: 24, overflow: 'hidden',
          background: STAGE_BG, border: '1px solid #E3EFE6', boxShadow: '0 24px 56px -30px rgba(60,120,80,.45)',
        }}
      >
        {/* sky decor */}
        <div aria-hidden style={{ position: 'absolute', top: 30, right: 40, width: 54, height: 54, borderRadius: '50%', background: 'radial-gradient(circle at 32% 28%, #FFECAE, #FFD84D 58%, #F3C218)', boxShadow: '0 6px 18px rgba(243,194,24,.5)' }} />
        {/* ground */}
        <div aria-hidden style={{ position: 'absolute', bottom: 70, left: -80, right: -80, height: 200, background: '#6FCF94', borderRadius: '50% 50% 0 0 / 110px 110px 0 0' }} />

        <HUD
          total={currentTotal}
          stage={game.lastResult?.stage ?? 'seed'}
          year={game.year}
          totalYears={game.totalYears}
          best={game.progress.bestScore}
          prevTotal={prevTotal}
          contributed={contributed}
          muted={muted}
          onToggleMuted={toggleMuted}
        />

        <TreeScene total={totalOf(game.portfolio)} wilting={wilting} fallback={<PlaceholderTree total={totalOf(game.portfolio)} wilting={wilting} />} />

        {celebrating && <Confetti />}

        {coachText && <Coach emoji={coach.emoji} name={coach.name} text={coachText} />}

        {/*
          Always mounted (never conditionally rendered) — toggling this in and
          out of the tree previously triggered a layout-corruption bug in the
          Stage's other absolutely-positioned children. Visibility is
          controlled with CSS instead of mount/unmount.
        */}
        <div style={{ visibility: game.phase === 'playing' ? 'visible' : 'hidden' }}>
          <AllocationBar
            coins={game.coinsThisYear}
            allocation={game.allocation}
            onChange={game.setAllocation}
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
