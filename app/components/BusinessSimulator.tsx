'use client';

import { useState } from 'react';
import LemonadeStandGame from './LemonadeStandGame';
import BakeryPhase from './BakeryPhase';

export default function BusinessSimulator() {
  const [phase, setPhase] = useState<'lemonade' | 'bakery'>('lemonade');

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <h1 className="text-3xl md:text-4xl font-bold text-mv-primary mb-2">Business Simulator</h1>
      <p className="text-mv-dark/70 mb-6">
        Start with a lemonade stand, then grow into a bakery. Learn how price, costs, and customers affect profit.
      </p>

      <div className="flex rounded-lg border border-mv-lavender overflow-hidden mb-8">
        <button
          onClick={() => setPhase('lemonade')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            phase === 'lemonade' ? 'bg-mv-primary text-white' : 'bg-white text-mv-dark hover:bg-mv-lavender'
          }`}
        >
          Phase 1: Lemonade Stand
        </button>
        <button
          onClick={() => setPhase('bakery')}
          className={`flex-1 px-4 py-3 text-sm font-medium ${
            phase === 'bakery' ? 'bg-mv-primary text-white' : 'bg-white text-mv-dark hover:bg-mv-lavender'
          }`}
        >
          Phase 2: Bakery
        </button>
      </div>

      {phase === 'lemonade' && <LemonadeStandGame />}
      {phase === 'bakery' && <BakeryPhase />}
    </div>
  );
}
