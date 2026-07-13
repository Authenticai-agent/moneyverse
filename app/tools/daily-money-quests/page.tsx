import { Metadata } from 'next';
import DailyQuest from '@/app/components/DailyQuest';

export const metadata: Metadata = {
  title: 'Daily Money Quests - MoneyVerse',
  description:
    'A free daily money quest for kids. Practice needs vs wants, scam spotting, budgeting, and more with MoneyVerse.',
  openGraph: {
    images: ['/api/og?title=Daily+Money+Quests&description=Practice+needs+vs+wants,+scam+spotting,+and+budgeting'],
  },
};

export default function DailyMoneyQuestsPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <DailyQuest />
    </main>
  );
}
