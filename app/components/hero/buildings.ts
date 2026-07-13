import type { Season } from './Season';

export type BuildingShape = 'box' | 'cylinder' | 'tower' | 'observatory' | 'vault' | 'stall' | 'hub' | 'garden';

export interface BuildingData {
  label: string;
  description: string;
  position: [number, number, number];
  color: string;
  size: [number, number, number];
  shape: BuildingShape;
  roofColor?: string;
  stage: number;
}

export const BUILDINGS: BuildingData[] = [
  {
    label: 'Budgeting',
    description: 'Plan where your money should go before you spend it.',
    position: [-1.5, 0.2, -1],
    color: '#6B4EFF',
    roofColor: '#FFD84D',
    size: [0.8, 0.8, 0.8],
    shape: 'box',
    stage: 1,
  },
  {
    label: 'Entrepreneurship',
    description: 'Learn revenue, costs, profit, pricing, and customer value.',
    position: [0, 0, 1.5],
    color: '#facc15',
    size: [0.6, 0.5, 0.4],
    shape: 'stall',
    stage: 1,
  },
  {
    label: 'Learning',
    description: 'Complete short lessons and build real-world financial skills.',
    position: [-1.2, 0.3, 1.2],
    color: '#a78bfa',
    size: [0.7, 1, 0.6],
    shape: 'box',
    stage: 2,
  },
  {
    label: 'Knowledge',
    description: 'Discover lessons and financial concepts for all ages.',
    position: [1.2, 0.3, 1.2],
    color: '#3b82f6',
    size: [0.7, 1, 0.6],
    shape: 'box',
    stage: 2,
  },
  {
    label: 'Saving',
    description: 'Build toward goals and prepare for unexpected expenses.',
    position: [0, 0.1, -1.5],
    color: '#fbbf24',
    size: [0.7, 0.7, 0.7],
    shape: 'vault',
    stage: 2,
  },
  {
    label: 'Business Basics',
    description: 'Set prices, buy supplies, serve customers, and calculate profit.',
    position: [1.5, 0.1, -1],
    color: '#f59e0b',
    size: [0.7, 0.7, 0.7],
    shape: 'box',
    stage: 3,
  },
  {
    label: 'Entrepreneurship',
    description: 'Learn revenue, costs, profit, pricing, and customer value.',
    position: [2.5, 0.4, -1.2],
    color: '#64748b',
    size: [0.6, 1.4, 0.6],
    shape: 'tower',
    stage: 3,
  },
  {
    label: 'Investing',
    description: 'Explore long-term growth, diversification, and risk through simulations.',
    position: [-2.8, 0.2, 0],
    color: '#F8F8FF',
    size: [0.8, 0.9, 0.8],
    shape: 'observatory',
    stage: 3,
  },
  {
    label: 'Life Costs',
    description: 'Learn how transportation choices affect a budget.',
    position: [2.8, 0.2, 1.2],
    color: '#5CE1E6',
    size: [1.2, 0.4, 0.6],
    shape: 'hub',
    stage: 4,
  },
  {
    label: 'Patience and Growth',
    description: 'Small, consistent actions can create meaningful long-term results.',
    position: [-1.8, 0.1, 2.2],
    color: '#5FD38D',
    size: [1.0, 0.2, 0.8],
    shape: 'garden',
    stage: 4,
  },
  {
    label: 'Sustainable Choices',
    description: 'Solar energy helps keep the world clean and the budget smart.',
    position: [0.5, 0.1, 2.5],
    color: '#1e40af',
    roofColor: '#1e3a8a',
    size: [0.7, 0.2, 0.5],
    shape: 'box',
    stage: 4,
  },
];

export function isBuildingVisible(stage: number, progress: number) {
  return progress >= (stage - 1) * 0.25;
}

export function gardenColor(season: Season) {
  return season === 'autumn' ? '#d97706' : season === 'winter' ? '#94a3b8' : '#5FD38D';
}
