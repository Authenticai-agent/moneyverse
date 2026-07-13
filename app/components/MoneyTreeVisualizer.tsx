'use client';

import { useMemo } from 'react';

interface MoneyTreeVisualizerProps {
  futureValue: number;
  years: number;
}

export default function MoneyTreeVisualizer({ futureValue, years }: MoneyTreeVisualizerProps) {
  const stage = useMemo(() => {
    if (futureValue < 1000) return 'seed';
    if (futureValue < 5000) return 'sapling';
    if (futureValue < 20000) return 'tree';
    return 'forest';
  }, [futureValue]);

  const scale = useMemo(() => {
    const minScale = 0.25;
    const maxScale = 1.2;
    const value = Math.min(futureValue, 50000);
    const normalized = Math.sqrt(value / 50000);
    return minScale + normalized * (maxScale - minScale);
  }, [futureValue]);

  const stageLabel = {
    seed: 'Seed',
    sapling: 'Sapling',
    tree: 'Growing Tree',
    forest: 'Money Forest',
  }[stage];

  return (
    <div className="w-full flex flex-col items-center justify-end h-80" aria-label="Money Tree visual">
      <div
        className="w-full max-w-xs transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-auto" role="img" aria-label={`${stageLabel} showing ${years} years of growth`}>
          <rect x="95" y="130" width="10" height="60" fill="#78350f" />
          <circle cx="100" cy="110" r="30" fill="#5FD38D" />
          <circle cx="80" cy="100" r="18" fill="#5FD38D" opacity="0.9" />
          <circle cx="120" cy="100" r="18" fill="#5FD38D" opacity="0.9" />
          <circle cx="100" cy="85" r="22" fill="#5FD38D" opacity="0.85" />
          {stage !== 'seed' && (
            <>
              <circle cx="70" cy="120" r="6" fill="#FFD84D" />
              <circle cx="130" cy="120" r="6" fill="#FFD84D" />
              <circle cx="100" cy="70" r="6" fill="#FFD84D" />
            </>
          )}
          {stage === 'forest' && (
            <>
              <circle cx="40" cy="150" r="25" fill="#5FD38D" opacity="0.8" />
              <circle cx="160" cy="150" r="25" fill="#5FD38D" opacity="0.8" />
              <circle cx="40" cy="135" r="8" fill="#FFD84D" />
              <circle cx="160" cy="135" r="8" fill="#FFD84D" />
            </>
          )}
          <ellipse cx="100" cy="190" rx="50" ry="10" fill="#5FD38D" opacity="0.6" />
        </svg>
      </div>
      <p className="text-sm font-medium text-mv-primary mt-2">{stageLabel}</p>
    </div>
  );
}
