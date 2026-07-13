import { Metadata } from 'next';
import LemonadeStandGame from '@/app/components/LemonadeStandGame';

export const metadata: Metadata = {
  title: 'Lemonade Stand Profit Game - MoneyVerse',
  description:
    'A free lemonade stand business game for kids. Set prices, buy ingredients, watch the weather, and learn profit and revenue.',
};

export default function LemonadeStandPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <LemonadeStandGame />
    </main>
  );
}
