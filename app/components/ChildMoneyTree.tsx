'use client';

import { useEffect, useMemo, useState } from 'react';
import MoneyTreeVisualizer from './MoneyTreeVisualizer';

interface Goal {
  id: string;
  title: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  status: string;
}

interface ChildMoneyTreeProps {
  childId: string;
}

function calculateFuture(start: number, weekly: number, years: number, rate: number) {
  const weeks = years * 52;
  const r = rate / 100 / 52;
  if (weeks === 0) return start;
  if (r === 0) return start + weekly * weeks;
  return start * Math.pow(1 + r, weeks) + weekly * ((Math.pow(1 + r, weeks) - 1) / r);
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function ChildMoneyTree({ childId }: ChildMoneyTreeProps) {
  const [child, setChild] = useState<{ nickname: string } | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [weeklyContribution, setWeeklyContribution] = useState(10);
  const [years, setYears] = useState(5);
  const [growthRate, setGrowthRate] = useState(3);

  useEffect(() => {
    async function load() {
      try {
        const [childRes, goalsRes, ledgerRes] = await Promise.all([
          fetch(`/api/families/current/children/${childId}`),
          fetch(`/api/families/current/children/${childId}/savings-goals`),
          fetch(`/api/families/current/children/${childId}/ledger?currency=simulated_cash`),
        ]);

        if (!childRes.ok || !goalsRes.ok || !ledgerRes.ok) {
          setError('Could not load Money Tree data.');
          return;
        }

        const childData = await childRes.json();
        const goalsData = await goalsRes.json();
        const ledgerData = await ledgerRes.json();

        setChild(childData.child);
        setGoals(goalsData.goals ?? []);
        setBalance(ledgerData.balance ?? 0);
      } catch {
        setError('Could not load Money Tree data.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [childId]);

  const totalSaved = balance / 100;
  const totalTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.targetAmountMinor, 0) / 100,
    [goals]
  );
  const allocatedToGoals = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.currentAmountMinor, 0) / 100,
    [goals]
  );

  const simulatedFuture = useMemo(
    () => calculateFuture(totalSaved, weeklyContribution, years, growthRate),
    [totalSaved, weeklyContribution, years, growthRate]
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mv-light">
        <p className="text-mv-dark">Loading Money Tree...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-mv-light">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <h1 className="text-3xl md:text-4xl font-bold text-mv-primary mb-2">
        {child?.nickname} Money Tree
      </h1>
      <p className="text-mv-dark/70 mb-8">
        Watch your savings grow like a tree. Small, steady contributions help it get bigger.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-mv-lavender/30 rounded-xl p-4">
          <p className="text-sm text-mv-dark/70">Total saved</p>
          <p className="text-2xl font-bold text-mv-primary">{formatCurrency(totalSaved)}</p>
        </div>
        <div className="bg-mv-lavender/30 rounded-xl p-4">
          <p className="text-sm text-mv-dark/70">Total goal target</p>
          <p className="text-2xl font-bold text-mv-primary">{formatCurrency(totalTarget)}</p>
        </div>
        <div className="bg-mv-lavender/30 rounded-xl p-4">
          <p className="text-sm text-mv-dark/70">Allocated to goals</p>
          <p className="text-2xl font-bold text-mv-primary">{formatCurrency(allocatedToGoals)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <label htmlFor="weekly" className="block text-sm font-medium text-mv-dark mb-1">
            Weekly contribution
          </label>
          <input
            id="weekly"
            type="number"
            min={0}
            value={weeklyContribution}
            onChange={(e) => setWeeklyContribution(Math.max(0, Number(e.target.value)))}
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
            onChange={(e) => setYears(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
        </div>
        <div>
          <label htmlFor="rate" className="block text-sm font-medium text-mv-dark mb-1">
            Simulated growth rate (%/year)
          </label>
          <input
            id="rate"
            type="number"
            min={0}
            max={20}
            step={0.1}
            value={growthRate}
            onChange={(e) => setGrowthRate(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
        </div>
      </div>

      <div className="bg-mv-light rounded-xl p-6 mb-8">
        <p className="text-sm text-mv-dark/70 mb-1">Simulated future value</p>
        <p className="text-3xl font-bold text-mv-primary">{formatCurrency(simulatedFuture)}</p>
        <p className="text-sm text-mv-dark/60 mt-2">
          This is a simulation, not a guaranteed return. Real growth goes up and down.
        </p>
      </div>

      <div className="mb-8">
        <MoneyTreeVisualizer futureValue={simulatedFuture} years={years} />
      </div>

      <h2 className="text-xl font-bold text-mv-dark mb-4">Savings goals</h2>
      <div className="space-y-3">
        {goals.length === 0 && (
          <p className="text-mv-dark/70">No goals yet. Ask a parent to add one.</p>
        )}
        {goals.map((goal) => {
          const progress = goal.targetAmountMinor > 0 ? goal.currentAmountMinor / goal.targetAmountMinor : 0;
          return (
            <div key={goal.id} className="bg-mv-light rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-mv-dark">{goal.title}</span>
                <span className="text-sm text-mv-dark/70">
                  {formatCurrency(goal.currentAmountMinor / 100)} / {formatCurrency(goal.targetAmountMinor / 100)}
                </span>
              </div>
              <div className="h-3 w-full bg-mv-lavender/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-mv-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, progress * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
