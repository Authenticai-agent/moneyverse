export interface Achievement {
  id: string;
  badge: string;
  skill: string;
  color: string;
  icon: string;
}

export const achievements: Achievement[] = [
  {
    id: 'scam-shield-hero',
    badge: 'Scam Shield Hero',
    skill: 'Digital safety',
    color: '#6B4EFF',
    icon: '🛡️',
  },
  {
    id: 'budget-builder',
    badge: 'Budget Builder',
    skill: 'Budgeting',
    color: '#5FD38D',
    icon: '📊',
  },
  {
    id: 'money-tree-planter',
    badge: 'Money Tree Planter',
    skill: 'Saving and compound growth',
    color: '#22c55e',
    icon: '🌳',
  },
  {
    id: 'lemonade-ceo',
    badge: 'Lemonade CEO',
    skill: 'Profit and entrepreneurship',
    color: '#FFD84D',
    icon: '🍋',
  },
  {
    id: 'unit-price-detective',
    badge: 'Unit Price Detective',
    skill: 'Smart shopping',
    color: '#5CE1E6',
    icon: '🔍',
  },
  {
    id: 'subscription-slayer',
    badge: 'Subscription Slayer',
    skill: 'Managing recurring costs',
    color: '#f59e0b',
    icon: '⚔️',
  },
];
