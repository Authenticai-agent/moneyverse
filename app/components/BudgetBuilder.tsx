'use client';

import { useMemo, useState } from 'react';
import BudgetChart from './BudgetChart';

const CATEGORIES = [
  { key: 'needs', label: 'Needs', color: '#6B4EFF', hint: 'Things you must have, like food or school supplies.' },
  { key: 'wants', label: 'Wants', color: '#FFD84D', hint: 'Fun things you would like but do not need.' },
  { key: 'save', label: 'Save', color: '#5FD38D', hint: 'Money you put away for the future.' },
  { key: 'give', label: 'Give', color: '#5CE1E6', hint: 'Money you share to help others or donate.' },
  { key: 'emergency', label: 'Emergency', color: '#ef4444', hint: 'Money kept ready for unexpected surprises.' },
  { key: 'goals', label: 'Goals', color: '#f59e0b', hint: 'Money saved for something special you want later.' },
  { key: 'spend', label: 'Spend', color: '#a78bfa', hint: 'Money you use for everyday small purchases.' },
];

export default function BudgetBuilder() {
  const [totalBudget, setTotalBudget] = useState(100);
  const [values, setValues] = useState<Record<string, number>>({
    needs: 35,
    wants: 15,
    save: 20,
    give: 10,
    emergency: 10,
    goals: 10,
    spend: 0,
  });

  const allocated = useMemo(
    () => Object.values(values).reduce((sum, v) => sum + v, 0),
    [values]
  );
  const remaining = totalBudget - allocated;

  const handleChange = (key: string, amount: number) => {
    setValues((prev) => ({ ...prev, [key]: Math.max(0, amount) }));
  };

  const suggestions = useMemo(() => {
    const items: string[] = [];
    if (remaining > 0) items.push(`You have $${remaining.toFixed(2)} left to allocate. Consider adding more to Save or Emergency.`);
    if (remaining < 0) items.push(`You are $${Math.abs(remaining).toFixed(2)} over budget. Look at Wants or Goals to reduce.`);
    if (values.save < totalBudget * 0.2) items.push('Saving at least 20% helps your Money Tree grow.');
    if (values.emergency < totalBudget * 0.1) items.push('An emergency fund of 10% or more can help with surprises.');
    if (values.give < totalBudget * 0.05) items.push('Giving even a small amount teaches generosity.');
    return items;
  }, [remaining, totalBudget, values]);

  const chartData = CATEGORIES.map((cat) => ({
    label: cat.label,
    amount: values[cat.key],
    color: cat.color,
  }));

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-mv-lavender">
      <h1 className="text-3xl md:text-4xl font-bold text-mv-primary mb-2">Kids Budget Builder</h1>
      <p className="text-mv-dark/70 mb-8">
        Split your money into Spend, Save, Give, Needs, Wants, Emergency, and Goals.
      </p>

      <div className="mb-8">
        <label htmlFor="totalBudget" className="block text-sm font-medium text-mv-dark mb-1">
          Total budget
        </label>
        <input
          id="totalBudget"
          type="number"
          min={1}
          value={totalBudget}
          onChange={(e) => setTotalBudget(Math.max(1, Number(e.target.value)))}
          className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
        />
        <p className="text-xs text-mv-dark/60 mt-1">The total amount of money you have to split up.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <label htmlFor={cat.key} className="block text-sm font-medium text-mv-dark mb-1">
              {cat.label}
            </label>
            <input
              id={cat.key}
              type="number"
              min={0}
              value={values[cat.key]}
              onChange={(e) => handleChange(cat.key, Number(e.target.value))}
              className="w-full rounded-lg border border-mv-lavender px-4 py-2 text-mv-dark focus:outline-none focus:ring-2 focus:ring-mv-primary"
            />
            <p className="text-xs text-mv-dark/60 mt-1">{cat.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-mv-lavender/30 rounded-xl p-4">
          <p className="text-sm text-mv-dark/70">Total budget</p>
          <p className="text-2xl font-bold text-mv-primary">${totalBudget.toFixed(2)}</p>
        </div>
        <div className="bg-mv-lavender/30 rounded-xl p-4">
          <p className="text-sm text-mv-dark/70">Allocated</p>
          <p className="text-2xl font-bold text-mv-primary">${allocated.toFixed(2)}</p>
        </div>
        <div className={`rounded-xl p-4 ${remaining >= 0 ? 'bg-mv-green/10' : 'bg-red-50'}`}>
          <p className="text-sm text-mv-dark/70">Remaining</p>
          <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-mv-green' : 'text-red-500'}`}>
            ${remaining.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <BudgetChart data={chartData} total={totalBudget} />
        <div className="bg-mv-light rounded-xl p-4">
          <h2 className="font-semibold text-mv-dark mb-2">Tradeoffs</h2>
          <ul className="list-disc list-inside text-sm text-mv-dark/80 space-y-1">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-sm text-mv-dark/70">
        Budgeting is about choices. Every dollar you put toward Save, Give, or Goals helps build your future.
      </p>
    </div>
  );
}
