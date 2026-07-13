import { Metadata } from 'next';
import BudgetBuilder from '@/app/components/BudgetBuilder';
import JsonLd from '@/app/components/JsonLd';

export const metadata: Metadata = {
  title: 'Kids Budget Calculator - MoneyVerse',
  description:
    'A free kids budget calculator. Learn to split money into Spend, Save, Give, Needs, Wants, Emergency, and Goals.',
  openGraph: {
    images: ['/api/og?title=Kids+Budget+Calculator&description=Learn+to+split+money+into+Spend,+Save,+Give,+and+Goals'],
  },
};

export default function KidsBudgetCalculatorPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Kids Budget Calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description:
            'A free kids budget calculator. Learn to split money into Spend, Save, Give, Needs, Wants, Emergency, and Goals.',
        }}
      />
      <BudgetBuilder />
    </main>
  );
}
