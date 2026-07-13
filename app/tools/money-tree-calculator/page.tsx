import { Metadata } from 'next';
import MoneyTreeForm from '@/app/components/MoneyTreeForm';
import JsonLd from '@/app/components/JsonLd';

export const metadata: Metadata = {
  title: 'Money Tree Simulator - MoneyVerse',
  description:
    'A free compound interest calculator for kids. See how weekly savings can grow over time with the MoneyVerse Money Tree simulator.',
  openGraph: {
    images: ['/api/og?title=Money+Tree+Simulator&description=See+how+weekly+savings+grow+over+time'],
  },
};

export default function MoneyTreeCalculatorPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Money Tree Simulator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description:
            'A free compound interest calculator for kids. See how weekly savings can grow over time with the MoneyVerse Money Tree simulator.',
        }}
      />
      <MoneyTreeForm />
    </main>
  );
}
