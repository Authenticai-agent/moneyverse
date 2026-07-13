import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moneyverse.example.com';

  const routes = [
    '',
    '/tools',
    '/login',
    '/register',
    '/tools/achievement-cards',
    '/tools/business-simulator',
    '/tools/daily-money-quests',
    '/tools/kids-budget-calculator',
    '/tools/lemonade-stand-profit-game',
    '/tools/money-tree-calculator',
    '/tools/savings-goal-calculator',
    '/tools/scam-shield-quiz',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));
}
