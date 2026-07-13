import { Metadata } from 'next';
import ToolsIndexWrapper from '../components/ToolsIndexWrapper';

export const metadata: Metadata = {
  title: 'Explore MoneyVerse - Free Money Tools for Kids',
  description:
    'Explore free money tools, games, and calculators for kids. Build budgets, grow a money tree, run a lemonade stand, and more.',
  openGraph: {
    images: ['/api/og?title=Explore+MoneyVerse&description=Free+money+tools+and+games+for+kids+and+families'],
  },
};

export default function ToolsPage() {
  return <ToolsIndexWrapper />;
}
