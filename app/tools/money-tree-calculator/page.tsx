import { Metadata } from 'next';
import MoneyTreeForm from '@/app/components/MoneyTreeForm';

export const metadata: Metadata = {
  title: 'Money Tree Simulator - MoneyVerse',
  description:
    'A free compound interest calculator for kids. See how weekly savings can grow over time with the MoneyVerse Money Tree simulator.',
};

export default function MoneyTreeCalculatorPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <MoneyTreeForm />
    </main>
  );
}
