import { Metadata } from 'next';
import ScamShieldQuiz from '@/app/components/ScamShieldQuiz';

export const metadata: Metadata = {
  title: 'Scam Shield Quiz - MoneyVerse',
  description:
    'A free, safe scam quiz for kids and students. Learn to spot phishing, fake giveaways, and online money scams with MoneyVerse.',
};

export default function ScamShieldQuizPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <ScamShieldQuiz />
    </main>
  );
}
