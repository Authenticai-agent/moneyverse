'use client';

import { useMemo, useState } from 'react';
import MoneyTreeVisualizer from './MoneyTreeVisualizer';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateFutureValue(
  start: number,
  weekly: number,
  years: number,
  annualRatePercent: number,
  adjustForInflation: boolean
) {
  const inflationAdjustment = adjustForInflation ? 2.5 : 0;
  const rate = Math.max(0, annualRatePercent - inflationAdjustment) / 100;
  const weeks = years * 52;

  if (weeks === 0) return start;
  if (rate === 0) return start + weekly * weeks;

  const r = rate / 52;
  const future = start * Math.pow(1 + r, weeks) + weekly * ((Math.pow(1 + r, weeks) - 1) / r);
  return future;
}

export default function MoneyTreeForm() {
  const [startingAmount, setStartingAmount] = useState<number>(100);
  const [weeklySavings, setWeeklySavings] = useState<number>(10);
  const [years, setYears] = useState<number>(5);
  const [growthRate, setGrowthRate] = useState<number>(5);
  const [adjustForInflation, setAdjustForInflation] = useState<boolean>(false);

  const futureValue = useMemo(
    () => calculateFutureValue(startingAmount, weeklySavings, years, growthRate, adjustForInflation),
    [startingAmount, weeklySavings, years, growthRate, adjustForInflation]
  );

  const totalContributed = startingAmount + weeklySavings * years * 52;
  const simulatedGrowth = futureValue - totalContributed;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <h1 className="text-3xl md:text-4xl font-bold text-mv-primary mb-2">Money Tree Simulator</h1>
      <p className="text-mv-dark/70 mb-8">
        See how small, consistent savings can grow with simulated compound growth over time.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label htmlFor="starting" className="block text-sm font-medium text-mv-dark mb-1">
            Starting amount
          </label>
          <input
            id="starting"
            type="number"
            min={0}
            value={startingAmount}
            onChange={(e) => setStartingAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
        </div>

        <div>
          <label htmlFor="weekly" className="block text-sm font-medium text-mv-dark mb-1">
            Weekly savings
          </label>
          <input
            id="weekly"
            type="number"
            min={0}
            value={weeklySavings}
            onChange={(e) => setWeeklySavings(Number(e.target.value))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
        </div>

        <div>
          <label htmlFor="years" className="block text-sm font-medium text-mv-dark mb-1">
            Years
          </label>
          <input
            id="years"
            type="number"
            min={1}
            max={50}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
        </div>

        <div>
          <label htmlFor="rate" className="block text-sm font-medium text-mv-dark mb-1">
            Simulated growth rate (% per year)
          </label>
          <input
            id="rate"
            type="number"
            min={0}
            max={20}
            step={0.1}
            value={growthRate}
            onChange={(e) => setGrowthRate(Number(e.target.value))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <input
          id="inflation"
          type="checkbox"
          checked={adjustForInflation}
          onChange={(e) => setAdjustForInflation(e.target.checked)}
          className="h-5 w-5 rounded border-mv-lavender text-mv-primary focus:ring-mv-primary"
        />
        <label htmlFor="inflation" className="text-sm text-mv-dark">
          Adjust for inflation (estimate 2.5% per year)
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <div className="space-y-4">
          <div className="bg-mv-lavender/30 rounded-xl p-4">
            <p className="text-sm text-mv-dark/70">Future value</p>
            <p className="text-2xl font-bold text-mv-primary">{formatCurrency(futureValue)}</p>
          </div>
          <div className="bg-mv-lavender/30 rounded-xl p-4">
            <p className="text-sm text-mv-dark/70">Total contributed</p>
            <p className="text-xl font-semibold text-mv-dark">{formatCurrency(totalContributed)}</p>
          </div>
          <div className="bg-mv-lavender/30 rounded-xl p-4">
            <p className="text-sm text-mv-dark/70">Simulated growth</p>
            <p className="text-xl font-semibold text-mv-dark">{formatCurrency(simulatedGrowth)}</p>
          </div>
        </div>

        <MoneyTreeVisualizer futureValue={futureValue} years={years} />
      </div>

      <div className="mt-8 p-4 bg-mv-light rounded-xl text-sm text-mv-dark/80">
        <p className="font-medium mb-1">Educational note</p>
        <p>
          This is a simulation. Real investments go up and down, and past performance does not
          guarantee future results. The Money Tree shows how consistent saving and simulated
          compound growth can add up over time. No investment advice, no guaranteed returns,
          and no real bank connection is needed.
        </p>
      </div>
    </div>
  );
}
