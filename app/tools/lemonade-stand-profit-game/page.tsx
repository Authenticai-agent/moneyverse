import { Metadata } from 'next';
import LemonadeStandGame from '@/app/components/LemonadeStandGame';
import JsonLd from '@/app/components/JsonLd';

export const metadata: Metadata = {
  title: 'Lemonade Stand Profit Game - MoneyVerse',
  description:
    'A free lemonade stand business game for kids. Set prices, buy ingredients, watch the weather, and learn profit and revenue.',
  openGraph: {
    images: ['/api/og?title=Lemonade+Stand+Profit+Game&description=Set+prices,+buy+ingredients,+and+learn+profit+and+revenue'],
  },
};

export default function LemonadeStandPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Lemonade Stand Profit Game',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description:
            'A free lemonade stand business game for kids. Set prices, buy ingredients, watch the weather, and learn profit and revenue.',
        }}
      />
      <LemonadeStandGame />
    </main>
  );
}
