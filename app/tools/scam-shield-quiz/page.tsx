import { Metadata } from 'next';
import ScamShieldQuiz from '@/app/components/ScamShieldQuiz';
import JsonLd from '@/app/components/JsonLd';

export const metadata: Metadata = {
  title: 'Scam Shield Quiz - MoneyVerse',
  description:
    'A free, safe scam quiz for kids and students. Learn to spot phishing, fake giveaways, and online money scams with MoneyVerse.',
  openGraph: {
    images: ['/api/og?title=Scam+Shield+Quiz&description=Spot+fake+giveaways,+phishing,+and+online+scams'],
  },
};

export default function ScamShieldQuizPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <JsonLd
        schema={{
          '@context': 'https://schema.org',
          '@type': 'Quiz',
          name: 'Scam Shield Quiz',
          description:
            'A free, safe scam quiz for kids and students. Learn to spot phishing, fake giveaways, and online money scams.',
          educationalLevel: 'Kids',
          isAccessibleForFree: true,
          publisher: { '@type': 'Organization', name: 'MoneyVerse' },
        }}
      />
      <ScamShieldQuiz />
    </main>
  );
}
