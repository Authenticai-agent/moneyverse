import { Metadata } from 'next';
import SavingsGoalCalculator from '@/app/components/SavingsGoalCalculator';
import JsonLd from '@/app/components/JsonLd';

export const metadata: Metadata = {
  title: 'Savings Goal Calculator - MoneyVerse',
  description:
    'A free savings goal calculator for kids. Plan how long it will take to save for a bike, toy, or any goal with MoneyVerse.',
  openGraph: {
    images: ['/api/og?title=Savings+Goal+Calculator&description=Plan+how+long+it+will+take+to+save+for+a+goal'],
  },
};

export default function SavingsGoalCalculatorPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Savings Goal Calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description:
            'A free savings goal calculator for kids. Plan how long it will take to save for a bike, toy, or any goal with MoneyVerse.',
        }}
      />
      <SavingsGoalCalculator />
    </main>
  );
}
