import { Metadata } from 'next';
import SavingsGoalCalculator from '@/app/components/SavingsGoalCalculator';

export const metadata: Metadata = {
  title: 'Savings Goal Calculator - MoneyVerse',
  description:
    'A free savings goal calculator for kids. Plan how long it will take to save for a bike, toy, or any goal with MoneyVerse.',
};

export default function SavingsGoalCalculatorPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <SavingsGoalCalculator />
    </main>
  );
}
