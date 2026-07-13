'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { InteractiveHeroProps } from './InteractiveHero';
import AccessibleControls from './hero/AccessibleControls';

const InteractiveHero = dynamic<InteractiveHeroProps>(() => import('./InteractiveHero'), { ssr: false });

export default function Hero() {
  const [flyIn, setFlyIn] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const router = useRouter();

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (reducedMotion) {
      router.push('/register');
    } else {
      setFlyIn(true);
    }
  };

  const handleFlyInComplete = () => {
    router.push('/register');
  };

  const handleBuildingFocus = (label: string, description: string) => {
    setAnnouncement(`${label}: ${description}`);
  };

  return (
    <section className="relative min-h-screen max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div className="relative z-10">
        <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-mv-primary">
          Learn Money by Building Your Future
        </h1>
        <p className="mb-8 max-w-md text-lg text-mv-dark">
          MoneyVerse transforms financial education into an unforgettable adventure for kids, families, and classrooms.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleStart}
            className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90 focus:outline-none focus:ring-2 focus:ring-mv-primary focus:ring-offset-2"
            aria-label="Start Your Adventure. Triggers a cinematic fly-in before registration."
          >
            Start Your Adventure
          </button>
          <Link prefetch={false}
            href="/tools"
            className="px-6 py-3 rounded-lg border-2 border-mv-primary text-mv-primary font-medium hover:bg-mv-lavender focus:outline-none focus:ring-2 focus:ring-mv-primary focus:ring-offset-2"
          >
            Explore MoneyVerse
          </Link>
        </div>
        <p className="mt-4 text-sm text-mv-dark/70">
          No bank connection required. No ads. Built for safe learning.
        </p>
        <AccessibleControls onFocus={handleBuildingFocus} />
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
      </div>
      <InteractiveHero flyIn={flyIn} onFlyInComplete={handleFlyInComplete} />
    </section>
  );
}
