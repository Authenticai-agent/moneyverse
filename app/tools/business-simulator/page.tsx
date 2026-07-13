import { Metadata } from 'next';
import BusinessSimulator from '@/app/components/BusinessSimulator';

export const metadata: Metadata = {
  title: 'Business Simulator - MoneyVerse',
  description:
    'A free business simulator for kids. Start a lemonade stand and grow into a bakery while learning profit, costs, and pricing.',
};

export default function BusinessSimulatorPage() {
  return (
    <main className="min-h-screen bg-mv-light text-mv-dark py-12 px-6">
      <BusinessSimulator />
    </main>
  );
}
