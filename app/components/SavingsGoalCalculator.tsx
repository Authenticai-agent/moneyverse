'use client';

import { useMemo, useState } from 'react';
import SavingsGoalPlan from './SavingsGoalPlan';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function SavingsGoalCalculator() {
  const [goalName, setGoalName] = useState('New bike');
  const [target, setTarget] = useState(200);
  const [current, setCurrent] = useState(20);
  const [weekly, setWeekly] = useState(10);
  const [timeline, setTimeline] = useState(20);
  const [email, setEmail] = useState('');
  const [showPlan, setShowPlan] = useState(false);

  const remaining = Math.max(0, target - current);

  const weeksToGoal = useMemo(() => {
    if (weekly <= 0) return Infinity;
    return Math.ceil(remaining / weekly);
  }, [remaining, weekly]);

  const requiredWeekly = useMemo(() => {
    if (timeline <= 0) return 0;
    return remaining / timeline;
  }, [remaining, timeline]);

  const tradeoffs = useMemo(() => {
    const items: string[] = [];
    if (weekly > requiredWeekly) {
      items.push(`You are saving more than you need. You could reach your goal in ${weeksToGoal} weeks.`);
    } else if (weekly < requiredWeekly) {
      items.push(`To reach your goal in ${timeline} weeks, increase your weekly savings to ${formatCurrency(requiredWeekly)}.`);
    } else {
      items.push('Your plan is right on track.');
    }
    if (weekly > 0) {
      items.push(`That is about ${formatCurrency(weekly * 4.33)} per month.`);
    }
    return items;
  }, [weekly, requiredWeekly, timeline, weeksToGoal]);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <h1 className="text-3xl md:text-4xl font-bold text-mv-primary mb-2">Savings Goal Calculator</h1>
      <p className="text-mv-dark/70 mb-8">
        Plan how long it will take to save for something special.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label htmlFor="goalName" className="block text-sm font-medium text-mv-dark mb-1">
            Goal name
          </label>
          <input
            id="goalName"
            type="text"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
          <p className="text-xs text-mv-dark/60 mt-1">What you are saving for, like a bike or a new game.</p>
        </div>

        <div>
          <label htmlFor="target" className="block text-sm font-medium text-mv-dark mb-1">
            Target amount
          </label>
          <input
            id="target"
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
          <p className="text-xs text-mv-dark/60 mt-1">The total money you need to reach your goal.</p>
        </div>

        <div>
          <label htmlFor="current" className="block text-sm font-medium text-mv-dark mb-1">
            Current savings
          </label>
          <input
            id="current"
            type="number"
            min={0}
            value={current}
            onChange={(e) => setCurrent(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
          <p className="text-xs text-mv-dark/60 mt-1">How much money you already have saved.</p>
        </div>

        <div>
          <label htmlFor="weekly" className="block text-sm font-medium text-mv-dark mb-1">
            Weekly contribution
          </label>
          <input
            id="weekly"
            type="number"
            min={0}
            value={weekly}
            onChange={(e) => setWeekly(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
          <p className="text-xs text-mv-dark/60 mt-1">How much money you will put into savings each week.</p>
        </div>

        <div>
          <label htmlFor="timeline" className="block text-sm font-medium text-mv-dark mb-1">
            Timeline (weeks)
          </label>
          <input
            id="timeline"
            type="number"
            min={1}
            value={timeline}
            onChange={(e) => setTimeline(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
          <p className="text-xs text-mv-dark/60 mt-1">How many weeks you want to reach your goal.</p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-mv-dark mb-1">
            Parent email (optional)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="parent@example.com"
            className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
          />
          <p className="text-xs text-mv-dark/60 mt-1">An email to send a printable savings plan to a grown-up.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-mv-lavender/30 rounded-xl p-4">
          <p className="text-sm text-mv-dark/70">Remaining to save</p>
          <p className="text-2xl font-bold text-mv-primary">{formatCurrency(remaining)}</p>
        </div>
        <div className="bg-mv-lavender/30 rounded-xl p-4">
          <p className="text-sm text-mv-dark/70">Weeks to goal</p>
          <p className="text-2xl font-bold text-mv-primary">{weeksToGoal === Infinity ? '—' : weeksToGoal}</p>
        </div>
        <div className="bg-mv-lavender/30 rounded-xl p-4">
          <p className="text-sm text-mv-dark/70">Required weekly for timeline</p>
          <p className="text-2xl font-bold text-mv-primary">{formatCurrency(requiredWeekly)}</p>
        </div>
        <div className="bg-mv-lavender/30 rounded-xl p-4">
          <p className="text-sm text-mv-dark/70">Total saved at timeline</p>
          <p className="text-2xl font-bold text-mv-primary">
            {formatCurrency(current + weekly * timeline)}
          </p>
        </div>
      </div>

      <div className="mb-8 p-4 bg-mv-light rounded-xl">
        <h2 className="font-semibold text-mv-dark mb-2">Tradeoffs</h2>
        <ul className="list-disc list-inside text-sm text-mv-dark/80 space-y-1">
          {tradeoffs.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => setShowPlan((s) => !s)}
        className="px-6 py-3 rounded-lg bg-mv-primary text-white font-medium hover:bg-mv-primary/90"
      >
        {showPlan ? 'Hide printable plan' : 'Show printable plan'}
      </button>

      {showPlan && (
        <div className="mt-8">
          <SavingsGoalPlan
            goalName={goalName}
            target={target}
            current={current}
            weekly={weekly}
            weeksToGoal={weeksToGoal === Infinity ? 0 : weeksToGoal}
            requiredWeekly={requiredWeekly}
            email={email}
          />
        </div>
      )}
    </div>
  );
}
