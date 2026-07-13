import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Explore MoneyVerse - Free Money Tools for Kids',
  description:
    'Explore free money tools, games, and calculators for kids. Build budgets, grow a money tree, run a lemonade stand, and more.',
  openGraph: {
    images: ['/api/og?title=Explore+MoneyVerse&description=Free+money+tools+and+games+for+kids+and+families'],
  },
};

const tools = [
  {
    href: '/tools/money-tree-calculator',
    title: 'Money Tree Simulator',
    description: 'See how weekly savings grow with compound interest.',
  },
  {
    href: '/tools/savings-goal-calculator',
    title: 'Savings Goal Calculator',
    description: 'Plan how long it will take to save for a goal.',
  },
  {
    href: '/tools/kids-budget-calculator',
    title: 'Kids Budget Calculator',
    description: 'Learn to split money into Spend, Save, Give, and Goals.',
  },
  {
    href: '/tools/lemonade-stand-profit-game',
    title: 'Lemonade Stand Profit Game',
    description: 'Set prices, buy ingredients, and learn profit and revenue.',
  },
  {
    href: '/tools/business-simulator',
    title: 'Business Simulator',
    description: 'Grow a lemonade stand into a bakery while learning business basics.',
  },
  {
    href: '/tools/daily-money-quests',
    title: 'Daily Money Quests',
    description: 'Practice needs vs wants, scam spotting, and budgeting.',
  },
  {
    href: '/tools/scam-shield-quiz',
    title: 'Scam Shield Quiz',
    description: 'Learn to spot phishing, fake giveaways, and online scams.',
  },
  {
    href: '/tools/achievement-cards',
    title: 'Achievement Cards',
    description: 'Create safe, shareable cards that celebrate money skills.',
  },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-mv-light p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-mv-dark mb-4">Explore MoneyVerse</h1>
        <p className="text-mv-dark/70 mb-8 max-w-2xl">
          Free, safe money tools and games built for kids, families, and classrooms. No bank connection required.
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <li key={tool.href}>
              <Link
                prefetch={false}
                href={tool.href}
                className="block h-full p-6 rounded-2xl bg-white shadow-sm hover:bg-mv-lavender transition"
              >
                <h2 className="text-xl font-semibold text-mv-dark mb-2">{tool.title}</h2>
                <p className="text-mv-dark/70 text-sm">{tool.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
