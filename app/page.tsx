import MoneyVerseHero from './components/MoneyVerseHero';
import WaitlistSection from './components/WaitlistSection';

export default function Home() {
  return (
    <main className="text-mv-dark">
      <MoneyVerseHero />

      <section className="min-h-screen flex items-center justify-center px-6 py-20 bg-mv-light">
        <WaitlistSection />
      </section>
    </main>
  );
}
