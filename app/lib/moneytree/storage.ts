/**
 * Money Tree - local progress persistence
 * ---------------------------------------
 * Best score, collected cards, and earned badges are stored on the device only
 * (no account, no backend). All access is SSR-guarded so it is safe to import
 * from client components rendered on the server.
 */

import type { GameSummary } from './summary';

const STORAGE_KEY = 'moneytree:v1';

export interface MoneyTreeProgress {
  bestScore: number;
  cardIds: string[];
  badgeIds: string[];
  gamesPlayed: number;
}

export function emptyProgress(): MoneyTreeProgress {
  return { bestScore: 0, cardIds: [], badgeIds: [], gamesPlayed: 0 };
}

export function loadProgress(): MoneyTreeProgress {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Partial<MoneyTreeProgress>;
    return {
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
      cardIds: Array.isArray(parsed.cardIds) ? parsed.cardIds : [],
      badgeIds: Array.isArray(parsed.badgeIds) ? parsed.badgeIds : [],
      gamesPlayed: typeof parsed.gamesPlayed === 'number' ? parsed.gamesPlayed : 0,
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: MoneyTreeProgress): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* storage full or disabled - progress is best-effort, ignore */
  }
}

/** Fold a finished game's summary into stored progress. Pure - caller persists. */
export function mergeSummary(
  prev: MoneyTreeProgress,
  summary: GameSummary
): { progress: MoneyTreeProgress; isNewBest: boolean; newCardIds: string[]; newBadgeIds: string[] } {
  const isNewBest = summary.score > prev.bestScore;
  const newCardIds = summary.unlockedCardIds.filter((id) => !prev.cardIds.includes(id));
  const newBadgeIds = summary.earnedBadgeIds.filter((id) => !prev.badgeIds.includes(id));
  const progress: MoneyTreeProgress = {
    bestScore: Math.max(prev.bestScore, summary.score),
    cardIds: [...prev.cardIds, ...newCardIds],
    badgeIds: [...prev.badgeIds, ...newBadgeIds],
    gamesPlayed: prev.gamesPlayed + 1,
  };
  return { progress, isNewBest, newCardIds, newBadgeIds };
}
