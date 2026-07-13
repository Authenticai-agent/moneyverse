import Hero from './components/Hero';
import WaitlistSection from './components/WaitlistSection';

export default function Home() {
  return (
    <main className="bg-mv-light text-mv-dark">
      <Hero />

      <section className="min-h-screen flex items-center justify-center px-6 py-20">
        <WaitlistSection />
      </section>
    </main>
  );
}
