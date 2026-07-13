import { Metadata } from 'next';
import BusinessSimulator from '@/app/components/BusinessSimulator';
import JsonLd from '@/app/components/JsonLd';

export const metadata: Metadata = {
  title: 'Business Simulator - MoneyVerse',
  description:
    'A free business simulator for kids. Start a lemonade stand and grow into a bakery while learning profit, costs, and pricing.',
  openGraph: {
    images: ['/api/og?title=Business+Simulator&description=Start+a+lemonade+stand+and+grow+into+a+bakery'],
  },
};

export default function BusinessSimulatorPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Business Simulator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description:
            'A free business simulator for kids. Start a lemonade stand and grow into a bakery while learning profit, costs, and pricing.',
        }}
      />
      <BusinessSimulator />
    </main>
  );
}
