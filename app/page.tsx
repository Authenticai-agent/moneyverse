import Hero from './components/Hero';
import WaitlistSection from './components/WaitlistSection';

export default function Home() {
  return (
    <main className="min-h-[300vh] bg-mv-light text-mv-dark">
      <Hero />

      <div className="h-screen flex items-center justify-center px-6">
        <WaitlistSection />
      </div>
    </main>
  );
}
