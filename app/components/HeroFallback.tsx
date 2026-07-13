'use client';

import { useState } from 'react';
import Link from 'next/link';
import AccessibleControls from './hero/AccessibleControls';

export default function HeroFallback() {
  const [announcement, setAnnouncement] = useState('');

  const handleBuildingFocus = (label: string, description: string) => {
    setAnnouncement(`${label}: ${description}`);
  };

  return (
    <div className="h-[60vh] w-full flex items-center justify-center bg-mv-light rounded-2xl border border-mv-lavender p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 mx-auto w-48 h-32 relative" aria-hidden="true">
          <svg viewBox="0 0 200 120" className="w-full h-full" role="img" aria-label="MoneyVerse world illustration">
            <ellipse cx="100" cy="100" rx="80" ry="20" fill="#5FD38D" />
            <polygon points="60,100 140,100 120,60 80,60" fill="#8B5A2B" />
            <rect x="70" y="50" width="20" height="20" fill="#60a5fa" />
            <polygon points="70,50 90,50 80,35" fill="#ef4444" />
            <rect x="120" y="55" width="20" height="15" fill="#f59e0b" />
            <rect x="95" y="70" width="15" height="12" fill="#facc15" />
            <rect x="50" y="55" width="18" height="25" fill="#a78bfa" />
            <rect x="140" y="55" width="18" height="25" fill="#3b82f6" />
            <circle cx="100" cy="45" r="12" fill="#22c55e" />
            <rect x="95" y="60" width="3" height="15" fill="#78350f" />
            <rect x="155" y="65" width="15" height="10" fill="#1e40af" />
            <line x1="170" y1="70" x2="170" y2="50" stroke="#e5e7eb" strokeWidth="2" />
            <polygon points="170,50 165,55 175,55" fill="#e5e7eb" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-mv-dark mb-2">MoneyVerse World</h2>
        <p className="text-mv-dark/70 mb-6">
          A safe 3D world where kids practice money before real money is on the line.
        </p>
        <div className="flex justify-center gap-4">
          <Link prefetch={false}
            href="/register"
            className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90"
          >
            Start Your Adventure
          </Link>
          <Link prefetch={false}
            href="/tools"
            className="px-6 py-3 rounded-lg border-2 border-mv-primary text-mv-primary font-medium hover:bg-mv-lavender"
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
    </div>
  );
}
