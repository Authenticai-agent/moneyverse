import { Metadata } from 'next';
import AchievementCard from '@/app/components/AchievementCard';

export const metadata: Metadata = {
  title: 'Achievement Cards - MoneyVerse',
  description:
    'Create safe, shareable achievement cards for kids. Celebrate money skills without sharing personal information.',
  openGraph: {
    images: ['/api/og?title=Achievement+Cards&description=Celebrate+money+skills+without+sharing+personal+information'],
  },
};

export default function AchievementCardsPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <AchievementCard />
    </main>
  );
}
