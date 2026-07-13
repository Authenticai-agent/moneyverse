'use client';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

export interface SeasonTheme {
  ground: string;
  foliage: string;
  tree: string;
  leaf: string;
  particle: string | null;
}

export function getSeasonTheme(season: Season): SeasonTheme {
  switch (season) {
    case 'spring':
      return { ground: '#5FD38D', foliage: '#22c55e', tree: '#16a34a', leaf: '#86efac', particle: null };
    case 'summer':
      return { ground: '#4ade80', foliage: '#15803d', tree: '#15803d', leaf: '#22c55e', particle: null };
    case 'autumn':
      return { ground: '#D9CFFF', foliage: '#d97706', tree: '#b45309', leaf: '#f59e0b', particle: '#f59e0b' };
    case 'winter':
      return { ground: '#e2e8f0', foliage: '#475569', tree: '#64748b', leaf: '#cbd5e1', particle: '#ffffff' };
    default:
      return { ground: '#5FD38D', foliage: '#22c55e', tree: '#16a34a', leaf: '#86efac', particle: null };
  }
}
