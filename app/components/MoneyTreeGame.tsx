'use client';

/**
 * MoneyTreeGame — orchestrator for the Money Tree strategy game.
 * Renders the setup screen, the playable 3D "Stage", or the end report based on
 * the game phase from useMoneyTreeGame. The 3D tree is loaded lazily so the
 * heavy react-three-fiber bundle only arrives when a game is in progress.
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { coinsForYear, normalizeAllocation, totalOf } from '@/app/lib/moneytree/engine';
import { allocationCoachLine, introLine } from '@/app/lib/moneytree/coach';
import { mascotById } from '@/app/lib/moneytree/mascots';
import { useMoneyTreeGame } from '@/app/lib/moneytree/useMoneyTreeGame';
import AllocationBar from './moneytree/AllocationBar';
import Coach from './moneytree/Coach';
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

export default function MoneyTreeGame() {
  const game = useMoneyTreeGame();
  const coach = mascotById(game.config?.mascot ?? 'wizard');

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
  const isFinalTurn = !!game.config && (game.year >= game.config.years || !!game.lastResult?.bankrupt);

  // growth stats for the HUD: vs previous year, and vs everything put in so far
  const currentTotal = totalOf(game.portfolio);
  const prevTotal = game.results.length >= 2 ? game.results[game.results.length - 2].total : null;
  let contributed = 0;
  if (game.config) {
    for (let y = 1; y <= game.results.length; y++) contributed += coinsForYear(game.config, y);
  }

  return (
    <main className="min-h-screen" style={{ background: '#FBFBFE' }}>
      <div className="relative mx-auto w-full max-w-3xl" style={{ height: 'min(88vh, 760px)', margin: '12px auto', borderRadius: 24, overflow: 'hidden', background: STAGE_BG, border: '1px solid #E3EFE6', boxShadow: '0 24px 56px -30px rgba(60,120,80,.45)' }}>
        {/* sky decor */}
        <div aria-hidden style={{ position: 'absolute', top: 30, right: 40, width: 54, height: 54, borderRadius: '50%', background: 'radial-gradient(circle at 32% 28%, #FFECAE, #FFD84D 58%, #F3C218)', boxShadow: '0 6px 18px rgba(243,194,24,.5)' }} />
        {/* ground */}
        <div aria-hidden style={{ position: 'absolute', bottom: 70, left: -80, right: -80, height: 200, background: '#6FCF94', borderRadius: '50% 50% 0 0 / 110px 110px 0 0' }} />

        <HUD total={currentTotal} stage={game.lastResult?.stage ?? 'seed'} year={game.year} totalYears={game.totalYears} best={game.progress.bestScore} prevTotal={prevTotal} contributed={contributed} />

        <TreeScene total={totalOf(game.portfolio)} wilting={wilting} fallback={<PlaceholderTree total={totalOf(game.portfolio)} wilting={wilting} />} />

        {coachText && <Coach emoji={coach.emoji} name={coach.name} text={coachText} />}

        {game.phase === 'playing' && (
          <AllocationBar coins={game.coinsThisYear} allocation={game.allocation} onChange={game.setAllocation} onGrow={game.growYear} />
        )}

        {game.phase === 'resolving' && game.lastResult && (
          <EventCard result={game.lastResult} onContinue={game.next} isFinal={isFinalTurn} mascot={coach} />
        )}
      </div>
    </main>
  );
}
