import { Metadata } from 'next';
import BudgetBuilder from '@/app/components/BudgetBuilder';

export const metadata: Metadata = {
  title: 'Kids Budget Calculator - MoneyVerse',
  description:
    'A free kids budget calculator. Learn to split money into Spend, Save, Give, Needs, Wants, Emergency, and Goals.',
};

export default function KidsBudgetCalculatorPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <BudgetBuilder />
    </main>
  );
}
