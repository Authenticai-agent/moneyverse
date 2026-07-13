'use client';

import { useState } from 'react';
import BakeryPhase from './BakeryPhase';

export default function BusinessSimulator() {
  const [businessName, setBusinessName] = useState('Bakery');

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <h1 className="text-3xl md:text-4xl font-bold text-mv-primary mb-2">Business Simulator</h1>
      <p className="text-mv-dark/70 mb-6">
        Grow your own business. Choose a name, then set price, inventory, staff, and advertising to see how profit works.
      </p>

      <div className="mb-8">
        <label htmlFor="businessName" className="block text-sm font-medium text-mv-dark mb-1">
          Business name
        </label>
        <input
          id="businessName"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value || 'Bakery')}
          placeholder="e.g. Bakery, Bookstore, Cookie Shop"
          className="w-full rounded-lg border border-mv-lavender px-4 py-2 focus:outline-none focus:ring-2 focus:ring-mv-primary"
        />
      </div>

      <BakeryPhase businessName={businessName} />
    </div>
  );
}
